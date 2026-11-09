// Permission guard tests: node --experimental-strip-types tools/test-guard.mjs
//
// Two tables. BLOCK is every dangerous shape the original 130-entry deny list
// covered (each row names the entry it stands for). ALLOW is the calls that
// list got wrong or that must keep working — the commit-message false positive
// is the one that motivated parsing instead of glob matching.

import { checkCommand, checkPath, segments } from "../.pi/extensions/ccgs-guard.ts";

let failed = 0;
const block = (cmd, why) => {
  const d = checkCommand(cmd);
  if (d) console.log(`  ok   block  ${cmd}`);
  else {
    failed++;
    console.log(`  FAIL block  ${cmd}   <- ${why}`);
  }
};
const allow = (cmd, why) => {
  const d = checkCommand(cmd);
  if (!d) console.log(`  ok   allow  ${cmd}`);
  else {
    failed++;
    console.log(`  FAIL allow  ${cmd}   <- ${d.reason}`);
  }
};

console.log("tokenizer");
const cases = [
  ['git commit -m "rm -rf build"', [["git", "commit", "-m", "rm -rf build"]]],
  ["a && b; c | d", [["a"], ["b"], ["c"], ["d"]]],
  ["echo 'x;y'", [["echo", "x;y"]]],
];
for (const [cmd, expected] of cases) {
  const got = JSON.stringify(segments(cmd));
  const want = JSON.stringify(expected);
  if (got === want) console.log(`  ok   splits  ${cmd}`);
  else {
    failed++;
    console.log(`  FAIL splits  ${cmd}\n       want ${want}\n       got  ${got}`);
  }
}

console.log("\nrm — Bash(rm -rf *), (rm -fr *), (rm -r -f *), (rm --recursive --force*) …");
for (const c of ["rm -rf build", "rm -fr build", "rm -r -f build", "rm -Rf x", "rm -fR x", "rm -R -f x",
  "rm --recursive --force x", "rm --force --recursive x", "rm -rf*", "cd /tmp && rm -rf dist",
  "rm -rf -- /x"]) block(c, "destructive rm");

console.log("\ngit push — Bash(git push --force*), (-f *), (* +*), (git *push* -uf*)");
for (const c of ["git push --force", "git push -f origin main", "git push origin +main",
  "git push --force-with-lease", "git -C repo push -uf origin x", "git push origin main --force"])
  block(c, "forced push");

console.log("\ngit reset / clean");
for (const c of ["git reset --hard", "git reset --hard HEAD~3", "git -C repo reset --hard",
  "git clean -f", "git clean -fd", "git clean -xdf", "git clean --force", "git clean -qfd"])
  block(c, "irreversible");

console.log("\nprivilege + permissions — Bash(sudo *), Bash(chmod 777*)");
for (const c of ["sudo apt install x", "chmod 777 deploy.sh", "chmod 0777 x"]) block(c, "escalation");

console.log("\nPowerShell(Remove-Item *-Recurse*)");
for (const c of ['powershell -Command "Remove-Item -Recurse -Force C:\\x"',
  'pwsh -c "Remove-Item -r C:\\x"']) block(c, "Remove-Item recurse");

console.log("\nallowed: the work these rules must not obstruct");
for (const c of [
  'git commit -m "push + pull"',
  'git commit -m "rm -rf is banned now"',
  'git commit -m "fix clean -fd docs"',
  "rm build/out.log",
  "rm -f stale.lock",
  "git push origin main",
  "git push -u origin feature",
  "git reset HEAD README.md",
  "git clean -n",
  "git log --oneline -20",
  "grep -rn 'reset --hard' .pi/",
  "echo 'do not run sudo rm -rf /'",
  "npm run build",
]) allow(c, "legitimate");

console.log("\npaths — Read(**/.env*), Edit(**/.env*), Edit(**/*.uasset), Edit(**/*.umap)");
const pathCase = (tool, p, shouldBlock) => {
  const d = checkPath(tool, p);
  const ok = shouldBlock ? Boolean(d) : !d;
  if (!ok) failed++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${shouldBlock ? "block" : "allow"}  ${tool} ${p}`);
};
pathCase("read", ".env", true);
pathCase("read", "config/.env.local", true);
pathCase("edit", ".env.production", true);
pathCase("write", ".env", true);
pathCase("edit", "Content/Maps/Town.umap", true);
pathCase("write", "Content/Art/Hero.uasset", true);
pathCase("read", "Content/Maps/Town.umap", false);
pathCase("read", "src/env.ts", false);
pathCase("edit", "src/env.ts", false);
pathCase("read", ".environment.md", false);
pathCase("read", "docs/uasset-pipeline.md", false);

console.log(failed ? `\nFAIL: ${failed} case(s)` : "\nPASS: guard blocks every dangerous shape and none of the safe ones");
process.exit(failed ? 1 : 0);
