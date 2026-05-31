---
phase: 6
slug: publish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Phase 6 is an **operate-the-pipeline** phase. There is no new application code to unit-test.
Validation is the existing test suite staying green plus a real-world publish-pipeline smoke
test against the **live** npm registry.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.7 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` (runs with `--coverage` per `package.json` script) |
| **Estimated runtime** | ~30 seconds (re-run once on Windows cold-run flakiness before trusting) |

---

## Sampling Rate

- **After every task commit:** Run `npm test` (confirms existing suite still green — no regression from version/CHANGELOG edits)
- **After every plan wave:** Run `npm test`
- **Phase gate:** `publish.yml` CI run green (lint + test + publish all exit 0) AND post-publish smoke test exits 0
- **Max feedback latency:** ~30 seconds for unit suite; CI run latency for the publish gate

---

## Per-Task Verification Map

| Task | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| Readiness gate (scope/token/dry-run) | 1 | PUB-01 / D-06 | npm token is automation-type; scope owned; no secret leakage | manual + CLI | `npm publish --dry-run` | ✅ | ⬜ pending |
| Version bump + CHANGELOG heading + tag | 1 | PUB-01 / D-03,D-04 | tag matches package.json version | unit + CLI | `npm test` + `npx commit-and-tag-version --release-as 1.0.0 --skip.changelog` | ✅ | ⬜ pending |
| PR-then-merge bump to main | 2 | PUB-01 / D-05 | release commit on protected main via PR | manual | `gh pr merge` | ✅ | ⬜ pending |
| Create GitHub Release → CI publish | 2 | PUB-01 / D-02 | provenance attestation generated in CI | manual + CI | `gh release create v1.0.0 --target main` then watch `publish.yml` | ✅ | ⬜ pending |
| Post-publish smoke (SC1) | 3 | PUB-01 | install from live registry succeeds | smoke | `npm install @adexdsamson/forge` in `c:\Temp\forge-smoke-test` | ❌ W0 | ⬜ pending |
| Post-publish smoke (SC2) | 3 | PUB-01 | 6 exports import + type-check, zero errors | smoke | `npx tsc --noEmit` in smoke dir | ❌ W0 | ⬜ pending |
| Version triple-match (SC3) | 3 | PUB-01 | npm version == package.json == git tag on main | manual + CLI | `npm view @adexdsamson/forge version` + `git tag -l v1.0.0` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `c:\Temp\forge-smoke-test\smoke.ts` — update to import all 6 exports (`useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist`); currently imports only 3
- [ ] `c:\Temp\forge-smoke-test\package.json` — point `@adexdsamson/forge` at the **live registry** (remove the `file:` tarball reference) so the smoke proves SC1 against the real published artifact

*Existing Vitest infrastructure covers regression checks; the only Wave 0 work is preparing the live-registry smoke scaffold.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| npm `NPM_ACCESS_TOKEN` is automation-type + non-expired | PUB-01 / D-06 | Token type/expiry is only visible to the account owner at npmjs.com | Account owner inspects token settings at npmjs.com → Access Tokens; confirm type = Automation/Granular and not expired |
| `@adexdsamson` scope ownership | PUB-01 / D-06 | Account-level; not derivable in CI | `npm access list packages @adexdsamson` (or owner confirms `adexdsamson - owner`) |
| PR merge to `main` | PUB-01 / D-05 | Human approval of release commit | Merge the release PR via GitHub UI / `gh pr merge` |
| Create GitHub Release | PUB-01 / D-02 | Human pulls the trigger on an irreversible publish | `gh release create v1.0.0 --target main`; this is the point of no return |
| Published version triple-match | PUB-01 / SC3 | Requires the live registry to have the published version | After CI green: `npm view @adexdsamson/forge version` equals `package.json` version equals `git tag -l` on main |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies, or are explicitly manual-only (publish is human-gated by design)
- [ ] Sampling continuity: `npm test` runs after each task that touches the repo
- [ ] Wave 0 covers the smoke-scaffold gaps (6-export `smoke.ts`, live-registry `package.json`)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for unit suite
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
