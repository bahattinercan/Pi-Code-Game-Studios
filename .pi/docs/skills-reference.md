# Available Skills (Slash Commands)

74 slash commands organized by phase. Type `/` in Claude Code to access any of them.

## Onboarding & Navigation

| Command | Purpose |
|---------|---------|
| `/skill:start` | First-time onboarding — asks where you are, then guides you to the right workflow |
| `/skill:help` | Context-aware "what do I do next?" — reads current stage and surfaces the required next step |
| `/skill:project-stage-detect` | Full project audit — detect phase, identify existence gaps, recommend next steps |
| `/skill:setup-engine` | Configure engine + version, detect knowledge gaps, populate version-aware reference docs |
| `/skill:adopt` | Brownfield format audit — checks internal structure of existing GDDs/ADRs/stories, produces migration plan |
| `/skill:settings` | View or change project config — the effective merged values, or a local override in `project.local.yaml` |

## Game Design

| Command | Purpose |
|---------|---------|
| `/skill:brainstorm` | Guided ideation using professional studio methods (MDA, SDT, Bartle, verb-first) |
| `/skill:map-systems` | Decompose game concept into systems, map dependencies, prioritize design order |
| `/skill:design-system` | Guided, section-by-section GDD authoring for a single game system |
| `/skill:quick-design` | Lightweight design spec for small changes — tuning, tweaks, minor additions |
| `/skill:review-all-gdds` | Cross-GDD consistency and game design holism review across all design docs |
| `/skill:propagate-design-change` | When a GDD is revised, find affected ADRs and produce an impact report |

## Art & Assets

| Command | Purpose |
|---------|---------|
| `/skill:art-bible` | Guided, section-by-section Art Bible authoring — creates visual identity spec before asset production begins |
| `/skill:asset-spec` | Generate per-asset visual specifications and AI generation prompts from GDDs, level docs, or character profiles |
| `/skill:asset-audit` | Audit assets for naming conventions, file size budgets, and pipeline compliance |

## UX & Interface Design

| Command | Purpose |
|---------|---------|
| `/skill:ux-design` | Guided section-by-section UX spec authoring (screen/flow, HUD, or pattern library) |
| `/skill:ux-review` | Validate UX specs for GDD alignment, accessibility, and pattern compliance |

## Architecture

| Command | Purpose |
|---------|---------|
| `/skill:create-architecture` | Guided authoring of the master architecture document |
| `/skill:architecture-decision` | Create an Architecture Decision Record (ADR) |
| `/skill:architecture-review` | Validate all ADRs for completeness, dependency ordering, and GDD coverage |
| `/skill:create-control-manifest` | Generate flat programmer rules sheet from accepted ADRs |

## Stories & Sprints

| Command | Purpose |
|---------|---------|
| `/skill:create-epics` | Translate GDDs + ADRs into epics — one per architectural module |
| `/skill:create-stories` | Break a single epic into implementable story files |
| `/skill:dev-story` | Read a story and implement it — routes to the correct programmer agent |
| `/skill:sprint-plan` | Generate or update a sprint plan; initializes sprint-status.yaml |
| `/skill:sprint-status` | Fast 30-line sprint snapshot (reads sprint-status.yaml) |
| `/skill:story-readiness` | Validate a story is implementation-ready before pickup (READY/NEEDS WORK/BLOCKED) |
| `/skill:story-done` | 8-phase completion review after implementation; updates story file, surfaces next story |
| `/skill:estimate` | Structured effort estimate with complexity, dependencies, and risk breakdown |

## Reviews & Analysis

| Command | Purpose |
|---------|---------|
| `/skill:design-review` | Review a game design document for completeness and consistency |
| `/skill:code-review` | Architectural code review for a file or changeset |
| `/skill:balance-check` | Analyze game balance data, formulas, and config — flag outliers |
| `/skill:content-audit` | Audit GDD-specified content counts against implemented content |
| `/skill:scope-check` | Analyze feature or sprint scope against original plan, flag scope creep |
| `/skill:perf-profile` | Structured performance profiling with bottleneck identification |
| `/skill:tech-debt` | Scan, track, prioritize, and report on technical debt |
| `/skill:gate-check` | Validate readiness to advance between development phases (PASS/CONCERNS/NOT ASSESSED/FAIL) |
| `/skill:consistency-check` | Scan all GDDs against the entity registry to detect cross-document inconsistencies (stats, names, rules that contradict each other) |
| `/skill:security-audit` | Audit the game for security vulnerabilities: save tampering, cheat vectors, network exploits, data exposure, and input validation gaps |

## QA & Testing

