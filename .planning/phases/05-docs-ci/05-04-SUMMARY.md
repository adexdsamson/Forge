---
phase: 05-docs-ci
plan: "04"
subsystem: infra
tags: [github-actions, ci-cd, npm-provenance, supply-chain-security, sha-pinning]

requires:
  - phase: 05-docs-ci plan 01
    provides: npm run lint and npm test scripts in package.json

provides:
  - ci.yml — push/PR triggered lint+test CI on every branch
  - publish.yml — release-triggered, SHA-pinned, lint/test-gated, provenance-attested npm publish

affects:
  - Any future CI/CD changes (both workflows serve as the canonical pattern)
  - npm package consumers (provenance attestation shows verified badge on npmjs.com)

tech-stack:
  added: []
  patterns:
    - "SHA-pinned GitHub Actions: both workflows use commit SHA refs, not mutable @v3/@v4 tag refs"
    - "Release-triggered publish: publish only on release:published event, not push to main"
    - "OIDC provenance: id-token:write permission + --provenance flag creates signed SLSA attestation"
    - "Lint+test gate before publish: CI steps must pass before npm publish runs"

key-files:
  created:
    - .github/workflows/ci.yml
  modified:
    - .github/workflows/publish.yml

key-decisions:
  - "D-06: ci.yml triggers on push to all branches (**) and pull_request to all branches; publish.yml is separate"
  - "D-07: Both workflows use ubuntu-latest runner and Node 20; no matrix"
  - "D-08: publish.yml trigger is release:types:[published]; workflow_dispatch retained as emergency/recovery fallback with comment; lint+test gate before publish"
  - "D-09: Both workflows SHA-pin checkout@11bd71901 (v4.2.2) and setup-node@49933ea5 (v4.4.0)"
  - "D-10: publish.yml has permissions id-token:write + contents:read; publishes with --provenance --access public via NODE_AUTH_TOKEN from secrets.NPM_ACCESS_TOKEN"
  - "D-11: publish.yml publishes from repo root (no working-directory:dist); prepack script handles build"

patterns-established:
  - "SHA-pin pattern: use commit SHA + version comment (# v4.2.2) — never mutable tag refs"
  - "Gate pattern: lint step then test step then publish step — order is enforced by YAML sequence"

requirements-completed:
  - CICD-02
  - CICD-03

duration: 8min
completed: 2026-05-31
---

# Phase 05 Plan 04: CI/CD Workflows Summary

**Release-gated npm publish with SLSA provenance attestation (release:published trigger, SHA-pinned actions, lint+test gates) and a separate push/PR CI workflow for continuous lint+test feedback**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-31T18:17:29Z
- **Completed:** 2026-05-31T18:25:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created .github/workflows/ci.yml — triggers on push/PR to all branches, runs npm run lint + npm test with SHA-pinned actions (D-06, D-07, D-09, CICD-02)
- Hardened .github/workflows/publish.yml with 7 targeted changes: release trigger (D-08), workflow_dispatch fallback, id-token:write permissions (D-10), SHA-pinned actions (D-09), lint+test gates before publish (D-08), and --provenance flag for SLSA attestation (D-10, CICD-03)
- Eliminated all supply-chain risks: no mutable @v3/@v4 tag refs anywhere in .github/workflows/; all actions pinned to verified commit SHAs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .github/workflows/ci.yml** - `e904e52` (feat)
2. **Task 2: Harden .github/workflows/publish.yml** - `2df70f3` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `.github/workflows/ci.yml` — New CI workflow: push/PR trigger on all branches, SHA-pinned actions, npm ci + lint + test; no publish step
- `.github/workflows/publish.yml` — Hardened from push:main to release:published trigger; added id-token:write permissions, SHA-pinned actions, lint+test gates, --provenance flag

## Decisions Made

All decisions follow the plan's D-NN decisions:

- D-08: Release trigger prevents accidental publish on every merge to main; workflow_dispatch retained with YAML comment marking it as emergency-only
- D-09: SHA pins (11bd71901 for checkout v4.2.2, 49933ea5 for setup-node v4.4.0) eliminate mutable-tag supply-chain attack vector (T-05-04-01)
- D-10: OIDC provenance (id-token:write + --provenance) links the published artifact to the exact GitHub Actions run and commit SHA — generates npmjs.com "verified" badge
- D-11: Publish runs from repo root; prepack script invokes rollup build automatically before pack/publish

## Deviations from Plan

None - plan executed exactly as written. Both workflow files match the RESEARCH.md Pattern 4/5 target structures with all 7 documented changes applied to publish.yml.

## Issues Encountered

None. Both workflow verification scripts (node -e inline assertions) passed on first run.

## Threat Surface Scan

Both files are GitHub Actions workflows — they introduce no new network endpoints, auth paths, or schema changes. The threat model in the plan covers all STRIDE threats for this surface; mitigations are implemented as designed:

- T-05-04-01: SHA-pinned actions (both workflows)
- T-05-04-02: release:published trigger (not push:main)
- T-05-04-03: lint+test gate before publish step
- T-05-04-04: NODE_AUTH_TOKEN scoped to publish step env only; contents:read job permission
- T-05-04-05: --provenance flag + id-token:write generates SLSA attestation
- T-05-04-06: workflow_dispatch accepted; lint+test gate still enforced
- T-05-04-07: Fork PRs accepted; GitHub prevents secrets from leaking to fork workflows

## User Setup Required

**secrets.NPM_ACCESS_TOKEN** must be configured in the GitHub repository settings (Settings > Secrets and variables > Actions) before the publish workflow can authenticate to npmjs.org. The secret must be a publish-scoped npm access token for @adexdsamson/forge.

## Next Phase Readiness

- Phase 05 is now complete (all 4 plans done)
- The @adexdsamson/forge package is fully documented (README, CHANGELOG, MIGRATION) and has a complete CI/CD pipeline
- To publish a release: create a GitHub Release on the repository — the publish.yml workflow will trigger, run lint+test, and publish to npmjs.org with provenance

---
*Phase: 05-docs-ci*
*Completed: 2026-05-31*
