# Pi port — status

This repository —
[bahattinercan/Pi-Code-Game-Studios](https://github.com/bahattinercan/Pi-Code-Game-Studios)
— is a fork of
[Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
1.2.0, converted to run under [Pi](https://pi.dev) instead of Claude Code.

Claude Code and Pi share the skill file format — both implement the
[Agent Skills specification](https://agentskills.io/specification) — so the
skills survive with a mechanical rewrite. What they do not share is everything
around them: the directory Pi reads, inline shell in skill bodies, per-skill
model selection, the hook event model, and path-scoped rule loading.

`upstream` is the original repository; `origin` is the fork. Pulling upstream is
possible, but expect conflicts in `.pi/` on every release — the paths differ by
design.

---

## Done

### 1. `.claude/` → `.pi/`

Pi reads project config, skills, prompts, extensions and themes from `.pi/`, and
context files from `AGENTS.md` (or `CLAUDE.md`). The whole tree moved, and every
path reference in scripts, docs, skills, rules and `studio-tests/` was rewritten
— 1661 occurrences across 329 files.

`CLAUDE.md` became `AGENTS.md` at the root and in `design/`, `docs/`, `src/`,
`studio-tests/`.

### 2. `CLAUDE_PROJECT_DIR` → `CCGS_ROOT`

Claude Code exported the project directory as an environment variable; Pi does
not. Every shell file that depended on it now resolves the root itself:

```bash
CCGS_ROOT="${CCGS_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
```

21 files, injected after the shebang. All 54 shell files pass `bash -n`, and
`.pi/hooks/yaml-helper.sh resolve_config` returns the real config.

### 3. Inline shell execution removed

Claude Code ran `` !`bash ...` `` lines in a skill body before the skill loaded.
Pi has no equivalent. The 72 affected skills now open with an explicit **Step 0**
block naming the command and stating that its output is the resolved config:

````markdown
**Step 0 — resolve config.** Run this before anything else and use its output as-is
for the values it names:

```bash
bash ".pi/hooks/yaml-helper.sh" resolve_config --keys automation,workflow,qa.level
```
````

This costs one tool call per skill run. It is the honest trade: the config is no
longer pre-resolved, so the skill has to say so instead of assuming it.

### 4. Frontmatter reduced to the spec

Dropped from all 74 skills: `model`, `allowed-tools`, `argument-hint`,
`user-invocable`. None is a Pi skill field, and `allowed-tools` encoded Claude
Code's tool syntax (`Bash(bash "*/.claude/skills/...")`), which Pi would not read
as a restriction — keeping it would have looked like a safety property that was
not there.

Kept: `name`, `description`, `disable-model-invocation`.

### 5. `/name` → `/skill:name`

944 cross-skill references. Pi registers skills as `/skill:<name>` commands, so
`/skill:dev-story` is `/skill:dev-story`. Note that `/skill:settings` and
`/skill:changelog` do not collide with Pi's built-in `/skill:settings` and `/skill:changelog`.

### 6. Always-on constraints, generated

`CLAUDE.md` used `@path` imports to keep four documents permanently in context.
Pi has no import syntax for context files. They are now concatenated into
`.pi/APPEND_SYSTEM.md`, which Pi appends to the system prompt — same effect, one
generated file:

```bash
node tools/build-append-system.mjs          # rebuild
node tools/build-append-system.mjs --check  # CI gate: fail if stale
```

Cost: ~14.8 KB (~3.7k tokens) of every session's system prompt. That is what
Claude Code was already paying for the same four imports.

---

## Ported in the same pass

### 7. Hooks — `.pi/extensions/ccgs-hooks.ts`

Claude Code ran the scripts in `.pi/hooks/` on its own event model and read the
event config out of `settings.json`. Pi has neither, so the scripts are unchanged
and **this extension feeds them the payload Claude Code used to**: `{tool_name,
tool_input, cwd}` on stdin, exit 2 to block, `{systemMessage,
hookSpecificOutput.additionalContext}` for a warning.

| Pi event | Scripts | Effect |
|---|---|---|
| `session_start` | `session-start.sh`, `detect-gaps.sh` | Branch orientation and gap nudges, injected as a message |
| `tool_call` · bash | `validate-commit.sh` (**blocking**), `validate-push.sh` | Commit shape and protected-branch warnings |
| `tool_call` · read | `validate-read.sh` (**blocking**) | Refuses a whole-file read of a design doc over the size bar, answers with its headings |
| `tool_call` · write/edit | `validate-write.sh`, `validate-registry.sh` | Warnings the rules used to give |
| `tool_result` · write/edit | `validate-assets.sh`, `validate-skill-change.sh` | Asset naming, data JSON, and the `/skill:skill-test` nudge |
| `session_before_compact` | `pre-compact.sh` | Compaction logged before it happens |
| `agent_end` | `session-stop.sh` | Checkpoint archiving, fire and forget |

Pi's `tool_call` can block, which is closer to the Claude Code contract than a
warning, so the read guard and the commit check now genuinely stop the call.
Every hook gets a 20 s ceiling: a hanging script cannot wedge the agent.

The field names needed one translation — Pi's tools take `path`, `oldText`,
`newText`, where the scripts expect `file_path`, `old_string`, `new_string`.

**Not mapped, on purpose**

- `log-agent.sh`, `log-agent-stop.sh`, `validate-agent-artifact.sh` fired on
  `SubagentStart`/`SubagentStop`. Pi's subagents are workflow-managed and emit no
  start/stop hook, so there is no honest place to attach them. The audit trail is
  **gone**, not faked.
- `notify.sh` raised a Windows toast when a permission prompt appeared. Pi draws
  that prompt in its own UI; a second toast is noise.
- `update-check.sh` asked GitHub for upstream's latest release. In a fork that
  reports the wrong project's versions, so it stays off.

### 8. Agents — the 49 definitions are now loadable

Pi's workflow extension already scans `.pi/agents/*.md` and binds `name`,
`description`, `tools`, `disallowedTools`, `model`, `thinking`, `isolation` plus
the body as the subagent's prompt — the same shape Claude Code used. So this was
frontmatter surgery, not a rewrite:

- `tools:` mapped to Pi's coding tools — `Read`→`read`, `Write`→`write`,
  `Edit`→`edit`, `Grep`→`grep`, `Glob`→`find`, `Bash`→`bash`.
- `WebSearch` and `Agent` dropped: the former is a host-extension tool that
  subagents do not load, the latter would be recursion.
- `model:` and `maxTurns:` dropped. `maxTurns` is not a registry field, and a
  `model:` alias (`sonnet`, `opus`) is **not** resolvable by Pi's model registry —
  an explicit unresolvable model throws on dispatch rather than falling back.

Verified by parsing all 49 with Pi's own `parseFrontmatter` plus the registry's
field rules: 49 definitions, tools `bash, edit, find, grep, read, write`, no
problems. They are reachable as `agent("…", { agentType: "creative-director" })`.

**What that costs:** the three directors used to pin `opus` and the sixteen
specialists `sonnet`. Now every subagent inherits the orchestrating session's
model, and a workflow asks for a bigger one per call (`{ tier: "big" }`). See
`.pi/docs/model-tiers.md` for the classification that replaces the pins.

### 9. Path-scoped rules — `.pi/extensions/ccgs-rules.ts`

The 14 rule files still carry `paths:` globs. The extension matches them on
`read`, `write` and `edit` and injects a matching rule once per session, as a
message — the same "context, not enforcement" semantic, and slightly wider than
Claude Code's read-only trigger, which never fired when a file was created in a
watched directory.

Glob translation covers `**`, `*`, `?` and `{a,b}`, and the tests in
`tools/test-rules.mjs` run against the real rule files:

```bash
node --experimental-strip-types tools/test-rules.mjs
```

A rule with no `paths:` is not injected by the extension — always-on constraints
live in `AGENTS.md` and the generated `.pi/APPEND_SYSTEM.md`, which is where Pi
actually reads them.

### 10. `studio-tests/` rubrics moved to Pi conventions

The rubrics asserted Claude Code conventions, so they would have failed correct
skills. Changes:

- 49 agent specs: "Model tier is `opus`" became "no `model:` in frontmatter — the
  subagent inherits the session model".
- `skill-test` checks 1, 4, 6 and 7: required fields are `name` + `description`
  and the Claude-only keys are now **forbidden**; the `allowed-tools` guard is
  read from the body instead; check 6 asks for a **Step 0** block where config is
  resolved and fails on any surviving `` !` `` line; check 7 replaces
  `argument-hint` with "the body must state the argument fallback".
- `templates/agent-test-spec.md` and `quality-rubric.md` follow the same rules.

The catalog is structurally consistent again, but the score has not been
re-earned by a real `/skill:skill-test audit` run — treat it as unproven until
someone does.

## Deliberately not ported

- **Status line** — `.pi/statusline.sh` (context %, model, stage, epic
  breadcrumb) has no Pi counterpart. Pi's footer extensions own that surface
  (`pi-powerline-footer` in this environment). The script is kept for reference.
- **`.pi/docs/reference/claude-code-settings.json`** — the original settings,
  kept pristine. It is not a Pi settings file and nothing reads it. Its deny list
  is still only a list: Pi's permission surface is `tool_call` in the extension,
  and the deny entries have not been re-expressed there yet.

## Still unproven

- The extension has never run inside a live Pi session. Its logic is tested
  against the scripts' real contract and its matcher against the real globs, but
  the event wiring itself is untested end to end.
- No workflow run has dispatched an `agentType` from this registry yet.

## Verification

Run from the repository root:

```bash
bash tools/verify-port.sh                          # all 10 gates
```

The gate checks shell syntax, a real `resolve_config` call, the generated
`APPEND_SYSTEM.md`, all 74 skill frontmatters, Claude leftovers, the settings
file, all 49 agent definitions, that both extension modules parse, the rule
matcher against the real rule files, and two live hook scripts — one warning
(`systemMessage` JSON) and one block (read guard, exit 2).

Individual checks, for when one gate fails:

```bash
bash -n .pi/hooks/*.sh .pi/scripts/*.sh                    # shell syntax
bash .pi/hooks/yaml-helper.sh resolve_config --keys automation,workflow,qa.level
node tools/build-append-system.mjs --check                 # generated file current
node --experimental-strip-types tools/test-rules.mjs       # rule matcher
```
