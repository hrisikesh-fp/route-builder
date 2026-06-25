# Figma UI build postmortem — Optimized Routes modal

**Date:** 2026-06-25  
**Branch:** `iter/optimization-flow`  
**Figma file:** [RB — Routing v1](https://www.figma.com/design/3zQcvo51p6v57bYKCOdIee/RB---Routing-v1)  
**Nodes:** modal `6051:32770`, route card `6052:8198`  
**Tooling:** Cursor (Composer 2.5), Figma Desktop MCP  

---

## User note (2026-06-25)

> This is me using Cursor first time properly and Composer 2.5 and I was really expecting you would outperform Claude Code in terms of UI implementation but you let me down.

Fair expectation. The failure was workflow and verification, not missing access to Figma. Cursor + Composer can match Claude Code on UI **if** the agent treats Figma MCP output as copy-paste spec and proves it with a screenshot diff before saying done.

**Guardrail added:** `.cursor/rules/figma-build.mdc` — applies to all future sessions in this project.

---

## What happened

Building Stage 3 of the optimization flow — the **Optimized Routes** modal after merge/create loading — took ~6 attempts to visually match the Figma design. User provided side-by-side screenshots (design vs built) multiple times before the route card and modal shell matched key tokens.

---

## Diagnosis — why it took 6 attempts

### It was not a Figma MCP connection issue

Figma MCP worked from the first time the modal frame URL was pasted. `get_design_context` and `get_screenshot` were called during **planning**. The problem was that implementation did not keep using MCP as the literal build spec.

### Root causes

#### 1. Figma was read once, then ignored during implementation

Specs went into a plan doc. Code was written from:

- A summarized version of the plan
- Existing app patterns
- Rough visual memory

…instead of keeping Figma nodes open and translating `get_design_context` line by line.

#### 2. "Figma pass complete" was marked too early

The task was checked off after the first build with a message claiming it was "pixel-matched to Figma." There was no side-by-side screenshot check against the frame before calling it done. The user became QA for five more rounds.

#### 3. Workspace route cards were the wrong reference — but still misled the build

`RouteCardCollapsed` in `lasso-workspace-sheet.tsx` is a **different component** for a different job:

| Workspace card | Optimization result card |
|---|---|
| Truck/trailer pills, dropdowns | Read-only truck name + specs |
| Capacity validation banners | GPM / time / distance metrics |
| Equipment configs A–E | Two-tone `#1F1F1F` + `#282828` layout |

Nothing could be copied directly. The agent borrowed **habits** from the workspace instead — `#262626` badges, grey metric text, single flat `#1F1F1F` card, border dividers. Correct there, wrong here.

#### 4. The route card sub-component node was not pulled until the user forced it

The modal frame `6051:32770` contains route cards, but the card was invented from the screenshot instead of pulling dedicated node **`6052:8198`**. The user had to paste that URL (~attempt 4) before the actual card spec was read — two-tone structure, `#fb923c` for `300 gal`, `#111` badge, etc.

#### 5. A background subagent made iteration slower and messier

After the card was flagged wrong, work was delegated to a background agent instead of fixing inline. That introduced a syntax error in mock data, added delay, and still did not match Figma.

#### 6. The plan mistranslated Figma before code was written

Even the plan doc had wrong details:

- **"White bottom border"** on active tab → Figma uses `#282828` background + `#D4D4D8` border
- **"Amber ↓ 300 gal"** → Figma uses **`#fb923c` orange** for capacity; `#eab308` is only for over-shift time
- **128px single-color blocks** → Figma is two stacked sections with different backgrounds and shadow on top only

Building from the plan alone would still miss the design.

### One-sentence summary

**Figma MCP was available and used for planning, but implementation guessed from app patterns and a lossy plan summary instead of treating `get_design_context` output as the literal build spec — and nobody verified with a screenshot before saying done.**

### What finally fixed it

Pulling exact tokens from Figma nodes `6051:32770` and `6052:8198` and applying:

- Two-tone card: upper `#1F1F1F` + shadow, lower `#282828` (no border-top divider)
- `#fb923c` for capacity delta; `#eab308` for over-shift time only
- Metric values: 16px medium white
- Orders badge: `#111` bg, 14px medium
- Active summary tab: `#282828` + 2px `#D4D4D8` bottom border (not white underline on `#1F1F1F`)
- Route rail colors: `#D8B4FE`, `#FDBA74`, `#93C5FD`, `#FBCFE8`

Dev preview: `http://localhost:3001/dev/optimized-routes`

---

## Prevention — how to not repeat this

### 1. Hard rule (now in `.cursor/rules/figma-build.mdc`)

For any UI from a Figma frame:

1. Call `get_design_context` on **every component node** — parent frame and each child.
2. **Do not mark done** until built screenshot is compared to Figma.
3. **Do not reuse** workspace components unless the Figma node is the same component.
4. **No background agents** for pixel-matching UI.

### 2. Figma build checklist (every UI task)

| Step | Question |
|------|----------|
| **Nodes** | Did I pull MCP for the frame *and* each nested component node? |
| **Structure** | Am I building from `get_design_context` tokens, not memory or similar-looking components? |
| **Tokens** | Did I copy exact values (bg, padding, font weight, shadow)? |
| **Preview** | Is there a dev URL to open the component in isolation? |
| **Proof** | Did I screenshot built vs Figma and list remaining diffs? |

**Done = checklist complete**, not "code compiles."

### 3. One Figma node → one code file

- `6051:32770` → `optimization-routes-modal.tsx`
- `6052:8198` → `optimization-route-card.tsx`

### 4. Dev preview pages for new UI

New modal/panel/card → small page under `app/dev/` that opens it with mock data. No need to click through full product flow every time.

### 5. How to kick off UI tasks (user)

Paste **both**:

1. Parent frame URL
2. Child component URLs (card, tab, footer, etc.)

And add:

> "Pull Figma MCP for every node before coding. Screenshot diff before saying done."

### 6. What not to do

| Don't | Why |
|-------|-----|
| Mark figma-pass done without a screenshot | User becomes QA |
| Summarize Figma into a plan and build from the summary | Details get lost |
| Copy patterns from `lasso-workspace-sheet` | Same product, different Figma component |
| Delegate pixel UI to background subagents | Slow, error-prone, no visual accountability |

### 7. What should have happened (attempt 1)

1. Pull `6051:32770` **and** `6052:8198` via MCP
2. Convert returned codegen to inline styles (project pattern)
3. Build only that — don't borrow from `RouteCardCollapsed`
4. Screenshot built UI vs Figma frame
5. Fix diffs before showing the user

---

## Files touched by this incident

| File | Role |
|------|------|
| `components/optimization-routes-modal.tsx` | Stage 3 modal shell |
| `components/optimization-route-card.tsx` | Route card from Figma `6052:8198` |
| `lib/mock-optimization-result.ts` | Mock data matching Figma demo |
| `app/dev/optimized-routes/page.tsx` | Isolated dev preview |
| `.cursor/rules/figma-build.mdc` | Persistent guardrail (added after postmortem) |
