---
phase: 3
slug: testing
status: draft
nyquist_compliant: false
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
| **Quick run command** | `npm test` (`vitest run`) |
| **Full suite command** | `npm test -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green AND coverage threshold met
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

> Filled in by the planner against the final PLAN.md task IDs. Each test-writing task is self-verifying (the test it adds is the verification); the coverage-threshold task is verified by a non-zero exit on under-threshold runs.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TEST-02/03/04 | — | N/A | integration/unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `@vitest/coverage-v8` added to devDependencies (confirmed MISSING by research — required for TEST-04 coverage gate)

*Otherwise: existing Vitest + @testing-library harness (Phase 2) covers all phase requirements; this phase extends it.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `yarn test` invocation parity | TEST-04 | ROADMAP wording says `yarn test`; repo is npm-based | Confirm `npm test` and `yarn test` both run the same `test` script; no `yarn.lock` added |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (@vitest/coverage-v8)
- [ ] No watch-mode flags (use `vitest run`, not `vitest`/`test:watch`)
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
