# Plan 06-04 Summary — GitHub Release + CI Publish + Live Smoke

**Status:** Complete
**Requirement:** PUB-01
**Autonomous:** false (human-authorized the irreversible Release)
**Completed:** 2026-06-01

## Outcome

**`@adexdsamson/forge@1.0.0` is LIVE on public npm with provenance.** The package is installable and type-checks correctly in a fresh project. All three Phase-6 success criteria are proven against the live published artifact. PUB-01 satisfied.

- Package: https://www.npmjs.com/package/@adexdsamson/forge
- Release: https://github.com/adexdsamson/Forge/releases/tag/v1.0.0
- Provenance (Sigstore transparency log): https://search.sigstore.dev/?logIndex=1689698101

## Execution

| Task | Result |
|------|--------|
| 1. GitHub Release (irreversible trigger) | Human-authorized; `gh release create v1.0.0 --target main` → published (not draft), tag on main, fired `publish.yml` |
| 2. Monitor CI publish | `publish.yml` run `26739262196` → **conclusion=success** (npm ci → lint → test → `npm publish --provenance --access public`) |
| 3. Live-registry smoke | SC1 + SC2 + SC3 all green (below) |

## Success criteria — PROVEN against live artifact (D-07)

- **SC1 (install):** `npm install` in `c:\Temp\forge-smoke-test` → exit 0; `npm ls` shows `@adexdsamson/forge@1.0.0` (registry source, no `file:`).
- **SC2 (6-export tsc):** `npx tsc --noEmit` → exit 0, zero output, no TS2307. All six exports resolve: `useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist`.
- **SC3 (version triple-match):** `npm view @adexdsamson/forge version` = `1.0.0` = `package.json` version = git tag `v1.0.0`; `git branch --contains v1.0.0` includes `main`.
- **Provenance (D-02):** publish step logged "Signed provenance statement with source and build information from GitHub Actions" + transparency-log entry.

## Notes

- The publish ran on the merged main HEAD; the tag `v1.0.0` was created by `gh release create --target main` (not pushed from the release branch), anchoring it to main and avoiding any squash-merge SHA mismatch (research Q3).
- `npm view` returned 404 for ~45s after the CI publish (registry CDN propagation); resolved to `1.0.0` on retry — expected, not a failure.
- Token expiry reminder: `NPM_ACCESS_TOKEN` expires Jun 8, 2026 — rotate before the next release.

## PUB-01

Satisfied. The package is published, installable, and type-checks. Phase 6 goal achieved.
