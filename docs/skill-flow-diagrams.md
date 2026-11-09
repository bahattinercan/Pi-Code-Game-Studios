# Skill Flow Diagrams

Visual maps of how skills chain together across the 7 development phases.
These show what runs before and after each skill, and what artifacts flow between them.

---

## Default Path: Rigor Minimal (Four Steps to Code)

`modes.rigor: minimal` is the default. The one-page brief is the design record and
its build order is the plan, so there is no epic planning, sprint or phase gate to run.
Every skill below still runs at any tier; rigor changes what is required, not what
is allowed. `/skill:help` follows this route at `minimal`.

```
MINIMAL PATH (modes.rigor: minimal — the default; no /skill:gate-check, stage stays Concept)
  /skill:setup-engine ───────────────────────────────────────────────► project.yaml + AGENTS.md
  /skill:brainstorm ─────────────────────────────────────────────────► design/game-brief.md (one page)
        │                                                          (replaces concept doc, systems index, GDDs)
        ▼
  /skill:create-stories ─────────────────────────────────────────────► production/epics/[slug]/story-*.md
        │                                                          (brief's build order is the plan —
        │                                                           no /skill:create-epics, no /skill:sprint-plan)
        ▼ (one story at a time, in build order)
  /skill:dev-story [story] ──────────────────────────────────────────► routes to correct programmer agent
  /skill:story-done [story] ─────────────────────────────────────────► story closed + next story named
        │
        └── back to /skill:dev-story until every story is Complete, then:
              play the build · /skill:create-stories for more · /skill:settings to raise rigor
```

The overview below is the `standard`/`full` pipeline.

---

## Full Pipeline Overview (Zero to Ship)

