# Validation Framework — Handoff Notes

> Personal reference for writing the Slack/message to dev. Not for sharing — the shareable doc is `validation-framework.md`.

---

## What's in the handoff doc (validation-framework.md)

- 4 severity levels (L0/L1/L2/L3) and what each checks
- 4 UI surfaces (route card banner / below-truck / stop strip / break CTA) with trigger conditions
- Full Mermaid decision flowchart — every branch from truck-not-selected to L0+L3 co-occurrence
- Complete copy table: every scenario × every surface, exact string
- Color tokens: hex values + bg rgba for each level
- Multi-product truncation rule: max 2 lines, "Product A and B + N more" format
- L0+L3 co-occurrence: two stacked strips at the same order card, red on top / amber below
- Break CTA badge variants: amber (L3 only) vs red (L0 present) vs red combined copy
- Connector line rules: when it goes amber dashed vs red dashed
- Figma reference for the co-occurrence card: node 1628-46308, file Zvutylr6lxkxIuKMXEuSX6

---

## What's NOT in the handoff doc — mention separately if dev asks

| Topic | Note |
|-------|------|
| R3 three-step demo | Truck select → Load 1 (D2500+G1500) → Load 2 (D500+G500 mid-route). Working in our app, not documented in framework doc |
| `suppressL1L2` edge case | When 2+ loads + L3 passes, L1/L2 details are suppressed in banner but below-truck still shows |
| Drag-reorder + map pin sync | Unrelated to validation |
| Create Order modal (Modal 1/2/3) | Unrelated to validation |
| Backend / API | Everything is mock data currently — no API integration yet |
| `lib/capacity-validation.ts` internals | The function signature, BalanceRow type, RunoutIssue type etc. — share the file directly if he needs it |

---

## Slack message draft

Hey — sharing the validation framework doc for the route builder.
It covers all 4 severity levels (L0 incompatibility / L1 capacity / L2 per-product / L3 runout),
the 4 UI surfaces where messages appear, every copy string per scenario, color tokens,
and the special cases like L0+L3 co-occurring at the same stop (two stacked strips).
Also has a Mermaid decision tree that should give any AI the full picture in one paste.
Figma ref for the co-occurrence card is node 1628-46308 in the dev file.
Let me know if anything's unclear — the logic engine itself is in `lib/capacity-validation.ts`
if you want to reference the actual implementation.
