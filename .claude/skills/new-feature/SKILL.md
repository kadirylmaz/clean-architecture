---
name: new-feature
description: Create a new feature branch cut from the latest develop, auto-numbered feature-1, feature-2, feature-3, .... Use when the user asks to start a new feature, create a feature branch, begin work on a feature, or says something like "yeni feature aç" / "feature branch oluştur".
argument-hint: [optional: short description of the feature, used only for context/commit messages — the branch itself is always named feature-N]
---

# Create a New Feature Branch

## Branching model

- **`main`** — stable/release branch. Treated like a traditional `master`: never branch features from it directly, and it only ever receives merges from `develop` at release time.
- **`develop`** — integration branch. This is the repo's default branch and the base for all feature work.
- **`feature-{N}`** — one branch per feature, always cut from the latest `develop`, always named with a sequential integer (`feature-1`, `feature-2`, `feature-3`, ...) — never a descriptive slug like `feature-login` or `feature/add-todo`.

## Workflow

1. **Check for a clean working tree.** Run `git status --short`. If there are uncommitted changes, stop and ask the user whether to commit, stash, or discard them before switching branches — never carry uncommitted work across a branch switch silently.
2. **Sync `develop`.**
   ```
   git fetch origin
   git checkout develop
   git pull origin develop
   ```
3. **Determine the next feature number.** Look at both local and remote branches:
   ```
   git branch -a | grep -oE 'feature-[0-9]+' | grep -oE '[0-9]+' | sort -n | tail -1
   ```
   Next number = highest found + 1. If none exist, start at `feature-1`.

   Caveat: once a feature branch is merged, it's usually deleted, so this scan only sees branches that still exist. If the user cares about never reusing a number even after deletion, also check merged PR history (GitHub API `GET /repos/{owner}/{repo}/pulls?state=all`, extracting `head.ref` values matching `feature-\d+`) and take the max across both sources.
4. **Create the branch from `develop`:**
   ```
   git checkout -b feature-{N}
   ```
5. **Publish it:**
   ```
   git push -u origin feature-{N}
   ```
6. **Report** the branch name (and what it's for, if the user gave a description) back to the user.

## Rules

- Feature branches are always cut from `develop`, never from `main`.
- Branch names are strictly `feature-{N}` — no suffixes, no descriptive text in the branch name itself. Put the description in the first commit message or PR title instead.
- When a feature is done, it merges back into `develop`, not `main`.
- Never skip the clean-working-tree check in step 1 — switching branches with uncommitted changes can carry them onto the wrong branch or block the checkout.