```
PHASE 1: CONCEPT
  /skill:start ──────────────────────────────────────────────────────► routes to A/B/C/D
  /skill:brainstorm ──────────────────────────────────────────────────► design/gdd/game-concept.md
  /skill:setup-engine ────────────────────────────────────────────────► project.yaml + AGENTS.md
  /skill:prototype [core-mechanic] ───────────────────────────────────► prototypes/[name]-concept/REPORT.md
        │ PROCEED                                                  (validate idea BEFORE writing GDDs)
        ▼
  /skill:design-review [game-concept.md] ────────────────────────────► concept validated
  /skill:art-bible ──────────────────────────────────────────────────► design/art/art-bible.md
  /skill:map-systems ────────────────────────────────────────────────► design/gdd/systems-index.md
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to systems-design
        │
        ▼
PHASE 2: SYSTEMS DESIGN
  /skill:map-systems next ───────────────────────────────────────────► picks the next system to design
        │
        ▼ (for each system, in dependency order)
  /skill:design-system [name] ──────────────────────────────────────► design/gdd/[system].md
  /skill:design-review [system].md ─────────────────────────────────► per-GDD review comments
        │
        ▼ (after all MVP GDDs done)
  /skill:review-all-gdds ────────────────────────────────────────────► design/gdd/gdd-cross-review-[date].md
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to technical-setup
        │
        ▼
PHASE 3: TECHNICAL SETUP
  /skill:create-architecture ────────────────────────────────────────► docs/architecture/architecture.md
  /skill:architecture-decision (×N) ─────────────────────────────────► docs/architecture/[adr-nnn].md
  /skill:architecture-review ────────────────────────────────────────► review report + docs/architecture/tr-registry.yaml
  /skill:create-control-manifest ────────────────────────────────────► docs/architecture/control-manifest.md
  /skill:test-setup ─────────────────────────────────────────────────► test framework + CI/CD pipeline
  /skill:test-helpers ───────────────────────────────────────────────► tests/helpers/ (engine-specific library)
  /skill:ux-design accessibility ─────────────────────────────────────► design/accessibility-requirements.md
  /skill:ux-design patterns ──────────────────────────────────────────► design/ux/interaction-patterns.md
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to pre-production
        │
        ▼
PHASE 4: PRE-PRODUCTION
  [UX — before epics, so specs exist when stories are written]
  /skill:ux-design [screen/hud] ──────────────────────────────────────► design/ux/*.md
  /skill:ux-review ──────────────────────────────────────────────────► UX specs approved (HARD gate for /skill:team-ui)

  [Vertical slice — before epics, validate full game loop]
  /skill:vertical-slice ─────────────────────────────────────────────► prototypes/[name]-vertical-slice/REPORT.md
  /skill:playtest-report ────────────────────────────────────────────► production/qa/playtests/

  [Stories + sprint plan — only after vertical slice PROCEEDS]
  /skill:create-epics [layer] ───────────────────────────────────────► production/epics/*/EPIC.md
  /skill:create-stories [epic-slug] ─────────────────────────────────► production/epics/*/story-*.md
  /skill:sprint-plan new ────────────────────────────────────────────► production/sprints/sprint-001.md
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to production
        │
        ▼
PHASE 5: PRODUCTION (repeating sprint loop)
  /skill:sprint-status ──────────────────────────────────────────────► sprint snapshot
  /skill:story-readiness [story] ────────────────────────────────────► story validated READY
        │
        ▼ (pick up and implement)
  /skill:dev-story [story] ──────────────────────────────────────────► routes to correct programmer agent
        │
        ▼ (during implementation, as needed)
  /skill:code-review ────────────────────────────────────────────────► code review report
  /skill:scope-check ────────────────────────────────────────────────► scope creep detected / clear
  /skill:content-audit ──────────────────────────────────────────────► GDD content gaps identified
  /skill:bug-report ─────────────────────────────────────────────────► production/qa/bugs/BUG-NNNN.md
  /skill:bug-triage ─────────────────────────────────────────────────► bugs re-prioritized + assigned

  [Team skills for feature areas — spawn when working a full feature]
  /skill:team-combat / /skill:team-narrative / /skill:team-ui / /skill:team-level / /skill:team-audio

  [QA cycle per sprint]
  /skill:qa-plan ────────────────────────────────────────────────────► production/qa/qa-plan-[sprint-slug]-[date].md
  /skill:smoke-check ────────────────────────────────────────────────► smoke test gate (PASS/FAIL)
  /skill:regression-suite ───────────────────────────────────────────► coverage gaps + missing regression tests
  /skill:test-evidence-review ───────────────────────────────────────► evidence quality report
  /skill:test-flakiness ─────────────────────────────────────────────► flaky test report
        │
        ▼
  /skill:story-done [story] ─────────────────────────────────────────► story closed + next surfaced
  /skill:sprint-plan [next] ─────────────────────────────────────────► next sprint
        │
        ▼ (after Production milestone)
  /skill:milestone-review ───────────────────────────────────────────► milestone report
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to polish
        │
        ▼
PHASE 6: POLISH
  /skill:perf-profile ───────────────────────────────────────────────► perf report + fixes
  /skill:balance-check ──────────────────────────────────────────────► balance report + fixes
  /skill:asset-audit ────────────────────────────────────────────────► asset compliance report
  /skill:tech-debt ──────────────────────────────────────────────────► docs/tech-debt-register.md
  /skill:soak-test ──────────────────────────────────────────────────► soak test protocol + results
  /skill:team-polish ────────────────────────────────────────────────► polish sprint orchestrated
  /skill:team-qa ────────────────────────────────────────────────────► full QA cycle sign-off
  /skill:security-audit ─────────────────────────────────────────────► production/security/security-audit-[date]-[scope].md
  /skill:localize qa ────────────────────────────────────────────────► production/localization/loc-qa-[locale]-[date].md
  /skill:release-checklist ──────────────────────────────────────────► production/releases/release-checklist-[version].md
  /skill:changelog ──────────────────────────────────────────────────► docs/CHANGELOG.md
  /skill:patch-notes ────────────────────────────────────────────────► docs/patch-notes/[version].md (draft)
  /skill:gate-check ─────────────────────────────────────────────────► PASS → advance to release
        │
        ▼
PHASE 7: RELEASE
  /skill:launch-checklist ───────────────────────────────────────────► launch readiness report
  /skill:team-release ───────────────────────────────────────────────► release pipeline orchestrated
        │
        ▼ (post-launch, ongoing)
  /skill:hotfix ─────────────────────────────────────────────────────► emergency fix with audit trail
  /skill:team-live-ops ──────────────────────────────────────────────► live-ops content plan
```

---

## Skill Chain: /skill:design-system in Detail

How a single GDD gets authored, reviewed, and handed to architecture:

