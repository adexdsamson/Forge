---
phase: 04-packaging
plan: "02"
subsystem: packaging
tags: [npm-pack, dist-hygiene, smoke-test, type-resolution, tarball, prepack]

dependency_graph:
  requires:
    - phase: 04-01
      provides: "publish-ready package.json with prepack hook, files:[dist], MIT LICENSE"
  provides:
    - "PKG-02 verified: prepack build hook rebuilds dist/ fresh on every pack"
    - "PKG-02 verified: type resolution confirmed via throwaway-project smoke test (no manual tsconfig path config)"
    - "PKG-03 verified: dist/ absent from git (git ls-files dist/ = 0 lines)"
    - "PKG-02/PKG-03 verified: npm pack --dry-run tarball list exactly matches files:[dist] allowlist"
    - "Human-approved smoke test: useForge / Forge / Forger all resolve from dist/index.d.ts"
  affects: [Phase 05 docs, Phase 06 release]

tech_stack:
  added: []
  patterns:
    - "prepack hook (npm run build) guarantees fresh dist/ artifact on every pack/publish call"
    - "files:[dist] as the single tarball allowlist — no .npmignore needed"

key_files:
  created: []
  modified: []

key-decisions:
  - "D-06: files:[dist] keeps sourcemaps (*.js.map) in tarball — dry-run confirms both .cjs.js.map and .esm.js.map included; dist/index.d.ts.map absent (expected: rollup-plugin-dts emits no declaration sourcemap)"
  - "D-07: full fresh-project smoke test verifies type resolution — throwaway TS project outside repo, tarball installed via local path, tsc --noEmit exits 0 with zero module-not-found errors"
  - "D-08: no .npmignore exists or needed — files:[dist] is the single authoritative include list; npm pack --dry-run confirms npm honors it with no src/ or .env files included"

requirements-completed: [PKG-02, PKG-03]

duration: "~30 min (including human smoke test)"
completed: "2026-05-31"
tasks: 2
files_changed: 0
---

# Phase 4 Plan 02: Packaging Verification Summary

**End-to-end tarball hygiene and type-resolution smoke test pass — dist/ clean from git, prepack hook rebuilds fresh artifacts, npm pack tarball contains exactly the right 8 files, and throwaway-project tsc resolves all three core exports with zero path config.**

## Performance

- **Duration:** ~30 min (including human smoke test gate)
- **Started:** 2026-05-31
- **Completed:** 2026-05-31
- **Tasks:** 2 (1 automated, 1 human-verify checkpoint)
- **Files modified:** 0 (verification-only plan)

## Accomplishments

- All four Phase 4 requirements (PKG-01..PKG-04) confirmed satisfied end-to-end.
- `git ls-files dist/` returned 0 lines — dist/ is not tracked by git (PKG-03).
- `npm run prepack` (→ `npm run build` → `rollup -c`) exited 0 and recreated dist/ from scratch after dist/ was deleted (PKG-02 build hook).
- `npm pack --dry-run` listed exactly 8 files: LICENSE, README.md, package.json, dist/index.cjs.js, dist/index.cjs.js.map, dist/index.d.ts, dist/index.esm.js, dist/index.esm.js.map — no src/, no .env, no credentials (PKG-02 / PKG-03 / D-06 / D-08).
- Human smoke test: tarball installed into a fresh throwaway TypeScript project; `import { useForge, Forge, Forger } from "@adexdsamson/forge"` resolved with zero "Cannot find module" errors; tsc --noEmit exited 0 (PKG-02 / D-07). Human typed "approved".

## Task Commits

This plan creates no source commits (files_modified: []). The plan metadata commit below is the only commit.

**Plan metadata:** (docs commit — see Final Commit section below)

## Automated Check Results (Task 1)

### CHECK 1 — dist hygiene (PKG-03)

```
$ git ls-files dist/
(no output — zero lines)
```

**Result: PASS** — dist/ is not tracked by git.

### CHECK 2 — prepack build hook (PKG-02)

