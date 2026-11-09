# Agent Coordination Rules

1. **Vertical Delegation**: Leadership agents delegate to department leads, who
   delegate to specialists. Never skip a tier for complex decisions.
2. **Horizontal Consultation**: Agents at the same tier may consult each other
   but must not make binding decisions outside their domain.
3. **Conflict Resolution**: When two agents disagree, escalate to the shared
   parent. If no shared parent, escalate to `creative-director` for design
   conflicts or `technical-director` for technical conflicts.
4. **Change Propagation**: When a design change affects multiple domains, the
   `producer` agent coordinates the propagation.
5. **No Unilateral Cross-Domain Changes**: An agent must never modify files
   outside its designated directories without explicit delegation.
6. **Read Design Docs by Section**: A brief names the sections an agent needs
   by heading. Find a heading in a GDD, ADR or the art bible with the Grep
   tool (`^#`, content mode) and Read that range with offset and limit; read a doc
   whole only when the task needs all of it, and say why. `validate-read.sh`
   refuses a whole-file read of a doc over 40 KB.
7. **Nothing Goes Upstream**: Never file, open or comment on an issue or pull
   request in an engine, plugin or vendor repository, even when asked. Write a
   draft (`/skill:bug-report` drafts only) and the user submits it.

## Model Tier Assignment

Read `.pi/docs/model-tiers.md` on demand. It carries the tier table, the work
classifications and the judgement rule.

**Key point:** in Pi a skill has no `model:` of its own — it runs on the session
model. Only a subagent's `agent(prompt, { tier })` / `{ model }` and a named
agent type pick a model. Never tell a user a skill "uses a cheap model"; that
mechanism is Claude Code's, not Pi's.

## Subagents vs Orca workers

This project uses two distinct multi-agent patterns:

### Subagents (current, always active)
Spawned by the `workflow` tool inside one Pi session. Used by all `team-*` and
orchestration skills. A subagent does not see the parent conversation — it sees
the brief it was given — and returns its result to the parent.

**When to spawn in parallel**: if two subagents' inputs are independent (neither
needs the other's output to begin), put both in one `parallel()` batch rather
than awaiting the first. Example: `/skill:review-all-gdds` **Phase 2**
(consistency) and **Phase 3** (design theory) are independent — run both at the
same time. Phase 1 loads the GDDs and both depend on it, so it is the one phase
here that must NOT be parallelised.

### Orca workers (separate sessions)
Independent Pi *sessions* in their own worktrees, coordinated by a manager.
Opt-in only — read `.pi/docs/agent-teams.md` on demand before proposing one.

## Parallel Task Protocol

When an orchestration skill spawns multiple independent agents:

1. Put every independent `agent()` call in one `parallel()` batch before
   awaiting any result
2. Collect all results before proceeding to dependent phases
3. If any agent is BLOCKED, surface it immediately — do not silently skip
4. Always produce a partial report if some agents complete and others block
