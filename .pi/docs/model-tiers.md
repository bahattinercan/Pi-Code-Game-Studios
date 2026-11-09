# Model Tier Assignment

Pi has no per-skill `model:`. A skill runs on the session's model, whatever you
selected with `/model`. Only two places pick a model:

- **Subagents** — a workflow's `agent(prompt, { model })` or `agent(prompt,
  { tier })` call. Tiers are the routes in the model-tier settings (`small`,
  `medium`, `big`).
- **Agent types** — a named definition in the agent registry that binds its own
  model, tools and instructions. `.pi/agents/*.md` is Claude Code's format; the
  Pi port has not built its registry yet (see `PORTING.md`).

So the table below is not a config file. It is the judgement call to make when a
`team-*` skill, `/skill:dev-story` or `/skill:code-review` spawns a subagent, and when you
switch the session model yourself.

| Tier | `tier` | When to use |
|------|--------|-------------|
| **small** | `small` | Read-only status checks, formatting, simple lookups — no creative judgment needed |
| **medium** | `medium` | Implementation, design authoring, analysis of individual systems — default for most work |
| **big** | `big` | Multi-document synthesis, high-stakes phase gate verdicts, cross-system holistic review |
| **inherit** | (omit both) | Runs on the orchestrating session's model |

Work that belongs in `small` (the read-and-format class): `/skill:help`,
`/skill:onboard`, `/skill:project-stage-detect`, `/skill:scope-check`,
`/skill:sprint-status`.

> `/skill:patch-notes` and `/skill:changelog` are **not** in that class: both
> produce **player-facing** copy and need judgement the cheapest tier is defined
> as not doing.
>
> `/skill:settings` is not there either. It does not only read and format — it
> resolves every leaf with provenance and then compares the configured rigor
> against the project's observable working practice. That is synthesis.

Work that belongs in `big`: `/skill:architecture-review`, `/skill:gate-check`,
`/skill:review-all-gdds`.

Everything else is `medium`. When you spawn a subagent for new work, leave the
selector off to inherit the session model unless one of the rows above clearly
applies; naming a tier you did not mean overrides the inherited one, and an
unavailable explicit tier throws instead of degrading quietly.

**Agent types.** The 49 Claude Code agents each declared a `model:` in their
frontmatter (3 `opus` directors, 16 `sonnet` specialists, 30 `inherit`). That
mechanism does not exist in Pi — see `PORTING.md` for what replaces it. Until
that port lands, a subagent inherits the session model, and the brief's role
text is what makes it behave like a director or a specialist.