```
systems-index.md (input)
game-concept.md (input)
upstream GDDs (input, if any)
        │
        ▼
/skill:design-system [name]
        │
        ├── Pre-check: feasibility table + engine risk flags
        │
        ├── Section cycle × 8:
        │     question → options → decision → draft → approval → WRITE
        │     [each section written to file immediately after approval]
        │
        └── Output: design/gdd/[system].md (complete, all 8 sections)
                │
                ▼
        /skill:design-review design/gdd/[system].md
                │
                ├── APPROVED → mark DONE in systems-index, proceed to next system
                ├── NEEDS REVISION → agent shows specific issues, re-enter section cycle
                └── MAJOR REVISION → significant redesign needed before next system
                        │
                        ▼ (after all MVP GDDs + cross-review)
                /skill:review-all-gdds
                        │
                        └── Output: gdd-cross-review-[date].md
```

---

## Skill Chain: UX / UI Pipeline in Detail

Screen and HUD specs are authored in Phase 4 (Pre-Production), before epics are
written, so that story acceptance criteria can reference specific UX artifacts.
Accessibility and interaction-pattern specs are authored earlier, in Phase 3
(Technical Setup), since at `full` the Technical Setup → Pre-Production gate
requires them (at `standard` they are recommended; at `minimal` they drop).

```
design/gdd/*.md (UI/UX requirements extracted)
design/player-journey.md (emotional arc, if authored)
        │
        ▼
/skill:ux-design hud              → design/ux/hud.md
/skill:ux-design screen [name]    → design/ux/screens/[name].md
/skill:ux-design patterns         → design/ux/interaction-patterns.md
        │
        ▼
/skill:ux-review design/ux/
        │
        ├── APPROVED → UX specs ready, proceed to /skill:create-epics
        ├── NEEDS REVISION → blocking issues listed → fix → re-run review
        └── MAJOR REVISION → fundamental UX problems → redesign before epics
                │
                ▼ (after APPROVED — in Phase 5 when implementing UI features)
        /skill:team-ui
                │
                ├── Phase 1: /skill:ux-design (if any specs still missing) + /skill:ux-review
                ├── Phase 2: visual design (art-director)
                ├── Phase 3: layout implementation (ui-programmer)
                ├── Phase 4: accessibility audit (accessibility-specialist)
                └── Phase 5: final review

Note: /skill:ux-design accessibility and /skill:ux-design patterns belong in Phase 3
      (Technical Setup); /skill:ux-design screen/hud and /skill:ux-review belong in Phase 4
      (Pre-Production). /skill:team-ui belongs in Phase 5 (Production) when a UI
      feature is being built.
```

---

## Skill Chain: Dev Story Flow in Detail

How a story moves from backlog to closed:

```
/skill:story-readiness [story]
        │
        ├── READY → Status: ready-for-dev → pick up for implementation
        ├── NEEDS WORK → agent shows specific gaps → resolve → re-run readiness
        └── BLOCKED → ADR still Proposed, or upstream story incomplete
                │
                ▼ (after READY)
        /skill:dev-story [story]
                │
                ├── Reads: story file, linked GDD requirement, ADR decisions, control manifest
                ├── Routes to: gameplay-programmer / engine-programmer / ui-programmer / etc.
                │
                └── Implementation begins
                        │
                        ▼ (optional, during/after implementation)
                /skill:code-review          → architectural review of changeset
                /skill:scope-check          → verify no scope creep vs. original story criteria
                /skill:test-evidence-review → validate test files and manual evidence quality
                        │
                        ▼
                /skill:story-done [story]
                        │
                        ├── COMPLETE → Status: Complete, sprint-status.yaml updated, next story surfaced
                        ├── COMPLETE WITH NOTES → complete but some criteria deferred (logged)
                        └── BLOCKED → acceptance criteria cannot be verified → investigate blocker
```

---

## Skill Chain: Story Lifecycle (Backlog to Closed)

How a story gets from backlog to closed (summary view):

```
/skill:create-epics [layer]
        │
        └── Output: production/epics/[slug]/EPIC.md
                │
                ▼
        /skill:create-stories [epic-slug]
                │
                └── Output: production/epics/[slug]/story-NNN-[slug].md
                            (Status: Ready or Blocked if ADR is Proposed)
                │
                ▼
        /skill:story-readiness [story]
                │
                ├── READY → /skill:dev-story → implement → /skill:story-done
                ├── NEEDS WORK → resolve gaps → re-run
                └── BLOCKED → fix upstream dependency first
```

---

## Skill Chain: QA Pipeline in Detail

