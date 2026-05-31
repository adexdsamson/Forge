---
phase: 2
slug: stability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Note:** There is NO test runner until Phase 3. The Phase 2 safety net is the
> TypeScript compiler + Rollup build + documented manual behavioral checks. Every
> task's "automated" verification is a build/type/static-assertion command; the
> Phase-1 runtime fixes carried by the child-walker (RISK-04) are manual-only.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no unit-test runner this phase (tests land in Phase 3) |
| **Config file** | `tsconfig.json` (strict), `rollup.config.mjs` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx rollup -c` |
| **Estimated runtime** | ~15–40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (must be clean — zero errors)
- **After every plan wave:** Run `npx tsc --noEmit && npx rollup -c` (type + build green)
- **Before `/gsd-verify-work`:** Full build green AND every Manual-Only check below performed
- **Max feedback latency:** ~40 seconds

---

## Per-Task Verification Map

> Filled by the planner per task. Because there is no test runner, "Automated
> Command" is a `tsc`/`rollup`/`grep`/`node -e` static assertion, not a unit test.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | STAB-{XX} | — | N/A | static | `npx tsc --noEmit` / `grep -c "_subjects\|_formValues\|_names" src/...` → 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Static-assertion patterns available this phase:**
- Zero `_*` access in a call path: `grep -rn "control\._" src/<file>` → expect 0 matches
- `lodash` fully removed: `grep -rn "from \"lodash\"\|from 'lodash'" src/` → 0; `lodash` absent from `package.json` `dependencies`
- No `as any` on public surface: `grep -n "as any" src/types.ts src/useForge/ src/useForgeValues/` → 0 (or justified internal only)
- Clean types: `npx tsc --noEmit` exits 0
- Bundle builds: `npx rollup -c` exits 0
- devtools dev-only: `@hookform/devtools` appears under `devDependencies` + `peerDependenciesMeta.*.optional`, NOT under `dependencies`

---

## Wave 0 Requirements

*No test framework is installed this phase by design (Phase 3 introduces the runner).*
Existing infrastructure (`tsc`, `rollup`) covers all phase verification. No Wave 0 test scaffolding required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Native `<form>` submit still fires | STAB-05 (RISK-04) | Child-walker carries Phase-1 fix; no automated test until Phase 3 | Render a `<Forge>` with a submit button; submitting via click and via Enter both call `handleSubmit` |
| Enter-to-submit still works | STAB-05 (RISK-04) | Same child-walker, no test net | Focus a text field, press Enter — form submits |
| Wizard last-step submit | STAB-05 (RISK-04) | Wizard nav wiring lives in the retyped walker | Advance wizard to last step; submit button triggers `handleWizardSubmit` |
| `useFieldArray` append/remove/insert/swap/update | STAB-01 | Decorate-on-top rewrite; behavior not type-checkable | Mutate a field array via each op; confirm `fields` updates, per-item input attributes persist, validation-after-mutation fires |
| `usePersist` fires on value/state change | STAB-02 | `useWatch`+`useFormState` rewrite (D-12) | Type into a field; confirm handler receives values + `isDirty`/`isValid` |
| `getValue` throws on unknown field | STAB-02 (RISK-01) | Error-path behavior | Call `getValue("does-not-exist")` → Forge-named throw; `getValue` on a real empty field returns its value, not a throw |
| devtools throws Forge-named error when `debug` on + package absent | STAB-04 (RISK-03) | Missing-package runtime path | Uninstall `@hookform/devtools`, render with `debug={true}` → synchronous Forge-named throw instructing `npm i -D @hookform/devtools` |
| Consumer bundle has zero devtools trace when `debug` off | STAB-04 | Requires inspecting a consumer dep graph | Build a consumer that never passes `debug`; confirm `@hookform/devtools` absent from its graph |

---

## Validation Sign-Off

- [ ] Every task has a `tsc`/`rollup`/static `<automated>` verify OR an entry in Manual-Only above
- [ ] Sampling continuity: no 3 consecutive tasks without an automated (static) verify
- [ ] All RISK-04 Phase-1 runtime fixes are listed as mandatory Manual-Only checks
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
