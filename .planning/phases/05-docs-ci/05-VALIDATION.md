---
phase: 05
slug: docs-ci
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.7 |
| **Config file** | `vitest.config.ts` (exists — coverage thresholds set in Phase 3) |
| **Quick run command** | `npm run lint && npm run typecheck` |
| **Full suite command** | `npm run lint && npm test` |
| **Estimated runtime** | ~30–60 seconds (lint + vitest run + coverage) |

> Phase 5 is documentation + CI tooling. Most deliverables are static files (README, API.md, MIGRATION.md, CHANGELOG.md) or config (`eslint.config.mjs`, `.prettierrc`, workflow YAML). These are not unit-testable with Vitest — they are validated by lint/typecheck enforcement, CI execution, and targeted grep assertions rather than new spec files.

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run typecheck` (verify lint config does not break TS, no regressions)
- **After every plan wave:** Run `npm test` (ensure lint/devDep additions didn't break coverage gates)
- **Before `/gsd-verify-work`:** `npm run lint && npm test` both green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | CICD-01 | — | `npm run lint` exits non-zero on violations | cli | `npm run lint` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | DOCS-01 | — | README quickstart compiles against current API | cli | `npm run typecheck` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 1 | DOCS-03 | — | "Swifter"/placeholder/`__tests__/` refs absent repo-wide | grep | `grep -rn "Swifter\|__tests__/" . --include="*.md"` (expect 0) | ✅ | ⬜ pending |
| 05-04-01 | 04 | 2 | CICD-02, CICD-03 | — | `ci.yml` runs on push/PR; `publish.yml` release-triggered + SHA-pinned + provenance | review | YAML structural assertions (see plan acceptance criteria) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · plan/task IDs are indicative — final IDs set by planner.*

---

## Wave 0 Requirements

- [ ] `eslint.config.mjs` — must exist before `npm run lint` works (CICD-01)
- [ ] `.prettierrc` + `.prettierignore` — must exist before `prettier --check` is meaningful (CICD-01)
- [ ] `package.json` `lint` / `lint:fix` scripts — must be added before lint step works (CICD-01)
- [ ] ESLint/Prettier devDeps installed (`typescript-eslint`, `eslint`, `eslint-plugin-react-hooks`, `eslint-config-prettier`, `prettier`) (CICD-01)
- [ ] `commit-and-tag-version` devDep + `changelog` script — must exist before CHANGELOG generation (DOCS-03)

*These are config/tooling installs, not test stubs — they gate the `npm run lint` / changelog commands that downstream tasks assert against.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API.md covers every exported symbol from `src/index.ts` | DOCS-02 | No automated doc-coverage checker in scope | Cross-check `docs/API.md` tables against `src/index.ts` export list; every public symbol has a table |
| README quickstart (web + RN) produces a working validated form on a fresh project | DOCS-01 | End-to-end runnable-on-fresh-project check needs a human | Follow README install + quickstart for both web and RN variants against current `useForge`/`Forge`/`Forger` API |
| `ci.yml` status check visible in a PR; `publish.yml` fires only on release | CICD-02, CICD-03 | Requires a real PR / release event on GitHub | Open a PR (observe CI status check); inspect publish workflow trigger config |
| `LICENSE` copyright/wording correct for the public package | DOCS-03 | Judgment call on legal text | Review `LICENSE` MIT text + copyright holder |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (lint config + scripts + devDeps)
- [ ] No watch-mode flags (CI uses `vitest run`, not `vitest`)
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
