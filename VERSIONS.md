# Route Builder — Prototype Version History

Each row is a frozen snapshot. The Vercel link never changes — it always shows exactly what was in `main` on that date.

| Version | Date | What's in it | Branch | Vercel Preview |
|---------|------|-------------|--------|----------------|
| Phase 1.3 — Balance Table + Route Summary | May 21 2026 | Per-stop balance table, View Route Summary, initial inventory modal, phase 1.3 components restored | `snapshot/phase-1.3-may21` | https://route-builder-n7uao1gb5-hrisikesh-2175s-projects.vercel.app |

---

## How to add a new snapshot

Before pushing a big change to `main`, run:

```bash
git branch snapshot/[name]-[month][day] main
git push origin snapshot/[name]-[month][day]
```

Then:
1. Wait ~2 min for Vercel to build
2. Go to vercel.com → your project → Deployments tab → find the branch → copy the URL
3. Paste it into the table above

## Tips

- Name snapshots after the feature, not the date — easier to find later
- One snapshot per meaningful milestone, not every commit
- Share the frozen Vercel URL with stakeholders — it will never change even as main evolves
