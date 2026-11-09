/**
 * Path-scoped rule matching for the CCGS Pi port.
 *
 * Kept dependency-free (only node builtins) so it can be unit-tested with
 * `node --experimental-strip-types` outside the Pi runtime.
 */

import fs from "node:fs";
import path from "node:path";

// --- path-scoped rules -------------------------------------------------------
//
// Claude Code attached `.pi/rules/*.md` when a file matching their `paths:`
// globs was read. Pi loads context files by directory, so the equivalent is
// this: match the globs on read/write/edit and inject the rule once per session.

type Rule = { name: string; patterns: RegExp[]; text: string };

function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
      } else out += "[^/]*";
    } else if (c === "?") out += "[^/]";
    else if (c === "{") {
      const close = glob.indexOf("}", i);
      if (close === -1) out += "\\{";
      else {
        out += "(" + glob.slice(i + 1, close).split(",").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")";
        i = close;
      }
    } else if ("\\^$.|+()[]".includes(c)) out += "\\" + c;
    else out += c;
  }
  return new RegExp("^" + out + "$");
}

function loadRules(root: string): Rule[] {
  const dir = path.join(root, ".pi", "rules");
  if (!fs.existsSync(dir)) return [];
  const rules: Rule[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!m) continue;
    const patterns: RegExp[] = [];
    let inPaths = false;
    for (const line of m[1].split(/\r?\n/)) {
      if (/^paths:\s*$/.test(line)) {
        inPaths = true;
        continue;
      }
      const item = line.match(/^\s+-\s*["']?(.+?)["']?\s*$/);
      if (inPaths && item) patterns.push(globToRegExp(item[1]));
      else if (inPaths && !/^\s/.test(line)) inPaths = false;
    }
    if (!patterns.length) continue; // a rule with no paths: is always-on by design; AGENTS.md owns that now
    rules.push({ name: file.replace(/\.md$/, ""), patterns, text: text.slice(m[0].length).trim() });
  }
  return rules;
}

function matchRules(rules: Rule[], relPath: string): Rule[] {
  const norm = relPath.replace(/\\/g, "/").replace(/^\.\//, "");
  return rules.filter((r) => r.patterns.some((p) => p.test(norm)));
}

export type { Rule };
export { loadRules, matchRules, globToRegExp };
