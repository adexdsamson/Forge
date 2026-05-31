# Phase 3: Testing - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a real **cross-platform** automated test suite over the now-corrected (Phase 1) and stabilized (Phase 2) library, and enforce a meaningful coverage threshold that fails the run when unmet. Requirements **TEST-01…04**.

**In scope:**
- Writing tests for the core public flow — `useForge` + `<Forge>` + `<Forger>` fill→submit→assert `onSubmit` payload (TEST-02).
- Writing tests for `useFieldArray` (append/remove), `usePersist`/`useForgeValues` value subscriptions, `validateField` rules, and wizard navigation incl. last-step submit (TEST-03).
- Testing the **React Native code branches** via mocked platform detection (no `react-native` install) — the "cross-platform" in the phase goal.
- Rounding out the Phase-1 correctness regression net (CORR-02) on top of the existing CORR-01/04 submit tests.
- Configuring + documenting an enforced coverage threshold (TEST-04).

**Already done (foundation laid in Phase 2 — do NOT redo):**
- Test runner + config (TEST-01): Vitest 4.x, `jsdom` environment, `globals: true`, `@testing-library/react` + `user-event` + `jest-dom`, `vitest.config.ts`, `vitest.setup.ts`, `test` script (`vitest run`) and `test:watch`.
- One regression test: `src/Forge/Forge.submit.test.tsx` — native submit, Enter-to-submit, wizard last-step submit (web/jsdom path; CORR-01/CORR-04). Partially satisfies TEST-02.

**Not in this phase:** packaging/registry/dist hygiene (Phase 4); docs/lint/CI workflows incl. running tests in CI (Phase 5 — CICD-02); publish (Phase 6); any new form features. A **dedicated React Native test environment / RN example app** is explicitly a **v2** requirement (RN-01) — out of scope here; v1 covers RN only via cross-platform unit tests with mocked detection.

</domain>

<decisions>
## Implementation Decisions

### Cross-cutting framing (carried from Phases 1–2)
- **D-01 — Break freely.** Pre-1.0, no published consumers. Tests assert the *corrected* behavior from Phases 1–2; do not write tests that pin pre-fix bugs. (Inherited from Phase 1/2 D-01.)
- **D-02 — Preserve cross-platform-by-runtime-detection.** Tests must not introduce a hard `react-native` import. Platform is decided by the module-level `isWeb`/`isReactNative` constants in `src/utils.ts` (evaluated once at import). (Inherited from Phase 2 D-02.)

### TEST-01/02/03 — Test style (how hooks/components are tested)
- **D-03 — Integration-style tests (render real components).** Test hooks (`useFieldArray`, `usePersist`, `useForgeValues`) and the core flow by rendering a real `<Forge>`/`<Forger>` tree and driving it with `@testing-library` user interactions, asserting observable behavior — matching the existing `Forge.submit.test.tsx`. Rationale: most robust, survives RHF internal changes, and matches the project's core value ("behaves correctly… stays stable across RHF updates"). Prefer this over `renderHook` isolation wherever a hook is naturally exercised through a component. `validateField` (a standalone async function) is tested directly as a function.

### TEST-03 — Cross-platform / React Native coverage strategy
- **D-04 — Test the RN branches via mocked platform detection.** Force React Native mode by mocking the platform-detection source (e.g. `vi.mock` on `src/utils.ts` `isReactNative`/`isWeb`, or the module those constants derive from) so the RN code paths execute under Vitest without installing `react-native`. Cover at minimum: `Forger`/`ForgerController` RN event-handler wiring (`onChangeText`/`onValueChange` via `getEventHandlerName`), `validateField`'s RN branch (`setNativeProps` instead of `reportValidity`/`setCustomValidity`), and `utils.ts` `cloneObject`'s RN guards (`uri`/`_dispatchInstances`). Honors the phase goal's "cross-platform test suite" while keeping a *dedicated* RN environment deferred to v2 (RN-01).
  - **Planner/researcher note:** the platform constants are module-level and evaluated once at import time — the mock MUST be established *before* the SUT module is imported (hoisted `vi.mock` factory, or per-file mock + `vi.resetModules`/dynamic import). This is the central technical risk of D-04; confirm the exact mock seam during research (see RISK-T1).

