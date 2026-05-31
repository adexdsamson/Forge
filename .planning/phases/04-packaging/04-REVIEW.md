---
phase: 04-packaging
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - package.json
  - .github/workflows/publish.yml
  - LICENSE
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-05-31T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Phase 4 packaging changes that prepare Forge for publish to public npm:
`package.json` (publishConfig flip to npmjs.org + `access: public`, `prepack` hook,
`sideEffects: false`, `engines`, structured `author`), the `publish.yml` CI workflow
(removal of `working-directory: dist`), and the new MIT `LICENSE`.

The single most important change — removing `working-directory: dist` so that
`npm publish` runs from the repo root where `package.json`, `files: ["dist"]`, and the
root-relative `main`/`module`/`types`/`exports` paths actually resolve — is correct and
necessary (publishing from `dist/` would have produced `dist/dist/...` resolution and had
no manifest). publishConfig now agrees with the CI `registry-url`. LICENSE is valid MIT
with a correct copyright line. Version integrity is preserved (still `1.0.3`).

However, the CI workflow has a publish-breaking gap: the `prepack` hook now depends on
build devDependencies that the workflow never installs. There are also several robustness
and metadata-hygiene concerns worth fixing before this ships.

## Critical Issues

### CR-01: CI publish will fail — `prepack` runs the build but no dependencies are ever installed

**File:** `.github/workflows/publish.yml:16-30` (interacts with `package.json:16`)
**Issue:** The workflow runs exactly three steps: `checkout`, `setup-node`, then
`npm publish`. There is **no `npm ci` / `npm install` step**. `npm publish` triggers the
newly added `prepack` hook (`"prepack": "npm run build"` → `rollup -c`). Rollup and every
build plugin (`@rollup/plugin-typescript`, `rollup-plugin-dts`, `typescript`, `tslib`,
etc.) are `devDependencies` that are absent on a fresh `ubuntu-latest` runner. `npm run
build` will fail with "rollup: command not found" / missing module, aborting the publish.
Even if `prepack` somehow no-op'd, there would be no `dist/` to publish since nothing built
it. Net effect: the publish job fails on every push to `main`.
**Fix:** Add an install step before publish so the build toolchain exists:
```yaml
      - name: install
        run: npm ci

      - name: publish
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_ACCESS_TOKEN }}
```
(`npm ci` requires the committed `package-lock.json`, which the project has.)

## Warnings

### WR-01: No publish guard — every push to `main` attempts a publish, version collisions hard-fail the workflow

**File:** `.github/workflows/publish.yml:5-6`
**Issue:** The trigger is `push: branches: [main]` with no tag gate, no `if` condition, and
no version-changed check. Any merge to `main` — docs, planning commits, a README typo —
re-runs `npm publish`. npm rejects republishing an already-published version, so once
`1.0.3` is live every subsequent push produces a red, failing workflow (and noisy failure
emails) until someone bumps the version. This couples "publish" to "any commit" rather than
to an intentional release.
**Fix:** Gate publishing on a tag or release event, or guard the publish step, e.g.:
```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
```
or keep the push trigger but skip when the version already exists
(`npm view @adexdsamson/forge@<version>` check) so non-release commits don't fail.

### WR-02: `prepack` build is not type-checked or tested before publish

**File:** `package.json:16` (interacts with `.github/workflows/publish.yml`)
**Issue:** `prepack` runs only `npm run build` (rollup). Rollup transpiles via
`@rollup/plugin-typescript` but the project relies on a separate `typecheck`
(`tsc --noEmit`) and `test` step for correctness — neither runs in the publish path, and
the CI workflow has no test/typecheck job. A type error or failing test can therefore be
published to the public registry. For an OSS package this is a real quality/data-integrity
risk (consumers install broken types).
**Fix:** Either run validation in CI before publish, or chain it into the lifecycle:
```jsonc
"prepublishOnly": "npm run typecheck && npm run test && npm run build"
```
and add a `typecheck`/`test` step to the workflow before the publish step.

### WR-03: `publishConfig.registry` has a trailing-slash/path mismatch risk and no provenance

**File:** `package.json:27-30` (interacts with `.github/workflows/publish.yml:25`)
**Issue:** `publishConfig.registry` is `https://registry.npmjs.org` while the workflow's
`registry-url` is `https://registry.npmjs.org` — these agree (good). But note `setup-node`
writes an `.npmrc` keyed to its `registry-url`; if either value later drifts (e.g. a
trailing slash, or the scope-specific `//registry.npmjs.org/:_authToken` line) the
`NODE_AUTH_TOKEN` auth line won't match the registry npm resolves for the `@adexdsamson`
scope and publish will 401. The current values are consistent, so this is a robustness/
maintenance warning rather than a present-tense break. Consider pinning the scope auth
explicitly.
**Fix:** Keep both registry strings byte-identical (no trailing slash), and rely on
`setup-node`'s generated `.npmrc`. Optionally add `--provenance` (requires `id-token: write`
permissions) for supply-chain attestation when publishing public OSS.

## Info

### IN-01: Unpinned GitHub Actions (`@v3` major tags)

**File:** `.github/workflows/publish.yml:18,21`
**Issue:** `actions/checkout@v3` and `actions/setup-node@v3` are pinned to mutable major
tags rather than commit SHAs. This is a supply-chain consideration. Per phase scope, action
pinning is Phase 5 work — noted as informational only, not a blocker for Phase 4.
**Fix:** (Phase 5) Pin to full commit SHAs, e.g. `actions/checkout@<sha> # v4`.

### IN-02: `engines.node >=18` is looser than the CI/runtime baseline

**File:** `package.json:46-48`
**Issue:** `engines` declares `node >=18`, but CI pins Node 20 and the project docs state a
Node 20 baseline. This is not a defect for a runtime library (the published code targets
ES2019 and has no Node-20-only runtime needs), but the looser floor means consumers on Node
18 are nominally "supported" without being CI-verified. Harmless for a browser/RN library;
flagged for awareness.
**Fix:** Optional — leave as-is (wider compatibility is fine for a UI library), or align to
`>=20` if any tooling assumes it.

---

_Reviewed: 2026-05-31T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