```
[Phase 3 — one-time infrastructure setup]
/skill:test-setup ────────────────────────────────────────────────────► test framework scaffolded + CI/CD wired
/skill:test-helpers ──────────────────────────────────────────────────► tests/helpers/ (GDUnit4, NUnit, etc.)

[Phase 5 — per-sprint QA cycle]
/skill:qa-plan [sprint or feature]
        │
        ├── Reads: story files, GDDs, acceptance criteria
        ├── Classifies each story by test type:
        │     Logic → automated unit test (BLOCKING by default)
        │     Integration → integration test or documented playtest (BLOCKING by default)
        │     Visual/Feel → retained screenshot + lead sign-off (BLOCKING by default)
        │     UI → retained screenshot of each screen (BLOCKING by default)
        │     Config/Data → smoke check (ADVISORY by default)
        │     (gate levels are overridable per type via testing.strict in project.yaml)
        └── Output: production/qa/qa-plan-[sprint-slug]-[date].md
                │
                ▼
        /skill:smoke-check
                │
                ├── PASS → QA hand-off cleared
                └── FAIL → block sprint close → fix critical paths first
                        │
                        ▼
                /skill:regression-suite
                        │
                        └── Coverage gaps + list of fixed bugs without regression tests
                                │
                                ▼
                        /skill:test-evidence-review
                                │
                                └── Validates evidence quality, not just existence
                                        │
                                        ▼ (if CI run history available)
                        /skill:test-flakiness
                                │
                                └── Flaky test report + fix recommendations

[Phase 6 — extended stability testing]
/skill:soak-test ─────────────────────────────────────────────────────► soak test protocol + observed results
/skill:team-qa ───────────────────────────────────────────────────────► full QA cycle sign-off for release gate

[Ongoing — bug management]
/skill:bug-report ────────────────────────────────────────────────────► production/qa/bugs/BUG-NNNN.md
/skill:bug-triage ────────────────────────────────────────────────────► open bugs re-prioritized + assigned

[Meta — harness validation]
/skill:skill-test [lint|spec|catalog] ────────────────────────────────► skill file structural + behavioral check
```

---

## Brownfield Onboarding Flow

For projects with existing work (use `/skill:start` option D or run directly):

```
/skill:project-stage-detect    → stage detection report
        │
        ▼
/skill:adopt
        │
        ├── Phase 1: detect what exists
        ├── Phase 2: FORMAT audit (not just existence)
        ├── Phase 3: classify gaps (BLOCKING / HIGH / MEDIUM / LOW)
        ├── Phase 4: ordered migration plan
        ├── Phase 5: write docs/adoption-plan-[date].md
        └── Phase 6: fix most urgent gap inline (optional)
                │
                ▼
        /skill:design-system retrofit [path]    → fills missing GDD sections
        /skill:architecture-decision retrofit [path] → fills missing ADR sections
        /skill:gate-check                       → where are you in the pipeline?
```

---

## How to Read These Diagrams

| Symbol | Meaning |
|--------|---------|
| `──►` | Produces this artifact |
| `│ ▼` | Flows into next step |
| `├──` | Branch (multiple possible outcomes) |
| `×N` | Runs N times (once per system, story, etc.) |
| `(input)` | Read by the skill but not produced here |
| `[optional]` | Not required for the gate to pass |
| `WRITE` (caps) | File written to disk immediately |

---

## Common Entry Points

| Where you are | Run this |
|---------------|---------|
| Brand new, no idea | `/skill:start` → `/skill:brainstorm` |
| Have a concept, no engine | `/skill:setup-engine` |
| Have concept + engine | `/skill:map-systems` |
| Mid-systems design | `/skill:design-system [next system]` or `/skill:map-systems next` |
| All GDDs done | `/skill:review-all-gdds` → `/skill:gate-check` |
| In technical setup | `/skill:create-architecture` → `/skill:architecture-decision` |
| Starting UX design | `/skill:ux-design screen [name]` or `/skill:ux-design hud` |
| Scaffolding tests | `/skill:test-setup` → `/skill:test-helpers` |
| Have stories, ready to code | `/skill:story-readiness [story]` → `/skill:dev-story [story]` |
| Story done | `/skill:story-done [story]` |
| Running QA for a sprint | `/skill:qa-plan` → `/skill:smoke-check` → `/skill:regression-suite` |
| Bug backlog needs sorting | `/skill:bug-triage` |
| Extended stability testing | `/skill:soak-test` |
| Not sure | `/skill:help` |
| Existing project | `/skill:adopt` |