| Command | Purpose |
|---------|---------|
| `/skill:qa-plan` | Generate a QA test plan for a sprint or feature |
| `/skill:smoke-check` | Run critical path smoke test gate before QA hand-off |
| `/skill:soak-test` | Generate a soak test protocol for extended play sessions |
| `/skill:regression-suite` | Map test coverage to GDD critical paths, identify fixed bugs without regression tests |
| `/skill:test-setup` | Scaffold the test framework and CI/CD pipeline for the project's engine |
| `/skill:test-helpers` | Generate engine-specific test helper libraries for the test suite |
| `/skill:test-evidence-review` | Quality review of test files and manual evidence documents |
| `/skill:test-flakiness` | Detect non-deterministic (flaky) tests from CI run logs |
| `/skill:skill-test` | Validate skill files for structural compliance and behavioral correctness |
| `/skill:skill-improve` | Improve a skill using a test-fix-retest loop — diagnose, propose fix, rewrite, verify |

## Production

| Command | Purpose |
|---------|---------|
| `/skill:milestone-review` | Review milestone progress and generate status report |
| `/skill:retrospective` | Run a structured sprint or milestone retrospective |
| `/skill:bug-report` | Create a structured bug report |
| `/skill:bug-triage` | Read all open bugs, re-evaluate priority vs. severity, assign owner and label |
| `/skill:reverse-document` | Generate design or architecture docs from existing implementation |
| `/skill:playtest-report` | Generate a structured playtest report or analyze existing playtest notes |

## Release

| Command | Purpose |
|---------|---------|
| `/skill:release-checklist` | Generate and validate a pre-release checklist for the current build |
| `/skill:launch-checklist` | Complete launch readiness validation across all departments |
| `/skill:changelog` | Auto-generate changelog from git commits and sprint data |
| `/skill:patch-notes` | Generate player-facing patch notes from git history and internal data |
| `/skill:hotfix` | Emergency fix workflow with audit trail, bypassing normal sprint process |
| `/skill:day-one-patch` | Prepare a focused day-one patch for known issues discovered after gold master but before or at public launch |

## Creative & Content

| Command | Purpose |
|---------|---------|
| `/skill:prototype` | Concept prototype — throwaway build right after brainstorm to validate core idea (Phase 1) |
| `/skill:vertical-slice` | Pre-Production validation — production-quality end-to-end build before committing to Production (Phase 4) |
| `/skill:onboard` | Generate contextual onboarding document for a new contributor or agent |
| `/skill:localize` | Localization workflow: string extraction, validation, translation readiness |

## Team Orchestration

Coordinate multiple agents on a single feature area:

| Command | Coordinates |
|---------|-------------|
| `/skill:team-combat` | game-designer + gameplay-programmer + ai-programmer + technical-artist + sound-designer + qa-tester |
| `/skill:team-narrative` | narrative-director + writer + world-builder + level-designer |
| `/skill:team-ui` | ux-designer + ui-programmer + art-director + accessibility-specialist |
| `/skill:team-release` | release-manager + qa-lead + devops-engineer + producer |
| `/skill:team-polish` | performance-analyst + technical-artist + sound-designer + qa-tester |
| `/skill:team-audio` | audio-director + sound-designer + technical-artist + gameplay-programmer |
| `/skill:team-level` | level-designer + narrative-director + world-builder + art-director + systems-designer + qa-tester |
| `/skill:team-live-ops` | live-ops-designer + economy-designer + community-manager + analytics-engineer |
| `/skill:team-qa` | qa-lead + qa-tester + gameplay-programmer + producer |

## Overlap with Claude Code's bundled skills

Claude Code ships its own skills, and one name collides with CCGS's.

| You type | You get | Use it for |
|---------|---------|-----------|
| `/skill:code-review` | **CCGS's** — project skills take the bare name | Architectural review against this project's coding standards, SOLID, testability and the control manifest. Knows about ADRs, stories and `docs/architecture/`. |
| `/review` | **Claude Code's bundled** review — the alias of its `/skill:code-review`, which CCGS's skill shadows | Reviewing a pull request or a plain diff for correctness bugs, with no knowledge of CCGS's design documents or gates. |

Both are useful; they answer different questions. Reach for the CCGS one during
`/skill:dev-story` and before `/skill:story-done`, because it checks the things the gates
later check. Reach for the bundled one when you want a general review of a diff
that has nothing to do with a story.

CCGS does **not** turn the bundled skills off. `disableBundledSkills` would
remove all of them, including `/debug`, `/security-review` and `/simplify`,
which are worth keeping. If you want a bundled skill hidden, use
`skillOverrides` in your own `.pi/settings.local.json` rather than disabling
the whole set.
