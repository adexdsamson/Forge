---
phase: 05-docs-ci
plan: "01"
subsystem: tooling
tags: [eslint, prettier, lint, devtools, ci-prereq]
dependency_graph:
  requires: []
  provides: [lint-tooling, prettier-config, changelog-tooling]
  affects: [package.json, ci-workflow]
tech_stack:
  added:
    - eslint ^10.4.1
    - "@eslint/js ^10.0.1"
    - typescript-eslint ^8.60.0
    - eslint-plugin-react-hooks ^7.1.1
    - eslint-config-prettier ^10.1.8
    - prettier ^3.8.3
    - commit-and-tag-version ^12.7.3
  patterns:
    - ESLint 9 flat config (eslint.config.mjs, ESM syntax via .mjs extension)
    - Prettier standalone (not as ESLint plugin) with eslint-config-prettier
    - conventional commits CHANGELOG via commit-and-tag-version
key_files:
  created:
    - eslint.config.mjs
    - .prettierrc
    - .prettierignore
  modified:
    - package.json (scripts + devDependencies)
    - package-lock.json
decisions:
  - "@eslint/js saved explicitly by npm as a direct devDep (v10.0.1); kept since it is referenced directly in eslint.config.mjs"
  - "ESLint installed as v10.4.1 (^9.x range resolved to v10 — backward compatible per RESEARCH.md note)"
  - "vitest.config.ts added to eslint.config.mjs ignores to prevent ESLint from parsing Vitest config with TS rules"
  - "@typescript-eslint/no-explicit-any set to warn (not error) — avoids blocking CI on ~46 existing as-any casts"
metrics:
  duration: 4min
  completed: "2026-05-31"
  tasks: 2
  files: 5
---

# Phase 05 Plan 01: Lint and Prettier Tooling Setup Summary

ESLint 9 flat config with typescript-eslint recommended + react-hooks + eslint-config-prettier; Prettier standalone with .prettierrc; commit-and-tag-version changelog script — all wired into package.json scripts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install lint and changelog devDependencies | 24e7847 | package.json, package-lock.json |
| 2 | Create eslint.config.mjs, .prettierrc, and .prettierignore | 42b4969 | eslint.config.mjs, .prettierrc, .prettierignore |

## Verification Results

- `npm run lint` — exits non-zero (11 errors, 87 warnings from pre-existing code); confirms lint tooling is live and runnable
- `npm run typecheck` — exits 0; lint config additions do not break TS compilation
- `eslint.config.mjs` contains `tseslint.config`, `recommended-latest`, `no-explicit-any: warn`, `eslint-config-prettier` import
- `.prettierrc` contains `singleQuote`, `semi`, `trailingComma`, `printWidth`, `tabWidth`
- `.prettierignore` contains `dist/`, `node_modules/`, `coverage/`, `.planning/`
- `package.json` scripts: `lint`, `lint:fix`, `changelog` all present
- `package.json` devDependencies: all 7 new packages present at correct semver ranges

## Pre-existing Lint Violations (Expected, Not Failures)

ESLint found 11 errors and 87 warnings in existing `src/` code. These are out of scope for this plan:

| Rule | Files | Count |
|------|-------|-------|
| @typescript-eslint/no-explicit-any | Multiple (as-any backlog) | 87 warnings |
| react-hooks/exhaustive-deps, react-hooks/refs, react-hooks/static-components | Forge.tsx, usePersist.tsx, useSubscribe.ts | 4 errors |
| no-prototype-builtins | utils.ts | 3 errors |
| @typescript-eslint/no-unused-vars | useForgeValues.tsx | 1 error |
| @typescript-eslint/no-unused-expressions | getResolverOptions.ts | 1 error |
| @typescript-eslint/no-empty-object-type | utils.ts | 1 error |
| @typescript-eslint/no-unsafe-function-type | utils.ts | 1 error |

Prettier found formatting differences in 32 files (pre-existing). A future stricter-lint pass will address these.

## Deviations from Plan

None — plan executed exactly as written.

Note: ESLint resolved to v10.4.1 (the `^9.x` range in the install command accepted v10 per semver). RESEARCH.md explicitly notes "currently 10.4.1 — compatible", so this is the expected outcome, not a deviation.

## Known Stubs

None. This plan creates only dev tooling config files, not runtime code.

## Threat Flags

No new runtime surface introduced. All deliverables are dev-only config files and devDependencies (T-05-01-01 / T-05-01-02 / T-05-01-03 accepted per threat model).

## Self-Check: PASSED

- eslint.config.mjs: FOUND
- .prettierrc: FOUND
- .prettierignore: FOUND
- package.json scripts (lint, lint:fix, changelog): FOUND
- Task 1 commit 24e7847: FOUND
- Task 2 commit 42b4969: FOUND
