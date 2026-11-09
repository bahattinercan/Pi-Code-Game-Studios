/**
 * CCGS hook parity for Pi.
 *
 * Claude Code ran the scripts in `.pi/hooks/` on its own event model. Pi has no
 * hook config file, so this extension is the adapter: it feeds each script the
 * same JSON payload Claude Code did, and turns the result back into a Pi
 * decision (block a tool call, inject context, notify the user).
 *
 * The scripts are untouched. They read `{tool_name, tool_input, cwd}` on stdin,
 * exit 2 to block, and print `{systemMessage, hookSpecificOutput:
 * {additionalContext}}` for a warning that somebody actually sees.
 *
 * Event map:
 *   (any tool_call)         -> ccgs-guard.ts first: the original permissions.deny
 *   session_start          -> session-start.sh, detect-gaps.sh (+ rules index)
 *   tool_call  bash        -> validate-commit.sh (blocking), validate-push.sh
 *   tool_call  read        -> validate-read.sh (blocking), path-scoped rules
 *   tool_call  write|edit  -> validate-write.sh, validate-registry.sh, rules
 *   tool_result write|edit -> validate-assets.sh, validate-skill-change.sh
 *   session_before_compact -> pre-compact.sh
 *   agent_end              -> session-stop.sh
 *
 * Not mapped: log-agent.sh / log-agent-stop.sh / validate-agent-artifact.sh.
 * Those fired on Claude Code's SubagentStart/SubagentStop; Pi's subagents are
 * workflow-managed and expose no start/stop hook, so that audit trail is gone
 * rather than faked. See PORTING.md.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { type Rule, loadRules, matchRules } from "./ccgs-rules.ts";
import { checkCommand, checkPath } from "./ccgs-guard.ts";

type HookResult = { code: number; stdout: string; stderr: string };
type HookJson = { systemMessage?: string; additionalContext?: string };

const HOOK_TIMEOUT_MS = 20_000;

/** Project root: the directory holding project.yaml, walking up from cwd. */
function findRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (fs.existsSync(path.join(dir, "project.yaml"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return start;
    dir = up;
  }
}

function runScript(root: string, script: string, payload: unknown): Promise<HookResult> {
  const abs = path.join(root, ".pi", "hooks", script);
  if (!fs.existsSync(abs)) return Promise.resolve({ code: 0, stdout: "", stderr: "" });

  return new Promise((resolve) => {
    const env = { ...process.env, CCGS_ROOT: root };
    const child = spawn("bash", [abs], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    };

    const timer = setTimeout(() => {
      child.kill();
      finish(0); // a hanging hook must never wedge the agent
    }, HOOK_TIMEOUT_MS);

    child.stdout.on("data", (b) => (stdout += String(b)));
    child.stderr.on("data", (b) => (stderr += String(b)));
    child.on("error", () => finish(0));
    child.on("close", (code) => finish(code ?? 0));
    child.stdin.on("error", () => {});
    child.stdin.end(JSON.stringify(payload));
  });
}

/** The scripts print one JSON object for warnings; plain text is a fallback. */
function parseHookJson(stdout: string): HookJson | undefined {
  const line = stdout.split("\n").find((l) => l.trim().startsWith("{"));
  if (!line) return undefined;
  try {
    const parsed = JSON.parse(line) as {
      systemMessage?: string;
      hookSpecificOutput?: { additionalContext?: string };
    };
    const additionalContext = parsed.hookSpecificOutput?.additionalContext;
    if (!parsed.systemMessage && !additionalContext) return undefined;
    return { systemMessage: parsed.systemMessage, additionalContext };
  } catch {
    return undefined;
  }
}

// --- extension ---------------------------------------------------------------

export default function (pi: ExtensionAPI) {
  let root = process.cwd();
  let rules: Rule[] = [];
  const injected = new Set<string>();

  const payload = (ctx: ExtensionContext, extra: Record<string, unknown>) => ({
    session_id: process.env.PI_SESSION_ID ?? "",
    transcript_path: process.env.PI_SESSION_FILE ?? "",
    cwd: ctx.cwd,
    ...extra,
  });

  /** Surface a hook's verdict. Returns a block reason when the hook blocked. */
  const applyResult = async (
    ctx: ExtensionContext,
    result: HookResult,
    label: string,
  ): Promise<string | undefined> => {
    const json = parseHookJson(result.stdout);
    if (json?.systemMessage) ctx.ui.notify(`${label}: ${json.systemMessage.split("\n")[0]}`, "warning");
    if (json?.additionalContext) {
      pi.sendMessage({ customType: "ccgs-hook", content: json.additionalContext, display: true });
    }
    if (result.code === 2) {
      const reason = (result.stderr || result.stdout || `${label} blocked this call`).trim();
      ctx.ui.notify(`${label} blocked the call`, "error");
      return reason;
    }
    return undefined;
  };

  pi.on("session_start", async (_event, ctx) => {
    root = findRoot(ctx.cwd);
    rules = loadRules(root);
    injected.clear();
    for (const script of ["session-start.sh", "detect-gaps.sh"]) {
      const res = await runScript(root, script, payload(ctx, { hook_event_name: "SessionStart" }));
      const text = (res.stdout || "").trim();
      if (text) pi.sendMessage({ customType: "ccgs-hook", content: text, display: true });
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    const base = { hook_event_name: "PreToolUse" };

    if (isToolCallEventType("bash", event)) {
      // permissions.deny from the original settings, checked before any script:
      // this is the one slot that can refuse a command outright.
      const denied = checkCommand(event.input.command);
      if (denied) {
        ctx.ui.notify("Denied by the project guard", "error");
        return { block: true, reason: denied.reason };
      }
      const tool_input = { command: event.input.command, timeout: event.input.timeout };
      const commit = await runScript(root, "validate-commit.sh", payload(ctx, { ...base, tool_name: "Bash", tool_input }));
      const blocked = await applyResult(ctx, commit, "validate-commit");
      if (blocked) return { block: true, reason: blocked };
      const push = await runScript(root, "validate-push.sh", payload(ctx, { ...base, tool_name: "Bash", tool_input }));
      await applyResult(ctx, push, "validate-push");
      // push warnings never block, matching the script's own contract
      return;
    }

    if (isToolCallEventType("read", event)) {
      const deniedRead = checkPath("read", event.input.path);
      if (deniedRead) {
        ctx.ui.notify("Denied by the project guard", "error");
        return { block: true, reason: deniedRead.reason };
      }
      const tool_input = { file_path: event.input.path, offset: event.input.offset, limit: event.input.limit };
      const res = await runScript(root, "validate-read.sh", payload(ctx, { ...base, tool_name: "Read", tool_input }));
      const blocked = await applyResult(ctx, res, "validate-read");
      if (blocked) return { block: true, reason: blocked };
      injectRules(ctx, event.input.path);
      return;
    }

    if (isToolCallEventType("write", event)) {
      const deniedWrite = checkPath("write", event.input.path);
      if (deniedWrite) {
        ctx.ui.notify("Denied by the project guard", "error");
        return { block: true, reason: deniedWrite.reason };
      }
      const tool_input = { file_path: event.input.path, content: event.input.content };
      const guard = await runScript(root, "validate-write.sh", payload(ctx, { ...base, tool_name: "Write", tool_input }));
      const blocked = await applyResult(ctx, guard, "validate-write");
      if (blocked) return { block: true, reason: blocked };
      const registry = await runScript(root, "validate-registry.sh", payload(ctx, { ...base, tool_name: "Write", tool_input }));
      await applyResult(ctx, registry, "validate-registry");
      injectRules(ctx, event.input.path);
      return;
    }

    if (isToolCallEventType("edit", event)) {
      const deniedEdit = checkPath("edit", event.input.path);
      if (deniedEdit) {
        ctx.ui.notify("Denied by the project guard", "error");
        return { block: true, reason: deniedEdit.reason };
      }
      const tool_input = { file_path: event.input.path, old_string: event.input.oldText, new_string: event.input.newText };
      const guard = await runScript(root, "validate-write.sh", payload(ctx, { ...base, tool_name: "Edit", tool_input }));
      const blocked = await applyResult(ctx, guard, "validate-write");
      if (blocked) return { block: true, reason: blocked };
      const registry = await runScript(root, "validate-registry.sh", payload(ctx, { ...base, tool_name: "Edit", tool_input }));
      await applyResult(ctx, registry, "validate-registry");
      injectRules(ctx, event.input.path);
      return;
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    const rel = (p?: string) => {
      if (!p) return "";
      return path.relative(root, path.resolve(ctx.cwd, p)).replace(/\\/g, "/");
    };

    let tool_input: Record<string, unknown> | undefined;
    let toolName: string | undefined;
    if (isToolCallEventType("write", event)) {
      toolName = "Write";
      tool_input = { file_path: event.input.path, content: event.input.content };
    } else if (isToolCallEventType("edit", event)) {
      toolName = "Edit";
      tool_input = { file_path: event.input.path, old_string: event.input.oldText, new_string: event.input.newText };
    } else return;

    const file = String(tool_input.file_path ?? "");
    if (!file) return;
    const payloadFor = payload(ctx, {
      hook_event_name: "PostToolUse",
      tool_name: toolName,
      tool_input: { ...tool_input, file_path: rel(file) },
    });

    for (const script of ["validate-assets.sh", "validate-skill-change.sh"]) {
      const res = await runScript(root, script, payloadFor);
      await applyResult(ctx, res, script.replace(/\.sh$/, ""));
    }
  });

  pi.on("session_before_compact", async (_event, ctx) => {
    await runScript(root, "pre-compact.sh", payload(ctx, { hook_event_name: "PreCompact" }));
  });

  pi.on("agent_end", async (_event, ctx) => {
    // Background archiving; the agent must not wait on it.
    void runScript(root, "session-stop.sh", payload(ctx, { hook_event_name: "Stop" }));
  });

  function injectRules(ctx: ExtensionContext, filePath: string) {
    if (!rules.length || !filePath) return;
    const rel = path.relative(root, path.resolve(ctx.cwd, filePath)).replace(/\\/g, "/");
    if (rel.startsWith("..")) return; // outside the project
    for (const rule of matchRules(rules, rel)) {
      if (injected.has(rule.name)) continue;
      injected.add(rule.name);
      pi.sendMessage({
        customType: "ccgs-rule",
        content: `Path-scoped rule \`${rule.name}\` applies to \`${rel}\`:\n\n${rule.text}`,
        display: true,
      });
    }
  }
}
