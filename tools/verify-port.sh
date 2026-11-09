#!/bin/bash
# Port gate: proves the Pi conversion holds. Run from the repository root.
#
#   bash tools/verify-port.sh
#
# Every check prints its own verdict; the script never stops at the first
# failure, so one run shows everything that is broken. It writes only inside
# design/gdd for the read-guard probe, and removes it again.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

fail=0
ok()  { printf '  ok   %s\n' "$1"; }
bad() { printf '  FAIL %s\n' "$1"; fail=1; }

echo "1. shell syntax (hooks + scripts)"
n=0
for f in .pi/hooks/*.sh .pi/scripts/*.sh; do
  [ -f "$f" ] || continue
  if bash -n "$f" 2>/dev/null; then n=$((n+1)); else bad "$f"; fi
done
[ "$n" -gt 0 ] && ok "$n files parse"

echo "2. config resolution (the Step 0 every skill runs)"
out=$(bash .pi/hooks/yaml-helper.sh resolve_config --keys automation,workflow,qa.level 2>&1)
if printf '%s' "$out" | grep -q '^workflow:'; then
  ok "$(printf '%s' "$out" | grep -c ':') keys resolved"
else
  bad "resolve_config returned nothing usable"
  printf '%s\n' "$out" | sed 's/^/       /'
fi

echo "3. generated always-on constraints"
if node tools/build-append-system.mjs --check >/dev/null 2>&1; then
  ok ".pi/APPEND_SYSTEM.md is current"
else
  bad "stale — run node tools/build-append-system.mjs"
fi

echo "4. skills"
node --input-type=module -e '
import fs from "node:fs";
import path from "node:path";
const dir = ".pi/skills";
let count = 0;
const bad = [];
for (const name of fs.readdirSync(dir)) {
  const f = path.join(dir, name, "SKILL.md");
  if (!fs.existsSync(f)) continue;
  count++;
  const t = fs.readFileSync(f, "utf8");
  const m = t.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) { bad.push(`${name}: no frontmatter`); continue; }
  if (!/^name:\s*\S/m.test(m[1])) bad.push(`${name}: no name`);
  if (!/^description:\s*\S/m.test(m[1])) bad.push(`${name}: no description`);
  if (/^(model|allowed-tools|argument-hint|user-invocable|maxTurns):/m.test(m[1]))
    bad.push(`${name}: Claude-only frontmatter key`);
  if (/^!`/m.test(t)) bad.push(`${name}: inline shell exec left`);
  if (t.includes("CLAUDE_SKILL_DIR")) bad.push(`${name}: CLAUDE_SKILL_DIR left`);
}
if (bad.length) { console.log("  FAIL " + bad.join("\n       ")); process.exit(1); }
console.log(`  ok   ${count} skills: spec frontmatter, no inline exec, no Claude vars`);
' || fail=1

echo "5. no Claude Code leftovers in live code and config"
# Excluded on purpose: the pristine reference settings, the compatibility
# inventory (its job is to name Claude Code paths) and this script.
leftovers=$(grep -rn '\.claude/\|CLAUDE_PROJECT_DIR\|CLAUDE_SKILL_DIR' \
  --include='*.sh' --include='*.json' --include='*.yaml' --include='*.awk' . 2>/dev/null \
  | grep -v '^\./\.pi/docs/reference/claude-code-settings\.json:' \
  | grep -v '^\./\.pi/scripts/compat-inventory\.sh:' \
  | grep -v '^\./tools/verify-port\.sh:' \
  | grep -v ':\s*#' || true)
if [ -z "$leftovers" ]; then
  ok "none"
else
  bad "$(printf '%s\n' "$leftovers" | wc -l) references left"
  printf '%s\n' "$leftovers" | head -5 | sed 's/^/       /'
fi

echo "6. a project settings file Pi can actually read"
if [ -f .pi/settings.json ]; then
  if node -e 'const s=require("./.pi/settings.json"); if(s.hooks||s.permissions||s.statusLine) process.exit(1)' 2>/dev/null; then
    ok ".pi/settings.json has no Claude Code schema keys"
  else
    bad ".pi/settings.json still carries hooks/permissions/statusLine"
  fi
else
  ok "none (Pi auto-discovers .pi/skills and .pi/extensions)"
fi

echo "7. agent registry (Pi binds tools and prompt, never a model alias)"
node --input-type=module -e '
import fs from "node:fs";
import path from "node:path";
const dir = ".pi/agents";
const allowed = new Set(["read", "write", "edit", "grep", "find", "bash"]);
const problems = [];
let count = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
  count++;
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) { problems.push(`${f}: no frontmatter`); continue; }
  const fm = m[1];
  if (!/^name:\s*\S/m.test(fm)) problems.push(`${f}: no name`);
  if (!/^description:\s*\S/m.test(fm)) problems.push(`${f}: no description`);
  if (/^model:/m.test(fm)) problems.push(`${f}: model: left — the registry cannot resolve an alias`);
  if (/^maxTurns:/m.test(fm)) problems.push(`${f}: maxTurns: left`);
  for (const t of [...fm.matchAll(/^\s+-\s*(\S+)$/gm)].map((x) => x[1]))
    if (!allowed.has(t)) problems.push(`${f}: tool not in the Pi set: ${t}`);
}
if (problems.length) { console.log("  FAIL " + problems.slice(0, 6).join("\n       ")); process.exit(1); }
console.log(`  ok   ${count} definitions, Pi tool names, no model pin`);
' || fail=1

echo "8. hook extension parses"
for f in .pi/extensions/ccgs-hooks.ts .pi/extensions/ccgs-rules.ts .pi/extensions/ccgs-guard.ts; do
  if node --experimental-strip-types --check "$f" 2>/dev/null; then ok "$(basename "$f")"; else bad "$f does not parse"; fi
done

echo "9. path-scoped rules"
if node --experimental-strip-types tools/test-rules.mjs >/tmp/ccgs-rules.log 2>&1; then
  ok "$(grep -c '^  ok' /tmp/ccgs-rules.log) matcher assertions against the real rule globs"
else
  bad "the matcher disagrees with .pi/rules"
  tail -8 /tmp/ccgs-rules.log | sed 's/^/       /'
fi

echo "10. hook contract (the scripts still answer in their original shape)"
skill_msg=$(printf '%s' '{"hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":".pi/skills/start/SKILL.md"}}' \
  | CCGS_ROOT="$PWD" bash .pi/hooks/validate-skill-change.sh 2>/dev/null || true)
case "$skill_msg" in
  *'"systemMessage"'*) ok "warning hooks emit systemMessage + additionalContext" ;;
  *) bad "validate-skill-change.sh did not emit hook JSON" ;;
esac

mkdir -p design/gdd
printf '# Guard test\n\n%s' "$(printf 'lorem ipsum dolor sit amet. %.0s' $(seq 1 2000))" > design/gdd/_port_gate.md
guard=$(printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"Read","tool_input":{"file_path":"design/gdd/_port_gate.md"}}' \
  | CCGS_ROOT="$PWD" bash .pi/hooks/validate-read.sh 2>/dev/null; echo "exit=$?")
rm -f design/gdd/_port_gate.md
rmdir design/gdd 2>/dev/null
case "$guard" in
  *exit=2*) ok "read guard blocks a whole-file read of a 45 KB design doc" ;;
  *) bad "read guard did not block (exit code missing)" ;;
esac

echo "11. permission guard (the original deny list, as decisions)"
if node --experimental-strip-types tools/test-guard.mjs >/tmp/ccgs-guard.log 2>&1; then
  paths=$(grep -cE '^  ok   (block|allow)  (read|write|edit) ' /tmp/ccgs-guard.log)
  cmds=$(grep -cE '^  ok   (block|allow)  [^ ]' /tmp/ccgs-guard.log)
  ok "$((cmds - paths)) command cases and $paths path cases"
else
  bad "the guard disagrees with the original deny list"
  grep 'FAIL' /tmp/ccgs-guard.log | head -6 | sed 's/^/       /'
fi

echo
if [ "$fail" -eq 0 ]; then echo "PASS"; else echo "FAIL"; fi
exit "$fail"