```
$ npm run prepack
> @adexdsamson/forge@1.0.3 prepack
> npm run build

> @adexdsamson/forge@1.0.3 build
> rollup -c

...rollup bundler output (exit 0)...

$ ls dist/
index.cjs.js  index.cjs.js.map  index.d.ts  index.esm.js  index.esm.js.map
```

**Result: PASS** — prepack exited 0; dist/ recreated from scratch containing:
- `dist/index.cjs.js` (34.8 kB)
- `dist/index.cjs.js.map` (21.8 kB)
- `dist/index.d.ts` (10.3 kB)
- `dist/index.esm.js` (34.0 kB)
- `dist/index.esm.js.map` (21.5 kB)

Note: `dist/index.d.ts.map` is absent — expected behavior; `rollup-plugin-dts` does not emit a declaration sourcemap.

### CHECK 3 — npm pack --dry-run (PKG-02 / PKG-03 / D-06 / D-08)

```
$ npm pack --dry-run
npm notice
npm notice 📦  @adexdsamson/forge@1.0.3
npm notice === Tarball Contents ===
npm notice 1.1kB   LICENSE
npm notice 8.4kB   README.md
npm notice 34.8kB  dist/index.cjs.js
npm notice 21.8kB  dist/index.cjs.js.map
npm notice 10.3kB  dist/index.d.ts
npm notice 34.0kB  dist/index.esm.js
npm notice 21.5kB  dist/index.esm.js.map
npm notice 2.3kB   package.json
npm notice === Tarball Details ===
npm notice name:          @adexdsamson/forge
npm notice version:       1.0.3
npm notice package size:  31.0 kB
npm notice unpacked size: 134.2 kB
npm notice shasum:        ...
npm notice integrity:     sha512-...
npm notice total files:   8
```

**Result: PASS** — tarball contains exactly 8 files:
- LICENSE (npm auto-include from repo root) — present
- README.md (npm auto-include) — present
- dist/index.cjs.js + .map — present (D-06 sourcemaps confirmed)
- dist/index.d.ts — present (types entry point)
- dist/index.esm.js + .map — present (D-06 sourcemaps confirmed)
- package.json (npm auto-include) — present
- No src/ files — confirmed absent (D-08 / T-04-08 mitigated)
- No .env / credential files — confirmed absent (T-04-08 mitigated)
- `dist/index.d.ts.map` — absent (expected; rollup-plugin-dts does not emit declaration sourcemap)

## Smoke Test Result (Task 2 — Human-Verify Gate)

**Gate status: APPROVED by human**

Steps performed:

1. `npm pack` produced `adexdsamson-forge-1.0.3.tgz` in the Forge repo root.
2. Throwaway project created at `C:\Temp\forge-smoke-test` (outside the Forge repo): `npm init -y`, installed `typescript @types/react react react-hook-form`, ran `npx tsc --init`.
3. Tarball installed: `npm install <path-to-tgz>` — exited 0.
4. `smoke.ts` created:
   ```typescript
   import { useForge, Forge, Forger } from "@adexdsamson/forge";
   const _check = { useForge, Forge, Forger };
   ```
5. `npx tsc --noEmit` — module path `@adexdsamson/forge` and its types **resolved successfully** from `dist/index.d.ts` with no manual `tsconfig.json` path mapping required.

**Caveat recorded (not a Forge defect):** A first run of `npx tsc --noEmit` reported TS1295 (`verbatimModuleSyntax` / file treated as CommonJS). This is a consumer tsconfig default from modern `tsc --init` (TypeScript 5.x emits `verbatimModuleSyntax: true` + `module: commonjs` without `"type":"module"` in package.json). The error fired because the consumer's own import syntax mode was rejected by the consumer's compiler settings — module resolution of `@adexdsamson/forge` had already succeeded at that point. After setting `verbatimModuleSyntax: false` in the throwaway project's tsconfig (or adding `"type":"module"` to its package.json), `npx tsc --noEmit` exited 0 cleanly. This is a consumer configuration concern, not a Forge packaging defect.

6. Throwaway directory and `.tgz` cleaned up.

**tsc output (final run):** No output — exit 0.

