# Git commit workflow

Day-to-day guide for committing Wild Spider work locally and pushing to the remote. For Supabase schema updates, see **[COMMIT_AND_DATABASE_MIGRATIONS.md](./COMMIT_AND_DATABASE_MIGRATIONS.md)** (migrations section).

Work from the **repository root** unless you intentionally commit only part of the tree.

---

## Quick checklist

1. `git status` — see what changed; confirm nothing secret or accidental is included.
2. `pnpm lint` and `pnpm test` — recommended before commit (no Git hooks run these automatically).
3. `git add …` — stage what belongs in this commit.
4. `git commit -m "…"` — write a clear message.
5. `git push origin <branch>` — when you want the remote updated (optional until you are ready).
6. `supabase db push` — **only** if you added or changed files under `supabase/migrations/`.

---

## 1. Review changes

```bash
git status
git diff --stat          # summary
git diff                 # full diff (optional)
```

**Do not commit:**

- `.env.local` or other env files with secrets (ignored via `.gitignore`).
- macOS `.DS_Store` or other editor junk — delete or exclude.
- Local experiments you do not want on `main`.

**Large assets** (for example under `public/decks/` or `public/gameArt/`): include them only if they are meant to ship with the app.

---

## 2. Run checks (recommended)

This repo does not run lint/tests on `git commit` automatically. Before committing:

```bash
pnpm lint
pnpm test
```

Optional, slower:

```bash
pnpm test:e2e           # Playwright; may start the dev server
pnpm build              # catches TypeScript / Next.js build issues
```

Fix failures so the commit does not break CI or Vercel.

---

## 3. Stage files

**Everything for one commit:**

```bash
git add -A
git status              # confirm staged vs unstaged
```

**Specific paths only** (for a focused commit or when splitting work):

```bash
git add src/components/game/TableauColumn.tsx src/components/game/GameShell.tsx
```

**Interactive staging** (part of a file):

```bash
git add -p path/to/file
```

---

## 4. Create the commit

One-line message:

```bash
git commit -m "Short summary of why this change matters"
```

Multi-line message (subject + body):

```bash
git commit -m "$(cat <<'EOF'
Improve tableau drag performance and legal-drop handoff.

- Single active useDraggable during drag
- Shared scroll-pane drop-zone measurement
- Portrait load cache to avoid face flash on remount
EOF
)"
```

**Message tips:**

- Prefer **why** over a file list.
- Use present tense or imperative (“Add…”, “Fix…”).
- If Git asks for `user.name` / `user.email`, configure them once (globally or for this repo) and retry.

---

## 5. One commit vs several

| Approach | When to use it |
|----------|----------------|
| **One commit** | Single checkpoint; fine for a phase of work you review as a unit. |
| **Several commits** | Easier review/revert — e.g. “drag perf”, then “deck content”, then “powers UI”. |

To split: stage and commit the first group, then repeat for the next. Use `git log -3 --oneline` to verify history.

---

## 6. Push to the remote

Commits are **local** until you push.

```bash
git branch -vv           # see current branch and tracking remote
git push origin main     # example; use your branch name
```

If the branch has no upstream yet:

```bash
git push -u origin HEAD
```

**After push:** if the repo is connected to Vercel (or similar), pushing `main` often triggers a deploy. That does **not** apply database migrations — see below.

---

## 7. Database migrations (when schema changed)

If this commit includes **new or changed** SQL under `supabase/migrations/`, apply them to the Supabase project your app uses (same project as `NEXT_PUBLIC_SUPABASE_URL`):

```bash
supabase login
supabase link --project-ref <your-project-ref>   # once per clone
supabase db push
```

Full steps and alternatives (SQL editor): **[COMMIT_AND_DATABASE_MIGRATIONS.md](./COMMIT_AND_DATABASE_MIGRATIONS.md)**.

App-only changes (UI, engine, assets, drag behaviour) do **not** require `db push`.

---

## 8. Pull requests (optional)

If you use a branch and GitHub:

```bash
git checkout -b my-feature
# … commit …
git push -u origin my-feature
gh pr create
```

Use your team’s PR template and test plan. The project may use `gh` from the CLI; see Cursor/user rules for PR creation steps.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [COMMIT_AND_DATABASE_MIGRATIONS.md](./COMMIT_AND_DATABASE_MIGRATIONS.md) | Short Git pointer + Supabase `db push` |
| [WILD_SPIDER_SPEC.md](./WILD_SPIDER_SPEC.md) | Product rules — update when behaviour changes |
| [README.md](../README.md) | Scripts (`pnpm dev`, `test`, `test:e2e`, `lint`) |
