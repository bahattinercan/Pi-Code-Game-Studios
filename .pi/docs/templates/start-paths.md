# Your Path

Here's your path at rigor `[value]`. Every skill still runs at any rigor; rigor changes
what's required, not what's allowed.

**`minimal`: 4 steps to running code**
1. `/skill:setup-engine`: choose and configure the engine
2. `/skill:brainstorm`: write the one-page `design/game-brief.md`
3. `/skill:create-stories`: turn the brief's MVP list into stories (no epics or sprint plan needed)
4. `/skill:dev-story`: the first line of game code

**`standard`**
- Concept: `/skill:setup-engine` → `/skill:brainstorm` → `/skill:prototype` → `/skill:art-bible` → `/skill:gate-check`
- Systems Design: `/skill:map-systems` → `/skill:design-system` (once per system) → `/skill:review-all-gdds` →
  `/skill:gate-check`
- Architecture: `/skill:create-architecture` → `/skill:architecture-decision` (once per decision) →
  `/skill:create-control-manifest` → `/skill:architecture-review` → `/skill:test-setup` → `/skill:ux-design`
  (accessibility and interaction patterns) → `/skill:gate-check`
- Pre-Production: `/skill:ux-design` (HUD and key screens) → `/skill:create-epics` → `/skill:create-stories` →
  `/skill:sprint-plan` → `/skill:gate-check`
- Production: `/skill:dev-story`

Each `/skill:gate-check` moves the project one stage, and only when it passes.

**`full`:** everything in `standard`, plus `/skill:vertical-slice` and `/skill:playtest-report` in
Pre-Production and `/skill:design-review` after each GDD.

**Path D with existing work** (stage `Systems Design` or later, or code on disk) gets this instead.
Print only the steps that apply, and for the brief only the one source that applies. At `minimal`:
1. `/skill:project-stage-detect`: what stage the project is at and what is missing
2. `/skill:adopt`: whether the existing files are in the format the skills read
3. `/skill:setup-engine`: only when no engine is set; leave it out when `engine` names one
4. The brief, only if `concept` is absent: `/skill:reverse-document design [code_root]` when the code
   root holds 10 or more source files (it writes the brief from the game), and then do not mention
   `/skill:brainstorm` at all; `/skill:brainstorm` only when it holds fewer

At `standard` and `full`, steps 1 to 3, then `/skill:design-system retrofit [path]`,
`/skill:architecture-decision retrofit [path]`, `/skill:architecture-review` and `/skill:gate-check`.

`minimal` is the documented floor, not a lesser mode. Its trade: no GDDs, so design
problems show up in code.
