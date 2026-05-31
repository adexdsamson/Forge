---
phase: 04-packaging
plan: "01"
subsystem: packaging
tags: [package.json, ci, license, metadata, registry]
dependency_graph:
  requires: []
  provides: [publish-ready package.json, root-level CI publish, MIT LICENSE, registry decision record]
  affects: [package.json, .github/workflows/publish.yml, LICENSE, .planning/PROJECT.md]
tech_stack:
  added: []
  patterns: [prepack build hook, sideEffects: false, engines field, author object]
key_files:
  created: [LICENSE]
  modified: [package.json, .github/workflows/publish.yml, .planning/PROJECT.md]
decisions:
  - "D-01: Public npm (registry.npmjs.org) chosen over GitHub Packages — zero-config consumer install"
  - "D-02: publishConfig encodes registry + access: public explicitly"
  - "D-03: PROJECT.md Key Decisions row updated to record settled registry choice"
  - "D-04: CI publish step runs from repo root (working-directory: dist removed)"
  - "D-05: prepack script delegates to npm run build for fresh dist on every pack/publish"
  - "D-09: author expanded to object (name + url, no email), sideEffects: false, engines.node >=18"
  - "D-10: type field remains absent"
  - "D-11: MIT LICENSE file created at repo root, copyright 2026 adexdsamson"
metrics:
  duration: "~2 minutes"
  completed: "2026-05-31"
  tasks: 3
  files_changed: 4
---

# Phase 4 Plan 01: Package Metadata + Registry + LICENSE Summary

**One-liner:** publishConfig fixed to npmjs.org with access:public, prepack build hook added, MIT LICENSE created, CI publish-from-root wired, author/sideEffects/engines polished.

## What Was Changed

### package.json (Task 1)

Five surgical edits applied:

1. **publishConfig** — replaced `https://npm.pkg.github.com/adexdsamson` with `{ registry: "https://registry.npmjs.org", access: "public" }` (D-01, D-02)
2. **scripts.prepack** — added `"prepack": "npm run build"` as first entry in scripts block (D-05); existing `build` script (`rollup -c`) untouched
3. **author** — expanded from string `"adexdsamson"` to object `{ name: "adexdsamson", url: "https://github.com/adexdsamson" }` — no email field added (D-09)
4. **sideEffects** — added `false` at top level near `license` field (D-09)
5. **engines** — added `{ "node": ">=18" }` at top level (D-09)

Fields confirmed unchanged: `name`, `version` (1.0.3), `description`, `keywords`, `repository`, `homepage`, `bugs`, `license` (MIT), `files` (["dist"]), `main`, `module`, `types`, `exports`, `peerDependencies`, `devDependencies`. `type` field remains absent (D-10).

### .github/workflows/publish.yml (Task 2)

Removed exactly one line: `working-directory: dist` from the publish step (D-04). The publish step now runs from repo root. All other fields untouched: `registry-url: https://registry.npmjs.org` (already correct), `--access public`, `NPM_ACCESS_TOKEN`.

### LICENSE (Task 2)

Created new file at repo root with standard MIT License boilerplate (D-11):
- First line: `MIT License`
- Copyright line: `Copyright (c) 2026 adexdsamson`
- Full permission grant paragraph
- Warranty disclaimer
- npm auto-includes this in the tarball; no change to `files: ["dist"]` needed.

### .planning/PROJECT.md (Task 3)

Updated the Key Decisions table row for publish target:
- Old: `— Pending` (publish target deferred)
- New: `Public npm (D-01) — publishConfig and CI workflow now both point to registry.npmjs.org`
- Rationale updated: GitHub Packages auth friction vs zero-config public npm install
- Last-updated footnote updated to reference Phase 4 packaging progress

## Automated Check Results

All automated verification commands exited 0:

**Task 1 (package.json):**
```
PASS
```
(publishConfig.registry, publishConfig.access, scripts.prepack, author object, sideEffects, engines.node, no type, version 1.0.3, files ["dist"], all preserved fields confirmed)

**Task 2 (CI + LICENSE):**
```
{ noWd: true, hasNpm: true, hasToken: true, licFirst: true, licCopy: true }
```

**Task 3 (PROJECT.md):**
```
{ hasNpm: true, hasD01: true, noDeferred: true }
```

**Overall plan verification:**
- publishConfig.registry: "https://registry.npmjs.org" — PASS
- publishConfig.access: "public" — PASS
- scripts.prepack: "npm run build" — PASS
- author: object with name + url — PASS
- sideEffects: false — PASS
- engines.node: ">=18" — PASS
- type: undefined (absent) — PASS
- version: "1.0.3" — PASS
- files: ["dist"] — PASS
- No working-directory in CI — PASS
- LICENSE first line: "MIT License" — PASS
- LICENSE copyright: "Copyright (c) 2026 adexdsamson" — PASS
- PROJECT.md "Public npm" + "D-01" present, no "— Pending" row — PASS

## Deviations from Plan

None — plan executed exactly as written. All five package.json edits, both Task 2 file changes, and the PROJECT.md update applied precisely per spec.

## Confirmation

- `version`: `"1.0.3"` — unchanged (Phase 6 owns version bump)
- `files`: `["dist"]` — unchanged (D-06/D-08)
- No `type` field added (D-10)
- No email added to author (D-09 / T-04-02 threat mitigation)

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 — package.json metadata | 889758e | package.json |
| Task 2 — CI publish-from-root + LICENSE | d2d5302 | .github/workflows/publish.yml, LICENSE |
| Task 3 — PROJECT.md decision record | 008617c | .planning/PROJECT.md |

## Known Stubs

None. This plan modifies configuration files only — no UI components, no data sources, no placeholder values.

## Self-Check: PASSED

- [x] package.json exists and all 5 edits verified (node require exits 0)
- [x] .github/workflows/publish.yml has no working-directory string
- [x] LICENSE exists at repo root with correct MIT text
- [x] .planning/PROJECT.md contains "Public npm" and "D-01", no "— Pending" row
- [x] Commits 889758e, d2d5302, 008617c all present in git log
