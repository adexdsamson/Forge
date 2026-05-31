# Phase 6: Publish - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship `@adexdsamson/forge` to **public npm** so it is installable by consumers, finalize the release version + CHANGELOG + git tag, and prove the published artifact works. Requirement: **PUB-01**.

**In scope:** picking the first-publish version, finalizing the CHANGELOG `[Unreleased]` section, producing the version-bump commit + git tag, landing that tag on `main`, triggering the existing release-gated CI publish, and verifying the live package installs and type-checks in a fresh project.

**Out of scope:** registry choice (settled to public npm in Phase 4 — D-01/D-02), CI pipeline structure (built + hardened in Phase 5 — release trigger, SHA-pins, lint/test gate, provenance), packaging metadata/entry points (Phase 4), docs content (Phase 5). No new API or features. This phase **operates** the pipeline that prior phases built; it does not rebuild it.

</domain>

<decisions>
## Implementation Decisions

### Release version (PUB-01)
- **D-01:** First public release is **`1.0.0`**. Reset the leftover extraction value `1.0.3` (which falsely implies a prior public 1.0.0–1.0.2 history that never existed). `1.0.0` signals a semver stability promise — defensible because the `useForge` / `<Forge>` / `<Forger>` surface is the long-proven orbipayx production API, now correctness-fixed (Phase 1), de-internalized (Phase 2), and tested (Phase 3). Known caveats (conservative coverage thresholds ~57% lines / ~39% branches, ~46 remaining `as any` casts) are quality-debt items tracked for a future pass, not API-instability signals.

### Publish mechanism (PUB-01)
- **D-02:** Publish via the **CI release flow**, not a local `npm publish`. The intended steady-state path: land the version bump + tag on `main`, create a **GitHub Release**, which fires `publish.yml` → re-runs lint + test → publishes with provenance. **Required** because npm provenance attestation (Phase 5 D-10) is generated only inside CI via the `id-token: write` OIDC token; a local publish cannot produce the "verified" badge.

### Version bump + tag + CHANGELOG finalization (PUB-01)
- **D-03:** Use **`standard-version`** to bump `package.json` to `1.0.0`, rename the CHANGELOG `[Unreleased]` heading to `## [1.0.0] - <date>`, commit, and create the git tag in one step. Coheres with the conventional-changelog tooling already wired in Phase 5 (D-15/D-16). The CHANGELOG `[Unreleased]` content is already curated (verified during scout) — standard-version finalizes the heading, it does not regenerate the body.
- **D-04:** **Tag format follows whatever `standard-version` emits by default** (conventionally `v1.0.0`). Success criterion 3 requires the version tag to match `package.json` version and exist on `main` — confirm the tag points at the merged release commit on `main`.

### How the bump commit + tag reach `main` (PUB-01)
- **D-05:** **PR-then-tag.** Open a release PR for the `standard-version` bump commit, merge it to `main`, then create the tag / GitHub Release on the merged commit. Assumes `main` has branch protection requiring PRs (do not push the bump directly to `main`). The tag must land on `main` to satisfy success criterion 3.

### Pre-publish readiness gate (PUB-01)
- **D-06:** npm auth is **not confirmed ready** — the plan MUST include an explicit pre-publish readiness check **before** cutting the release:
  1. Confirm the npm account **owns the `@adexdsamson` scope**.
  2. Confirm `NPM_ACCESS_TOKEN` is an **automation/granular token** that bypasses 2FA (a non-automation token will fail an unattended CI publish if 2FA-on-publish is enforced).
  3. Run a **`npm publish --dry-run`** as a final sanity check before the real release.
  Treat token/scope/2FA as must-confirm-before-publish; the release flow assumes nothing here works until verified.

### Verification — done-proof (PUB-01 success criteria 1, 2, 3)
- **D-07:** **Full post-publish smoke test.** After the CI publish succeeds:
  1. Fresh throwaway project → `npm install @adexdsamson/forge` **from the live registry** (proves SC1).
  2. `import { useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist } from "@adexdsamson/forge"` → run `tsc` → zero type errors (proves SC2).
  3. Confirm the published version on npmjs.org === `package.json` version === git tag on `main` (proves SC3).
  This re-installs from the actually-published artifact rather than relying on the Phase 4 tarball smoke — the user explicitly wanted proof against the live registry.

