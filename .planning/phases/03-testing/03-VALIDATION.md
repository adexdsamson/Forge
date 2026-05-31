---
phase: 3
slug: testing
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-31
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + jsdom + @testing-library/react (foundation laid in Phase 2) |
| **Config file** | `vitest.config.ts` (coverage block added this phase) |
| **Quick run command** | `npx vitest run` (no coverage — fast) |
| **Full suite command** | `npm test` = `vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm test` (with --coverage)
- **Before `/gsd-verify-work`:** Full suite must be green AND coverage threshold met (non-zero thresholds from Plan 04)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 03-01 | 1 | TEST-01, TEST-04 | T-03-01-01 | @vitest/coverage-v8 installed; scripts.test = vitest run --coverage | config | `node -e "const p=require('./package.json'); process.exit(p.devDependencies['@vitest/coverage-v8']&&p.scripts.test==='vitest run --coverage'?0:1)"` | package.json | ⬜ pending |
| 03-01-T2 | 03-01 | 1 | TEST-01, TEST-04 | T-03-01-01 | vitest.config.ts has coverage block with provider=v8 and placeholder thresholds=0 | config | `npx vitest run --reporter=verbose 2>&1 | head -20` | vitest.config.ts | ⬜ pending |
| 03-02-T1 | 03-02 | 1 | TEST-02, TEST-03 | T-03-02-01 | CORR-02 throws Forger-named error; validateField web rules return errors | integration + unit | `npx vitest run src/Forge/Forge.errors.test.tsx src/validateField.test.ts --reporter=verbose` | src/Forge/Forge.errors.test.tsx, src/validateField.test.ts | ⬜ pending |
| 03-02-T2 | 03-02 | 1 | TEST-03 | T-03-02-01 | useFieldArray append/remove; usePersist handler fires; useForgeValues getValue/throws | integration | `npx vitest run src/useFieldArray/useFieldArray.test.tsx src/usePersist/usePersist.test.tsx src/useForgeValues/useForgeValues.test.tsx --reporter=verbose` | all three test files | ⬜ pending |
| 03-03-T1 | 03-03 | 2 | TEST-03 | T-03-03-01 | Forger injects onChangeText/onValueChange under RN mock | integration + mock | `npx vitest run src/Forger/Forger.rn.test.tsx --reporter=verbose` | src/Forger/Forger.rn.test.tsx | ⬜ pending |
| 03-03-T2 | 03-03 | 2 | TEST-03 | T-03-03-02 | validateField calls setNativeProps under RN mock with shouldUseNativeValidation=true | unit + mock | `npx vitest run src/validateField.rn.test.ts --reporter=verbose` | src/validateField.rn.test.ts | ⬜ pending |
| 03-04-T1 | 03-04 | 3 | TEST-04 | T-03-04-01 | npm test exits 0 with measured thresholds; exits 1 with threshold at 99 | coverage gate | `npm test 2>&1 | tail -20` | vitest.config.ts (updated) | ⬜ pending |
| 03-04-CP | 03-04 | 3 | TEST-04 | T-03-04-01 | Human confirms full suite passes + threshold enforcement works | human-verify | Manual: npm test, then set lines=99 and confirm exit 1 | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `@vitest/coverage-v8` added to devDependencies (confirmed MISSING by research — required for TEST-04 coverage gate) — handled in Plan 03-01 Task 1

*Otherwise: existing Vitest + @testing-library harness (Phase 2) covers all phase requirements; this phase extends it.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `yarn test` invocation parity | TEST-04 | ROADMAP wording says `yarn test`; repo is npm-based | Confirm `npm test` and `yarn test` both run the same `test` script; no `yarn.lock` added |
| Coverage threshold enforcement | TEST-04 | Requires observing exit code and terminal output | Set thresholds.lines to 99, run npm test, confirm exit 1 + error message, restore |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (@vitest/coverage-v8)
- [x] No watch-mode flags (use `npx vitest run`, not `vitest`/`test:watch`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
