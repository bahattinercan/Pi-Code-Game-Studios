#!/bin/bash
# Port gate: proves the Pi conversion holds. Run from the repository root.
#
#   bash tools/verify-port.sh
#
# Every check prints its own verdict; the script exits non-zero on the first
# structural failure. It reads, it never writes.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

fail=0
ok()   { printf '  ok   %s\n' "$1"; }
bad()  { printf '  FAIL %s\n' "$1"; fail=1; }

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
  if (/^(model|allowed-tools|argument-hint|user-invocable):/m.test(m[1]))
    bad.push(`${name}: Claude-only frontmatter key`);
  if (/^!`/m.test(t)) bad.push(`${name}: inline shell exec left`);
  if (t.includes("CLAUDE_SKILL_DIR")) bad.push(`${name}: CLAUDE_SKILL_DIR left`);
}
if (bad.length) { console.log("  FAIL " + bad.join("\n       ")); process.exit(1); }
console.log(`  ok   ${count} skills: spec frontmatter, no inline exec, no Claude vars`);
'

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
  count=$(printf '%s\n' "$leftovers" | wc -l)
  bad "$count references left"
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
  ok "none (Pi auto-discovers .pi/skills; nothing to configure yet)"
fi

echo
if [ "$fail" -eq 0 ]; then echo "PASS"; else echo "FAIL"; fi
exit "$fail"