### Claude's Discretion
- Exact GitHub Release body wording (derive a short summary from the finalized CHANGELOG `1.0.0` section).
- Whether to keep `workflow_dispatch` as a manual fallback trigger on `publish.yml` (carried from Phase 5 D-08).
- Exact throwaway-project location/scaffold for the post-publish smoke (e.g., the existing `c:\Temp\forge-smoke-test` working dir).
- Precise `standard-version` invocation flags (e.g., `--release-as 1.0.0` to force the version rather than letting commit-type inference choose).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external ADRs/specs exist — all decisions are captured above. The references below are the project files to read and/or modify.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — PUB-01 definition.
- `.planning/ROADMAP.md` §"Phase 6: Publish" — goal + the 3 success criteria (the acceptance bar).
- `.planning/PROJECT.md` §Key Decisions — D-01 public npm registry (carry-forward); §Out of Scope.

### Carry-forward decisions this phase operates on
- `.planning/phases/04-packaging/04-CONTEXT.md` — registry settled to public npm (D-01/D-02), publish-from-root + `prepack` rebuild (D-04/D-05), version/tag explicitly deferred to Phase 6.
- `.planning/phases/05-docs-ci/05-CONTEXT.md` — `publish.yml` release-trigger + SHA-pins + lint/test gate + provenance/`id-token: write` (D-08/D-09/D-10/D-11), CHANGELOG `[Unreleased]` deferred to Phase 6 (D-16), conventional-changelog tooling (D-15).

### Files to modify
- `package.json` — `version` `1.0.3` → `1.0.0` (via `standard-version`).
- `CHANGELOG.md` — `[Unreleased]` heading → `[1.0.0] - <date>` (body already curated). Top currently: `## [Unreleased]` with Features entries.

### Files to read (do not modify in this phase)
- `.github/workflows/publish.yml` — release-triggered + `workflow_dispatch`, `id-token: write`, `npm publish --provenance --access public`. This is the publish executor — confirm it is correct, do not restructure it.
- `package.json` `publishConfig` / `prepack` / `files` — the publish behavior the release relies on.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`publish.yml`** is complete and hardened (Phase 5) — release trigger, SHA-pinned actions, lint+test gate, provenance, `--access public`, auth via `NODE_AUTH_TOKEN`/`NPM_ACCESS_TOKEN`. Phase 6 *operates* it; no edits expected.
- **`prepack`** (Phase 4) rebuilds `dist/` from source on publish — the release needs no separate build step.
- **CHANGELOG `[Unreleased]`** is already curated with meaningful OSS-readiness entries (not a raw commit dump) — only the heading needs finalizing.
- **conventional-changelog tooling** (Phase 5 D-15) is wired — `standard-version` (D-03) builds on it.
- **`c:\Temp\forge-smoke-test`** is an existing additional working directory usable for the post-publish fresh-install smoke (D-07).

### Established Patterns
- Project uses **npm** with a committed `package-lock.json`; CI uses `npm ci`.
- Conventional commits are the norm — `standard-version` fits.

### Integration Points
- **No git tags exist yet** (verified during scout) — Phase 6 creates the first one. `standard-version` + GitHub Release are the two ends that produce the tag and trigger the publish.
- `publishConfig.registry` (npmjs.org) + CI `registry-url` already agree (Phase 4 PKG-04) — no registry reconciliation needed.

</code_context>

<specifics>
## Specific Ideas

- Provenance is the hard constraint that forces the CI release path: a local `npm publish` would silently drop the verified attestation. Surface this if anyone proposes a manual publish "just to get it out."
- Verification must be **experiential against the live registry** — install the actually-published `@adexdsamson/forge` in a fresh project and `tsc` it. A dry-run listing or the Phase 4 tarball smoke is necessary-but-insufficient.
- The readiness gate (D-06) is the single most likely hard-blocker: an unattended CI publish fails if `NPM_ACCESS_TOKEN` is not an automation token or the scope isn't owned. Verify before cutting the release, not after it fails.

</specifics>

<deferred>
## Deferred Ideas

- **Quality-debt pass** — raising coverage thresholds and clearing the ~46 `as any` casts. Out of scope for shipping v1; a future code-quality milestone (already noted in Phase 5 deferred ideas).
- **Node/OS test matrix** — single Ubuntu + Node 20 for v1 (Phase 5 D-07); revisit if Windows vitest flakiness bites consumers.
- **Hosted documentation site** (TypeDoc → GitHub Pages) — explicitly out of scope for v1 per PROJECT.md.
- **Post-1.0 release automation** — e.g., automating version bumps from merged conventional commits. v1 uses the manual PR-then-tag + GitHub Release flow (D-02/D-05).

None of these block the publish.

</deferred>

---

*Phase: 6-Publish*
*Context gathered: 2026-06-01*
