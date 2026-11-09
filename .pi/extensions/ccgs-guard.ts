/**
 * CCGS permission guard for Pi.
 *
 * Claude Code enforced `permissions.deny` in `.claude/settings.json` — 130 glob
 * entries that reduced to about ten rules with every CLI-flag permutation
 * spelled out. Pi has no settings-level deny list, so the same intent lives
 * here and runs on `tool_call`, which can actually block.
 *
 * Why not port the 130 globs literally: matching "anywhere after `git`" denied
 * `git commit -m "push + pull"` (upstream documents this as a trade — "reword
 * the message"). Parsing the subcommand and its flags blocks the dangerous call
 * and allows the commit message, so this port is deliberately narrower than the
 * original. Everything the original blocked as a dangerous operation is still
 * blocked; see tools/test-guard.mjs for the cases both ways.
 *
 * Dependency-free (node builtins only) so it can be unit-tested with
 * `node --experimental-strip-types` outside the Pi runtime.
 */

import path from "node:path";

export type Denial = { reason: string };

const SEPARATORS = new Set([";", "&&", "||", "|", "&", "\n"]);

/**
 * Split a shell command into token arrays, one per simple command.
 *
 * Quotes are honoured, so `git commit -m "rm -rf build"` yields a single quoted
 * token rather than a fake `rm` command. Only a segment's own tokens are
 * inspected — text inside a quoted argument is never treated as a command.
 */
export function segments(command: string): string[][] {
  const out: string[][] = [];
  let tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;

  const pushToken = () => {
    if (started) tokens.push(current);
    current = "";
    started = false;
  };
  const pushSegment = () => {
    pushToken();
    if (tokens.length) out.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < command.length; i++) {
    const c = command[i];

    if (quote) {
      if (c === "\\" && quote === '"' && i + 1 < command.length) {
        current += command[++i];
        started = true;
        continue;
      }
      if (c === quote) {
        quote = null;
        // keep the token marked as started even for an empty string argument
        started = true;
        continue;
      }
      current += c;
      started = true;
      continue;
    }

    if (c === '"' || c === "'") {
      quote = c;
      started = true;
      continue;
    }
    if (c === "\\" && i + 1 < command.length) {
      current += command[++i];
      started = true;
      continue;
    }
    if (c === " " || c === "\t") {
      pushToken();
      continue;
    }
    if (c === "$" && command[i + 1] === "(") {
      pushSegment();
      i++;
      continue;
    }
    if ("()".includes(c)) {
      pushSegment();
      continue;
    }
    if (command.startsWith("&&", i) || command.startsWith("||", i)) {
      pushSegment();
      i++;
      continue;
    }
    if (SEPARATORS.has(c)) {
      pushSegment();
      continue;
    }
    current += c;
    started = true;
  }
  pushSegment();
  return out;
}

const isFlag = (t: string) => t.startsWith("-") && t !== "-";

/**
 * `rm -rf*` and `git clean -f*` appear in the original deny list: a trailing
 * glob on a flag (usually a typo for `-rf/`) still expands to destructive
 * arguments, so the star is stripped before the flag is classified. The cost is
 * a file literally named `-rf*`, which is not worth protecting.
 */
const normalizeFlag = (t: string) => t.replace(/\*+$/, "");

/** `-rf`, `-fR`, `-r -f`, `--recursive --force` — recursive AND force. */
function destructiveRm(tokens: string[]): boolean {
  const flags = tokens.filter(isFlag).map(normalizeFlag);
  const long = (name: string) => flags.some((f) => f === name);
  if ((long("--recursive") || flags.some((f) => /^-[a-zA-Z]*[rR][a-zA-Z]*$/.test(f))) &&
      (long("--force") || flags.some((f) => /^-[a-zA-Z]*f[a-zA-Z]*$/.test(f)))) {
    return true;
  }
  return false;
}

/** A forced push: `--force`, `-f`, `-uf`, `--force-with-lease`, or a `+refspec`. */
function forcedPush(rawArgs: string[]): boolean {
  const args = rawArgs.map(normalizeFlag);
  for (const a of args) {
    if (a === "--force" || a.startsWith("--force-with-lease") || a === "--force-if-includes") return true;
    if (/^-[a-zA-Z]*f[a-zA-Z]*$/.test(a)) return true;
    if (a.startsWith("+") && !a.startsWith("++")) return true;
    if (a.startsWith("--force")) return true;
  }
  return false;
}

