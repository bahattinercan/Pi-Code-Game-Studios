# Claude Code Game Studios — Pi port

Indie game development managed through a coordinated studio of specialist roles:
directors who guard the vision, leads who own their domains, specialists who do
the hands-on work. Each role owns a domain, enforces separation of concerns and
asks before it writes.

This repository is the Pi port of
[Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios).
Claude Code's `.claude/` layout, inline `!`bash`` skill execution, `model:` skill
frontmatter and hook event model do not exist in Pi, so the studio now lives in
`.pi/` with a Pi skill set, a generated always-on system appendix, and its
automation still to be rebuilt as an extension. What moved, what changed and
what is still pending: **[PORTING.md](PORTING.md)**.

## Technology Stack

- **Engine**: [CHOOSE: Godot 4 / Unity / Unreal Engine 5]
- **Language**: [CHOOSE: GDScript / C# / C++ / Blueprint]
- **Version Control**: Git with trunk-based development
- **Build System**: [SPECIFY after choosing engine]
- **Asset Pipeline**: [SPECIFY after choosing engine]

> Engine-specialist roles exist for Godot, Unity and Unreal with dedicated
> sub-specialists. Use the set matching your engine.

## Project Structure

Read `.pi/docs/directory-structure.md` before creating a file in an area you have
not worked in yet. The short version:

```
AGENTS.md          This file — the router for project instructions
PORTING.md         What the Pi port changed, and what is still pending
.pi/skills/        74 skills — /skill:<name> in Pi
.pi/agents/        49 role definitions (Claude Code format; see PORTING.md)
.pi/rules/         Path-scoped coding standards
.pi/docs/          Reference docs, templates, registries
.pi/scripts/       Helper scripts the skills call
.pi/hooks/         Claude Code hook scripts (manual until the extension lands)
src/               Game source code — the code root is ENGINE-SPECIFIC
assets/            Art, audio, VFX, shaders, data files
design/            GDDs, narrative docs, level designs
docs/              Technical documentation and ADRs
tests/             Test suites (unit, integration, performance, playtest)
tools/             Build and pipeline tools
prototypes/        Throwaway prototypes (isolated from src/)
production/        Sprint plans, milestones, release tracking
studio-tests/      QA for the skills and agents themselves
```

## Engine Version Reference

Read `docs/engine-reference/<engine>/VERSION.md` for the pinned engine version.
`/skill:setup-engine` rewrites the default (`godot`) to the engine you choose.

## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it by running
`.pi/hooks/yaml-helper.sh resolve_config` (see `.pi/docs/config-resolution.md`).

**Pi has no inline shell in skill bodies.** Every skill that needs config says so
in a **Step 0** block: run that command first and treat its output as the resolved
config for the run. Skipping Step 0 means working from defaults you did not check.

`.pi/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`.

## Coordination Rules

Read `.pi/docs/coordination-rules.md` before delegating work or changing another
domain's files — it carries the seven binding rules, the tier table pointer and
the parallel-task protocol.

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question → Options → Decision → Draft → Approval**

- Ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.pi/rules/agent-memory.md`)
- Show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this folder? Warn first: project config and project skills load
  only when Pi runs from here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for the full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/skill:start` to begin the guided onboarding flow.

## Coding Standards

Read `.pi/docs/coding-standards.md` before writing code, and the matching
`.pi/rules/*.md` for the path you are editing. Pi has no path-scoped automatic
rule loading — the rule files are references, so naming the one that applies is
part of the brief you give a subagent.

## Context Management

Read `.pi/docs/context-management.md` on demand — it is a reference, not session
context. Three of its conventions are load-bearing and cited by name elsewhere in
the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/new`.
- **Helpers in `.pi/scripts/` emit observations, never verdicts.** A script that
  scores or judges will eventually contradict a mode or override it cannot see.
  (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)
- **Claude Code imports are now generated.** `.pi/APPEND_SYSTEM.md` is built from
  the docs that `CLAUDE.md` used to `@import`, and Pi appends it to the system
  prompt. Edit the sources, then run `node tools/build-append-system.mjs` — never
  the generated file.
