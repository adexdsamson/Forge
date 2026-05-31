# Phase 3: Testing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 3-Testing
**Areas discussed:** RN/cross-platform coverage, Coverage threshold, Hook test style, Phase-1 regression scope

---

## RN coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Mock-the-detection unit tests | Force RN mode by mocking the platform-detection module; unit-test RN branches (event wiring, validateField RN path, RN clone guards). No react-native install. Dedicated RN env stays v2 (RN-01). | ✓ |
| Web-only for v1 | Test only the jsdom/web path; lean on v2's RN-01 for RN testing. Leaves shipped RN branches with zero coverage. | |
| Full RN test environment now | Stand up a real react-native test preset this phase. Exactly what RN-01 defers to v2 — scope creep. | |

**User's choice:** Mock-the-detection unit tests
**Notes:** Honors the phase goal's "cross-platform test suite" wording while keeping a dedicated RN environment in v2. Central technical risk captured as RISK-T1 (module-level constants evaluated at import → mock must be hoisted).

---

## Coverage threshold

| Option | Description | Selected |
|--------|-------------|----------|
| 80% global, RN branches excluded | ~80% lines/functions/statements + ~70% branches, standard exclusions. | |
| High bar (~90%) | ~90% across metrics, minimal exclusions. Heavier, more likely to block. | |
| Modest floor (~60-70%) | Lower threshold focused on core public API paths. Easy to clear; planner sets exact number from measured coverage. | ✓ |
| You decide | Defer number + exclusions entirely to planner. | |

**User's choice:** Modest floor (~60-70%)
**Notes:** Threshold must make `vitest run` exit non-zero when unmet (TEST-04). Exact number/exclusions/per-metric split left to planner within the band; set from measured coverage (RISK-T2).

---

## Test style

| Option | Description | Selected |
|--------|-------------|----------|
| Integration (render real components) | Test hooks through a real <Forge>/<Forger> render + user interactions; assert observable behavior. Matches existing submit test; survives RHF internal changes. | ✓ |
| renderHook (unit) | Drive hooks in isolation via @testing-library renderHook. More granular, more brittle to RHF shifts. | |
| Mix per hook | Integration for component-coupled hooks, renderHook for standalone ones. Two patterns to maintain. | |

**User's choice:** Integration (render real components)
**Notes:** `validateField` (standalone async fn) is still tested directly as a function; everything else goes through a rendered component tree.

---

## Regression scope (Phase-1 fixes)

| Option | Description | Selected |
|--------|-------------|----------|
| Round out CORR-02, keep CORR-01/04 | Keep existing CORR-01/04 submit tests; add CORR-02 (Forger child error names Forger + field name). CORR-03 is typecheck-only. | ✓ |
| TEST-03 list only | Cover only what TEST-03 enumerates plus existing tests; no extra correctness-regression tests. | |
| You decide | Defer regression depth to planner. | |

**User's choice:** Round out CORR-02, keep CORR-01/04
**Notes:** CORR-03 (stale JSDoc / dead duplicate code) is covered by `tsc --noEmit`, not a runtime test — explicitly do not invent a runtime test for it.

---

## Claude's Discretion

- Test file organization: co-locate `*.test.*` next to source (matches `Forge.submit.test.tsx`); no `__tests__/` directory.
- Coverage provider: Vitest default `v8` unless a reason to prefer istanbul; likely add `@vitest/coverage-v8`.
- `yarn test` vs `npm test`: repo is npm-based; `test` script works under both — keep npm canonical, no yarn.lock.
- Shared test helper (TextInput forwardRef) extraction if duplicated.
- Exact coverage number, exclusion list, and per-metric split within the ~60–70% band.

## Deferred Ideas

- Dedicated React Native test environment / RN example app — v2 (RN-01).
- High coverage bar (~90%) / near-exhaustive edge-case testing — future hardening pass.
- Snapshot / visual-regression testing — not chosen; suite asserts behavior, not markup.