function forcedClean(rawArgs: string[]): boolean {
  const args = rawArgs.map(normalizeFlag);
  for (const a of args) {
    if (a === "--force") return true;
    if (/^-[a-zA-Z]*f[a-zA-Z]*$/.test(a)) return true;
    if (/^--[a-z-]*force/.test(a)) return true;
  }
  return false;
}

/**
 * Inspect one simple command. Returns a denial, or undefined when it is fine.
 */
function checkSegment(tokens: string[]): Denial | undefined {
  if (!tokens.length) return undefined;

  // sudo anywhere in command position, including `env sudo`
  const head = tokens[0];
  if (path.basename(head) === "sudo") {
    return { reason: "sudo is denied: it escalates past the project sandbox and every later check." };
  }

  const base = path.basename(head);
  const args = tokens.slice(1);

  if (base === "rm") {
    if (destructiveRm(args)) {
      return { reason: "rm with recursive + force is denied. Remove specific files, or delete the directory from outside the session." };
    }
    return undefined;
  }

  if (base === "chmod" && args.some((a) => /^0?777$/.test(a))) {
    return { reason: "chmod 777 is denied: world-writable files in a repository are a supply-chain hole." };
  }

  if (base === "git") {
    // skip git's own global flags (-C dir, --no-pager, -c key=value …)
    let i = 0;
    while (i < args.length && isFlag(args[i])) {
      i += args[i] === "-C" || args[i] === "-c" ? 2 : 1;
    }
    const sub = args[i];
    const rest = args.slice(i + 1);
    if (sub === "push" && forcedPush(rest)) {
      return { reason: "A forced push is denied. It rewrites published history; if it is truly required, the user runs it themselves." };
    }
    if (sub === "reset" && rest.map(normalizeFlag).includes("--hard")) {
      return { reason: "git reset --hard is denied: it discards uncommitted work with no recovery path. Use git stash or git restore on named files." };
    }
    if (sub === "clean" && forcedClean(rest)) {
      return { reason: "git clean -f is denied: it deletes untracked files irreversibly. List them with git clean -n first and remove named paths." };
    }
  }

  // PowerShell Remove-Item -Recurse, reachable from bash via powershell -c
  const joined = tokens.join(" ").toLowerCase();
  if (joined.includes("remove-item") && /(-recurse\b|\s-r\b)/.test(joined)) {
    return { reason: "PowerShell Remove-Item -Recurse is denied: same irreversibility as rm -rf." };
  }

  return undefined;
}

/** Inspect a whole command line. */
export function checkCommand(command: string): Denial | undefined {
  for (const tokens of segments(command)) {
    const denial = checkSegment(tokens);
    if (denial) return denial;
  }
  return undefined;
}

const SECRET_NAMES = [/^\.env$/i, /^\.env\..+/i];

/**
 * Path denials from the original settings: `.env*` is never read or written
 * (the `Read` and `Edit` deny entries for .env paths), and Unreal's binary
 * assets are never hand-edited (`.uasset`, `.umap`) — they corrupt silently when
 * edited as text, and only the editor can rewrite them.
 */
export function checkPath(toolName: string, filePath: string): Denial | undefined {
  const norm = filePath.replace(/\\/g, "/");
  const name = norm.split("/").pop() ?? norm;

  const writeLike = toolName === "write" || toolName === "edit";
  const readLike = toolName === "read";

  if ((readLike || writeLike) && SECRET_NAMES.some((re) => re.test(name))) {
    return {
      reason: `${name} is a secrets file, denied by the original Read and Edit rules for .env paths. Ask the user for the specific value instead of reading the file.`,
    };
  }

  if (writeLike && /\.(uasset|umap)$/i.test(name)) {
    return {
      reason: `${name} is an Unreal binary asset. Editing it as text corrupts it; change it in the editor.`,
    };
  }

  return undefined;
}
