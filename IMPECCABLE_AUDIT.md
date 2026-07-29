# Impeccable Audit

Branch: `experiment/impeccable`
Base commit: `a6551943e3693bebf62388ee5b13a766faf2f2e8`
Tooling:

- Node: `v24.14.0` (meets Impeccable requirement Node >= 22.12).
- CLI package: `impeccable 3.4.0`.
- Installed skill: `.agents/skills/impeccable`, skill metadata version `4.0.2`.
- Install command used in this environment: `pnpm dlx impeccable install -y --providers=codex --scope=project`.
- Official command requested/documented by Impeccable: `npx impeccable install`. This Codex runtime did not expose `npx`; `pnpm dlx` was used only as the package runner for the same `impeccable` package.

## Installed Files

Impeccable produced:

- `.agents/skills/impeccable/**`
- `.codex/hooks.json`

The hook config runs the Impeccable detector after edit/write/apply_patch and at stop time in this experimental branch.

## Commands Run

- `pnpm dlx impeccable --version`
- `pnpm dlx impeccable --help`
- `pnpm dlx impeccable detect --json app`
- `pnpm dlx impeccable detect --json https://facuu-bazzano.github.io/design-systems-lab/`

Additional validation commands are listed in the final validation section once run.

## Detector Result: Source Scan

Command: `pnpm dlx impeccable detect --json app`

Exit behavior: non-zero because findings were detected. The command executed successfully.

Findings:

| Rule | Severity | File | Line | Snippet | Assessment |
|---|---:|---|---:|---|---|
| `side-tab` | warning | `app/globals.css` | 15 | `border-left:4px solid var(--ds-action)` | Review before changing. Likely project-preview/component state treatment, not necessarily Lab chrome. |
| `side-tab` | warning | `app/globals.css` | 17 | `border-left:4px solid var(--accent)` | Review. Could be old/internal nav or accent affordance. Needs visual context. |
| `side-tab` | warning | `app/globals.css` | 50 | `border-left:3px solid var(--ds-focus)` | Review. Focus/info alert treatments may intentionally use left accent. |
| `side-tab` | warning | `app/globals.css` | 51 | `border-left:3px solid var(--ds-warning)` | Review. Warning state may be acceptable if not card decoration. |
| `side-tab` | warning | `app/globals.css` | 187 | `border-right:2px solid var(--ui-muted)` | Likely false positive or low priority; could be structural separator rather than side-tab decoration. |
| `side-tab` | warning | `app/globals.css` | 64 | `border-left-width:4px` | Review. Shared alert component may still use left-accent convention. |
| `side-tab` | warning | `app/lib/exporters.ts` | 54 | `border-left:4px solid var(--ds-success)` | High-value review because exported documentation should not inherit visual anti-patterns without need. |
| `overused-font` | warning | `app/lib/exporters.ts` | 54 | `font-family:Inter` | Do not apply by default. Inter/system sans is an explicit operational UI choice in this product. |

## Prioritized Findings

### Critical Real Issues

None confirmed from static detector output alone.

The detector did not report blockers such as missing contrast, broken controls, invalid markup, or runtime failures. Static `side-tab` warnings need visual confirmation before action.

### High-Value Improvements To Review

1. **Exported documentation alert styling**

   `app/lib/exporters.ts:54` uses `border-left:4px solid var(--ds-success)`. Exported HTML documentation should look like a documentation site, not raw alert cards with left-accent strips. This is worth reviewing if documentation polish becomes the next scope.

2. **Shared alert/state left borders**

   Several `app/globals.css` findings point to left-border state accents. Some may be legitimate warning/error affordances, but the project has a history of user feedback against ambiguous/decorative badges and heavy visual accents. Any future change should distinguish functional state emphasis from decorative side-tab styling.

3. **Old CSS residue**

   Some detector lines appear in older `.lab-shell` / legacy class blocks while the current app uses `.lab-v4` and the internal UI library. A cleanup pass may reduce false positives and maintenance risk, but it should be scoped and tested because old classes may still support exports or fallback views.

### False Positives / Do Not Apply Automatically

1. **`overused-font` for Inter**

   Inter is acceptable here because the Lab is an operational tool. Distinctive typography is lower priority than readable forms, tables, inspectors, and dense controls. Do not replace the internal typeface solely to satisfy this rule.

2. **Structural separators**

   `border-right:2px solid var(--ui-muted)` should not be changed without locating the rendered element. It may be a structural divider, not a side-tab decoration.

3. **Project preview state accents**

   Some findings use `--ds-*` variables, meaning they may belong to project previews or exported project examples. These must not be changed as Lab styling unless the token model and preview semantics are reviewed together.

## URL Scan

Command: `pnpm dlx impeccable detect --json https://facuu-bazzano.github.io/design-systems-lab/`

Result:

- Detector returned `[]`.
- It also reported that Puppeteer could not find Chrome `151.0.7922.47` in `C:\Users\facuu\.cache\puppeteer`.
- No browser package was installed because this task is limited to testing Impeccable setup/audit on an experimental branch.

Conclusion: URL scan was attempted but is not reliable in this environment until Puppeteer Chrome is installed. Source scan is the authoritative audit for this branch.

## Explicit Non-Changes

No product UI changes were made.

No component implementations were changed.

No navigation changes were made.

No visual redesign was implemented.

No GitHub Pages workflow/deployment behavior was changed.

No production deploy was triggered from this branch intentionally.

No detector findings were fixed yet; this branch is for review and experimentation only.

## Final Validation

- `node --version`: `v24.14.0`.
- `pnpm install --frozen-lockfile`: dependencies were installed in the experimental worktree, but pnpm exited with `ERR_PNPM_IGNORED_BUILDS` because build scripts for packages such as `esbuild`, `sharp`, `workerd`, and others were not approved interactively. The installed dependency tree was still sufficient for the validation commands below.
- Product lint: passed with `.agents`, `_next`, and `_not-found` ignored. The first broad lint run intentionally exposed third-party Impeccable skill files and generated static assets, so it was not considered a product lint signal.
- `node scripts/build-pages.mjs`: passed for Next static export and Storybook static export. It required running outside the sandbox because Storybook cache access was blocked inside the sandbox. Next emitted a non-blocking workspace-root warning because this branch is in a nested worktree.
- `node --test tests/*.test.mjs`: passed, 19/19.

## Branch Safety

- Work was done in the isolated worktree `.codex-worktrees/impeccable` on branch `experiment/impeccable`.
- `main` was not checked out, committed to, pushed to, or deployed.
- No production workflow file was modified.
- No GitHub Pages deploy was intentionally triggered from this branch.