**Human verdict:** "approved"

## Phase 4 Requirements Confirmation (PKG-01..PKG-04)

| Requirement | Description | Verified In | Status |
|-------------|-------------|-------------|--------|
| PKG-01 | package.json has `@adexdsamson/forge`, populated description/keywords/repository/homepage/author(object)/license, no `private` key | Plan 01 Task 1 | PASS |
| PKG-02 | npm pack --dry-run lists main(CJS)/module(ESM)/types(.d.ts); prepack rebuilds artifacts; smoke test confirms types resolve without manual path config | Plan 02 Task 1 + Task 2 | PASS |
| PKG-03 | dist/ in .gitignore + `git ls-files dist/` returns 0 lines; `files:["dist"]` limits tarball to dist/ contents only | Plan 02 Task 1 | PASS |
| PKG-04 | publishConfig.registry === "https://registry.npmjs.org", CI publish step runs from root, decision documented in PROJECT.md | Plan 01 Task 1-3 | PASS |

**All Phase 4 requirements satisfied.**

## Decisions Made

- **D-06:** `files:["dist"]` keeps sourcemaps (`.js.map` files) in tarball. Dry-run confirms `dist/index.cjs.js.map` and `dist/index.esm.js.map` are included. `dist/index.d.ts.map` is absent — expected (rollup-plugin-dts emits no declaration sourcemap).
- **D-07:** Full fresh-project smoke test (outside repo, local tarball install, `tsc --noEmit`) is the PKG-02 experiential gate. Confirms types resolve from `dist/index.d.ts` with zero consumer path configuration. The TS1295/verbatimModuleSyntax caveat is documented as a consumer tsconfig concern, not a Forge defect.
- **D-08:** No `.npmignore` exists or should be added. `files:["dist"]` is the single authoritative include allowlist. `npm pack --dry-run` confirms npm honors it — no src/ or .env files appear in the tarball.

## Deviations from Plan

None — plan executed exactly as written. All three automated checks passed on first run; human smoke test approved on the second `tsc --noEmit` invocation after adjusting the consumer's own tsconfig (verbatimModuleSyntax caveat documented above, not a deviation in Forge).

## Issues Encountered

**TS1295 / verbatimModuleSyntax in smoke test consumer:** Modern `tsc --init` (TypeScript 5.x) generates `verbatimModuleSyntax: true` + `module: commonjs` by default. This combination rejects `import` syntax in `.ts` files unless the project is also ESM (`"type":"module"`). The error is from the throwaway project's own compiler settings, not from Forge's package. Resolved by setting `verbatimModuleSyntax: false` in the consumer's `tsconfig.json`. This behavior should be noted in Forge's README consumer setup guide.

## Known Stubs

None. This plan is verification-only — no source files created or modified.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan ran read-only verification commands only.

## Next Phase Readiness

- Phase 4 packaging is fully complete. All four requirements (PKG-01..PKG-04) are satisfied.
- Forge v1.0.3 is ready for publish to npmjs.org (`npm publish` from repo root will trigger `prepack` → `build`, then publish the fresh tarball).
- Phase 5 (Documentation) and Phase 6 (Release) can proceed.
- **Recommended README addition:** Consumer setup note about `verbatimModuleSyntax` / `"type":"module"` for TypeScript 5.x projects (TS1295 caveat above).

## Self-Check: PASSED

- [x] 04-02-SUMMARY.md written at correct path
- [x] git ls-files dist/ check result recorded (0 lines)
- [x] prepack build hook result recorded (exit 0, dist/ recreated with 5 files)
- [x] npm pack --dry-run full file list recorded (8 files, no src/, no .env)
- [x] Smoke test result recorded (tsc exit 0, no module-not-found)
- [x] verbatimModuleSyntax caveat documented
- [x] Human "approved" recorded
- [x] All PKG-01..PKG-04 requirements confirmed
- [x] No dist/ files staged or committed
- [x] files_modified: [] (verification-only plan, no source changes)

---
*Phase: 04-packaging*
*Completed: 2026-05-31*
