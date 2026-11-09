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

## Not ported

### Hooks — 15 event hooks, no equivalent loaded

Claude Code ran `.pi/hooks/*.sh` on `PreToolUse`, `PostToolUse`, `SessionStart`,
`Stop`, `PreCompact`, `Notification`, `SubagentStart` and `SubagentStop`. Those
scripts still exist and still work when called by hand, but **nothing fires them
in Pi**. In particular these guarantees are currently off:

| Hook | What you lose until it is ported |
|---|---|
| `validate-commit.sh` | Hardcoded-value and JSON checks before a commit |
| `validate-push.sh` | Warnings on protected-branch pushes and release commands |
| `validate-read.sh` | Refusal of whole-file reads of large design docs |
| `validate-write.sh` | Warnings on overwriting a file the skills say never to overwrite |
| `validate-registry.sh` | Warns when a registry write deletes or renumbers an entry |
| `validate-assets.sh` | Asset naming and data-file JSON validation |
| `session-start.sh` / `detect-gaps.sh` | Branch orientation, fresh-project and missing-design-doc nudges |
| `session-stop.sh` / `pre-compact.sh` | Session checkpoint archiving |
| `log-agent*.sh` / `validate-agent-artifact.sh` | Subagent audit trail |

The replacement is one Pi extension. `pi.on("tool_call")` blocks and can mutate
input (the `PreToolUse` slot), `pi.on("tool_result")` modifies results
(`PostToolUse`), `session_start`, `session_before_compact` and `agent_end` cover
the rest. The deny list in the old `.pi/docs/reference/claude-code-settings.json`
moves there too — Pi's `tool_call` can block, which is closer to the Claude Code
behaviour than a warning.

### Agents — 49 role definitions, no loader

`.pi/agents/*.md` is Claude Code's subagent format: a markdown body plus
`tools:` and `model:` frontmatter. Pi has no such directory. Its equivalents are
named agent types in the agent registry (bound tools, model and instructions, used
via `agent(prompt, { agentType })`) and separate Pi sessions under Orca.

The 49 files are retained as prose: each one is a usable role brief, and the
`team-*` skills quote them. Converting them is a rewrite, not a rename — the
frontmatter has no Pi reader. Until then, a subagent inherits the session model
and gets its role from the brief text.

### Path-scoped rules

`.pi/rules/*.md` were attached automatically by file path (`src/gameplay/**`,
`design/narrative/**`, …). Pi loads context files by directory, not by glob, so
those 14 rule files are now references that a skill or brief has to name. The
`tool_call` extension can restore a reminder — it cannot restore the enforcement
without blocking, which the rules never did.

### Status line, notifications, audit

`.pi/statusline.sh` (context %, model, stage, epic breadcrumb) and `notify.sh`
(Windows toast) have no Pi counterpart. Pi's status line is a footer extension
(`pi-powerline-footer` in this environment). `.pi/docs/reference/claude-code-settings.json`
keeps the original settings for reference — it is **not** a Pi settings file and
is not read by anything.

### `studio-tests/` expectations

The skill and agent test catalog is intact and its structural checks still run,
but `/skill:skill-test` asserts against Claude Code conventions (`model:` present,
`allowed-tools` declared, `/name` invocation). Expect false failures until the
rubrics are rewritten for Pi. The score is not meaningful yet.

---

## Verification

Run from the repository root:

```bash
bash -n .pi/hooks/*.sh .pi/scripts/*.sh            # shell syntax
bash .pi/hooks/yaml-helper.sh resolve_config --keys automation,workflow,qa.level
node tools/build-append-system.mjs --check          # generated file is current
```

Skill frontmatter was validated for all 74 files: valid `---` fences, `name` and
`description` present, no Claude-only keys left.