### TEST-04 — Coverage threshold
- **D-05 — Modest, core-focused threshold (~60–70%), enforced and documented.** Configure Vitest coverage with a global threshold in the ~60–70% band (planner picks the exact number it can realistically clear with the D-03/D-04 tests) such that `yarn test` / `npm test` exits non-zero when coverage falls below it. The threshold value is documented in the test config (and the config is the single source of truth). Focus coverage on the core public API paths rather than chasing exhaustive coverage of edge/plumbing files.
  - **Exclusions (planner finalizes):** barrel/re-export files (`src/index.ts`, the per-hook `index.ts` files), `src/types.ts` (types only), and `*.test.*` files. If a source area's RN branch can't be meaningfully driven even with D-04's mock, exclude or down-scope it rather than inflate the global number with untestable lines.
  - **Metric:** lines/functions/statements are the primary gate; branches may be set lower (planner's call) since RHF-driven branches are harder to fully exercise.

### TEST-03 — Regression scope for Phase-1 fixes
- **D-06 — Keep CORR-01/04 tests; add a CORR-02 regression test.** Retain the existing `Forge.submit.test.tsx` (CORR-01 native/Enter submit, CORR-04 wizard last-step submit). Add a test asserting CORR-02: passing invalid or multiple children to `<Forger>` throws a clear, **Forger-named** error that also names the field `name` (not the generic `Slot` "Only one child allowed" string). CORR-03 (stale JSDoc / dead-duplicate `updateFieldArrayRootError`) is a compile-time/dead-code concern covered by `tsc --noEmit`, not a runtime test — do NOT invent a runtime test for it.

### Claude's Discretion
- **Test file organization:** co-locate `*.test.tsx`/`*.test.ts` next to their source files, matching the existing `src/Forge/Forge.submit.test.tsx` pattern. Do NOT introduce a `__tests__/` directory (DOCS-03 in Phase 5 explicitly removes stale `__tests__/` references — don't reintroduce that path).
- **Coverage provider:** Vitest's default `v8` provider unless the researcher finds a concrete reason to prefer `istanbul`. May require adding `@vitest/coverage-v8` to devDependencies.
- **`yarn` vs `npm`:** ROADMAP success criteria say `yarn test`; the repo is npm-based (`package-lock.json`, no `yarn.lock`). The `test` script works under both invocations — no need to add a `yarn.lock`. Keep npm as the canonical runner; ensure the script name stays `test`.
- **Test data / custom input components:** reuse the minimal `forwardRef` `TextInput` pattern already in `Forge.submit.test.tsx`; extract to a shared test helper if duplicated across files (planner's call).
- **Exact coverage threshold number, exclusion list, and per-metric split** within the D-05 band.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Testing — TEST-01…04 definitions; note RN-01 under v2 (dedicated RN env is NOT this phase).
- `.planning/ROADMAP.md` §"Phase 3: Testing" — the 4 success criteria (what must be TRUE), incl. TEST-02's explicit "web path" wording and TEST-04's "fails with non-zero exit when below threshold, threshold documented in config."

### Existing test foundation (the patterns to extend)
- `vitest.config.ts` — current Vitest config (jsdom, globals, setupFiles); coverage block (D-05) is added here.
- `vitest.setup.ts` — global test setup (jest-dom matchers).
- `src/Forge/Forge.submit.test.tsx` — the existing regression test and the canonical example of integration-style (D-03) testing, the `TextInput` `forwardRef` helper, and the wizard test wiring.
- `package.json` — `scripts.test`/`test:watch` and the test devDependencies already installed (vitest, @testing-library/*, jsdom).

### Behavior-under-test source files
- `src/Forge/Forge.tsx` — `<form>` render + submit wiring + `processChildrenRecursively` child-walker + wizard nav (CORR-01/CORR-04 live here; carries Phase-1 fixes).
- `src/Forger/Forger.tsx` — `Forger`/`ForgerController`/`MemorizeController`; RN event-handler wiring (D-04); `Slot` single-child enforcement + Forger-named child error (CORR-02 / D-06).
- `src/useForge/useForge.tsx` — control augmentation + wizard state (`handleWizardSubmit`, `currentStep`).
- `src/useFieldArray/useFieldArray.tsx` — append/remove/insert/swap/update + per-item input attributes (TEST-03).
- `src/usePersist/usePersist.tsx` — `useWatch` + `useFormState` subscription delivering values + isDirty/isValid (Phase 2 D-12); subscription test (TEST-03).
- `src/useForgeValues/useForgeValues.tsx` — thin `setValue`/`getValue`/`getValues` wrapper; `getValue` throws on unknown field (Phase 2 D-04); subscription test (TEST-03).
- `src/validateField.ts` — async required/min/max/length/pattern/custom validator; platform-aware (`setCustomValidity`/`reportValidity` web vs `setNativeProps` RN) (TEST-03 + D-04).
- `src/utils.ts` — `isWeb`/`isReactNative`/`isMobile` detection constants (the D-04 mock seam) + `cloneObject` RN guards + `Slot`.
- `src/reactNative.ts` — `getEventHandlerName`/`getValuePropertyName`/`getComponentType`/`setReactNativeError` (RN branch helpers, D-04).

### Prior-phase decisions that constrain testing
- `.planning/phases/02-stability/02-CONTEXT.md` — Phase 2 rewrites the hooks under test (D-03/04/06/11/12 there); tests assert the *new* public-API behavior, not the old `_*`-based behavior.

### No external ADRs/specs
- No external ADR/PRD/SPEC docs exist for this phase — decisions above + the codebase maps + existing test file are the source of truth.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Vitest + @testing-library harness** (`vitest.config.ts`, `vitest.setup.ts`, installed devDeps) — TEST-01 is effectively done; Phase 3 extends it (add coverage block) rather than standing it up.
- **`Forge.submit.test.tsx`** — provides the integration-test template, the `TextInput` `forwardRef` custom-input pattern, the wizard test harness, and the `render`/`userEvent`/`waitFor` idioms to copy across new test files.
- **Module-level platform constants (`isWeb`/`isReactNative` in `utils.ts`)** — the single seam to mock for forcing RN mode (D-04).

### Established Patterns
- **`useXxx/` subdir + co-located concerns** — tests co-locate next to source (`src/Forge/Forge.submit.test.tsx`); follow the same layout for new test files (`src/useFieldArray/*.test.tsx`, etc.).
- **Integration over isolation** — the one existing test renders the real component tree; D-03 standardizes this across the suite.
- **jsdom = web mode** — because the detection constants read `window`/`document`, jsdom resolves to web automatically; RN mode requires an explicit mock (D-04).

### Integration Points
- **Coverage config** lands in `vitest.config.ts` (`test.coverage`) — likely needs `@vitest/coverage-v8` added to devDependencies.
- **`test` script** already exists; the coverage threshold must make `vitest run` (and thus `yarn test`/`npm test`) exit non-zero on failure — verify the threshold is wired into the same `test` script, not a separate one (TEST-04 / success criterion #4).

</code_context>

<specifics>
## Specific Ideas

- RN mock (illustrative): hoisted `vi.mock("../utils", async (orig) => ({ ...(await orig()), isReactNative: true, isWeb: false }))` established before importing the SUT — or `vi.resetModules()` + dynamic `import()` after setting the mock. Researcher confirms which seam actually flips the RN branches given the module-level evaluation (RISK-T1).
- CORR-02 assertion (illustrative): rendering `<Forger name="x" component={Input}><span/><span/></Forger>` (or an invalid child) should `throw` an error whose message contains both `Forger` and the field name `x`.
- Coverage block (illustrative): `coverage: { provider: "v8", thresholds: { lines: 65, functions: 65, statements: 65, branches: 50 }, exclude: ["**/index.ts", "src/types.ts", "**/*.test.*"] }` — planner finalizes numbers + exclusions.

</specifics>

<deferred>
## Deferred Ideas

- **Dedicated React Native test environment / RN example app (RN-01)** — explicitly a **v2** requirement. v1 covers RN only via mocked-detection unit tests (D-04). Do not stand up a real `react-native` test preset in this phase.
- **High coverage bar (~90%) / near-exhaustive edge-case testing** — considered and rejected for this milestone in favor of a modest core-focused floor (D-05). Can be raised in a future hardening pass once the suite exists.
- **Snapshot testing / visual regression** — not chosen; the suite asserts behavior, not rendered markup. Revisit only if a concrete need emerges.

None of the above are blockers; noted so they aren't lost.

</deferred>

---

## Risks flagged during discussion (for researcher/planner)

- **RISK-T1 (D-04):** The `isWeb`/`isReactNative` constants are module-level and evaluated **once at import time**. A naive `vi.mock` set after the SUT is already imported will NOT flip the branch. The mock must be hoisted (or use `vi.resetModules` + dynamic import) so the SUT sees RN mode at import. Researcher must confirm the exact mockable seam (the `utils.ts` constants vs whatever they derive from) and a working pattern before the planner commits RN-branch tests.
- **RISK-T2 (D-05):** A coverage threshold that's too high relative to what D-03/D-04 tests can realistically reach will make `yarn test` fail and block the phase from completing. Planner should set the number from *measured* coverage of the written tests, not aspirationally — start by writing the tests, measure, then set the threshold just under the achieved number within the ~60–70% band.
- **RISK-T3 (D-04 / TEST-03):** `validateField`'s RN path calls `setNativeProps` on a ref that won't exist in jsdom. The RN-branch test must supply a mock ref/component exposing `setNativeProps` (and the web-branch test a real input) — confirm the validator's ref contract before writing assertions.

---

*Phase: 3-Testing*
*Context gathered: 2026-05-31*
