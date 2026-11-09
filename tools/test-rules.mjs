// Unit test for the path-scoped rule matcher: node --experimental-strip-types tools/test-rules.mjs
//
// Real project files, real globs. Run from the repository root.

import path from "node:path";
import { loadRules, matchRules, globToRegExp } from "../.pi/extensions/ccgs-rules.ts";

const root = process.cwd();
const rules = loadRules(root);

let failed = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed++;
    console.log(`  FAIL ${label}\n       expected ${JSON.stringify(expected)}\n       actual   ${JSON.stringify(actual)}`);
  } else console.log(`  ok   ${label}`);
};

console.log("glob translation");
check("** matches nested", globToRegExp("src/gameplay/**").test("src/gameplay/combat/health.gd"), true);
check("* stays in one segment", globToRegExp("src/*/x.gd").test("src/a/b/x.gd"), false);
check("braces expand", globToRegExp("Assets/**/{Gameplay,gameplay}/**/*.cs").test("Assets/Scripts/gameplay/Foo/Bar.cs"), true);
check("brace case miss", globToRegExp("Assets/**/{Gameplay,gameplay}/**/*.cs").test("Assets/Scripts/Gameplay/Foo/Bar.cs"), true);
check("no false prefix match", globToRegExp("src/core/**").test("src/corex/a.gd"), false);

console.log(`\nrules loaded from .pi/rules (${rules.length})`);
check("every rule carries globs", rules.every((r) => r.patterns.length > 0), true);
check("rules are named by file stem", rules.filter((r) => r.name === "gameplay-code").length, 1);

console.log("\nmatching");
const names = (p) => matchRules(rules, p).map((r) => r.name).sort();
check("gameplay path", names("src/gameplay/combat/health.gd"), ["gameplay-code"]);
check("core path", names("src/core/math/vec.gd"), ["engine-code"]);
check("ui path", names("src/ui/hud.gd"), ["ui-code"]);
check("network path", names("src/networking/peer.gd"), ["network-code"]);
check("unity gameplay cs", names("Assets/Scripts/gameplay/Foo/Bar.cs"), ["gameplay-code"]);
check("unreal gameplay cpp", names("Source/Game/Gameplay/Foo/Bar.cpp"), ["gameplay-code"]);
check("unreal header in gameplay", names("Source/Game/Gameplay/Foo/Bar.h"), ["gameplay-code"]);
check("unreal core cpp", names("Source/Game/Core/Foo/Bar.cpp"), ["engine-code"]);
check("unreal docs cpp none", names("Source/Game/Docs/Foo/Bar.cpp"), []);
check("unmatched path", names("docs/notes.md"), []);
check("windows separators", names("src\\gameplay\\combat\\health.gd"), ["gameplay-code"]);

console.log(failed ? `\nFAIL: ${failed} check(s)` : "\nPASS: matcher agrees with the rule files");
process.exit(failed ? 1 : 0);
