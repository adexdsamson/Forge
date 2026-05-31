# Phase 5: Docs & CI - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Forge's documentation accurate and complete, correct the housekeeping files, configure lint/format tooling, and stand up CI that guards every PR and automates publish on release. Requirements: **DOCS-01, DOCS-02, DOCS-03, CICD-01, CICD-02, CICD-03**.

**In scope:**
- Full README rewrite as an OSS landing page (accurate install + quickstart + web & RN examples using the real `useForge` + `<Forge control={...}>` + `<Forger>` API).
- A separate `docs/API.md` with prop/return reference tables for `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and the platform-detection utilities.
- Correct housekeeping files: repurpose `MIGRATION.md`, verify `LICENSE`, add `CHANGELOG.md`; remove the "Swifter project" blurb, placeholder install text, and the dead `__tests__/` reference.
- Refresh `examples/ReactNativeExample.md` to the current API.
- ESLint (flat config) + Prettier tooling with a `lint` script.
- Split CI: `ci.yml` (lint+test on every push/PR) and a hardened `publish.yml` (release-triggered, SHA-pinned, lint+test-gated, provenance).

**Out of scope:**
- **Choosing/bumping the release version** and creating the matching git tag — belongs to **Phase 6 (Publish)**. CHANGELOG initial entry stays under `[Unreleased]`.
- The **actual publish** — Phase 6.
- A **hosted documentation site** (TypeDoc → GitHub Pages) — explicitly out of scope for v1 per PROJECT.md; README + `docs/API.md` suffice.
- New form features / API-surface changes — this milestone is fix+harden+ship what exists.

</domain>

<decisions>
## Implementation Decisions

### Documentation structure (DOCS-01, DOCS-02)
- **D-01:** **API reference lives in a separate `docs/API.md`**, linked prominently from the README — not inline. Keeps the README scannable while the API tables can be exhaustive. The tables MUST cover `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and the platform-detection utilities (`isWeb`/`isReactNative`/`isMobile`, `getEventHandlerName`, `getComponentType`, etc.).
- **D-02:** **Full README rewrite** (not a targeted patch). The existing README has the right section coverage but is structurally stale (placeholder install, `'./lib/forge'` imports, raw `<input>` instead of `<Forger>`, Swifter blurb). Rewrite as a conventional OSS landing page: hero description → badges → install → quickstart → key concepts → links to `docs/API.md` and `examples/`.
- **D-03:** README opens with **standard status badges**: npm version, CI status, license.
- **D-04:** The **canonical quickstart is a realistic, signup-style form** exercising **text + select + checkbox** field types (not text-only, not kitchen-sink). It must show `useForge` → `<Forge control={...}>` → `<Forger>` wrapping a custom component, with validation and a real submit. Provide **both a web and a React Native** variant (DOCS-01 success criterion 1 requires both to be runnable against the current API).
- **D-05:** **Keep the `examples/` directory** as the home for longer runnable examples. Refresh `examples/ReactNativeExample.md` to the current API + correct imports (`@adexdsamson/forge`), and link to it from the README. Do not fold it into README/API.md.

### CI & publish pipeline (CICD-02, CICD-03)
- **D-06:** **Split into two workflows.** `ci.yml` runs lint + test on every push and pull request (the status check that must be visible in the PR — CICD-02). `publish.yml` is the release-triggered automated publish (CICD-03).
- **D-07:** **Single CI environment: `ubuntu-latest` + Node 20** (matches the existing workflow and the CLAUDE.md-pinned version). No Node/OS matrix for v1 — this is a logic-only library; matrix coverage is a deferred idea.
- **D-08:** **`publish.yml` triggers on GitHub `release` events** (replacing the current push-to-main trigger, which auto-publishes on every merge — wrong and dangerous). It re-runs lint + test and **publishes only after they pass** (CICD-03). Keep `workflow_dispatch` as a manual fallback at the planner's discretion.
- **D-09:** **Pin all GitHub Actions to a commit SHA** (CICD-03), not version tags. Currently `actions/checkout@v3` and `actions/setup-node@v3` are tag-pinned and must be SHA-pinned.
- **D-10:** **Publish with npm provenance** (`npm publish --provenance --access public`), which requires `permissions: { id-token: write }` on the publish job. Auth still uses `NODE_AUTH_TOKEN` from `secrets.NPM_ACCESS_TOKEN`, registry `https://registry.npmjs.org` (carry-forward D-01 from Phase 4). Provenance generates a signed source→artifact attestation and the "verified" badge on npmjs.
- **D-11:** Publish model carries forward from Phase 4: **publish from repo root** (not `dist/`), `prepack` rebuilds `dist/` from source. Coverage thresholds in `vitest.config.ts` already gate `npm test`, so the test step gates both `ci.yml` and `publish.yml` automatically.

### Lint policy (CICD-01)
- **D-12:** **ESLint flat config** (`eslint.config.js`, ESLint 9) using **typescript-eslint `recommended`** (not `strict-type-checked`) plus react-hooks rules. Rationale: the codebase carries ~46 `as any` casts (strict mode effectively bypassed); `strict-type-checked` would surface a large backlog out of scope for a docs/CI phase. `recommended` gives a useful baseline without a cleanup detour.
- **D-13:** **Prettier runs separately** (its own formatter) with **`eslint-config-prettier`** to disable ESLint's stylistic rules so the two don't conflict — not `eslint-plugin-prettier`.
- **D-14:** **`lint` is check-only**: `lint` = `eslint src/` + `prettier --check src/` (read-only, non-zero exit on violations — satisfies the DOCS/CICD success criterion that `lint` runs ESLint + Prettier across `src/` and exits non-zero on violations). Add a separate **`lint:fix`** for local auto-fixing. **CI runs check-only and fails the PR** on violations — it does NOT auto-fix or push commits. (Script is invokable as `npm run lint` / `yarn lint`; the success-criteria "yarn lint" phrasing is generic — the project uses npm with a committed `package-lock.json`.)

### CHANGELOG & MIGRATION (DOCS-03)
- **D-15:** **CHANGELOG via conventional-changelog** (auto-generated from conventional-commit history; aligns with the PROJECT.md "semver via conventional commits" constraint). Wire the tool + config.
- **D-16:** The **initial entry sits under `## [Unreleased]`** — Phase 6 renames it to the chosen version + date at publish time. Avoids pre-committing a version number that Phase 6 owns. **Wrinkle for the planner:** with no prior release tags, conventional-changelog will sweep *all* extraction-era commits into the first generated section — the initial `[Unreleased]` content will need curation down to a meaningful summary of the OSS-readiness work, not a raw commit dump.
- **D-17:** **Repurpose `MIGRATION.md`** as "**migrating from raw react-hook-form to Forge**" — the relevant journey for new public users. This replaces the current orbipayx-era "adding React Native support to (the internal) Forge" framing. As part of this rewrite the dead `__tests__/ReactNativeForm.test.tsx` reference (MIGRATION.md:346) is removed.

### Claude's Discretion
- Exact README section ordering/wording, badge providers (shields.io etc.), and prose tone.
- Exact prop-table columns/format in `docs/API.md`.
- Specific ESLint plugin set beyond typescript-eslint + react-hooks (e.g., whether to add `eslint-plugin-react`).
- Whether `publish.yml` keeps `workflow_dispatch` as a manual fallback (D-08).
- Specific conventional-changelog flavor/preset (`conventional-changelog-cli` vs `standard-version` vs `changesets`) — pick the lightest that satisfies D-15/D-16; verify it doesn't pull in heavy/abandoned deps.
- Verify `LICENSE` (MIT, shipped Phase 4) copyright/wording is correct for the public package; refine if needed (DOCS-03 names LICENSE).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external ADRs/specs exist for this phase — decisions are fully captured in `<decisions>` above. The references below are the project files to read and/or modify.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — DOCS-01/02/03, CICD-01/02/03 definitions.
- `.planning/ROADMAP.md` §"Phase 5: Docs & CI" — goal + the 5 success criteria (the acceptance bar).
- `.planning/PROJECT.md` §Key Decisions — carry-forward D-01 (public npm registry); §Out of Scope (no hosted docs site).
- `.planning/phases/04-packaging/04-CONTEXT.md` — Phase 4 packaging decisions (publish-from-root D-04, `prepack` D-05, registry D-01/D-02) that the publish workflow depends on.

### Docs to write/correct (DOCS-01/02/03)
- `README.md` — full rewrite (D-02/D-03/D-04); currently: placeholder install (~L15-20), `'./lib/forge'` imports, raw `<input>` examples, "part of the Swifter project" blurb (L363).
- `docs/API.md` (new) — API reference tables (D-01).
- `MIGRATION.md` — repurpose for react-hook-form→Forge (D-17); remove dead `__tests__/` ref (L346).
- `CHANGELOG.md` (new) — conventional-changelog, `[Unreleased]` initial entry (D-15/D-16).
- `LICENSE` — MIT, shipped Phase 4; verify wording (DOCS-03).
- `examples/ReactNativeExample.md` — refresh to current API (D-05).

### API source-of-truth for the reference tables (read, do not modify)
- `src/types.ts` — `UseForgeProps`, `UseForgeResult`, `ForgeControl`, `ForgeProps`, `ForgerProps`, `FieldProps`, transform types, RN/cross-platform prop types.
- `src/useForge/useForge.tsx` — `useForge` signature + augmented control.
- `src/Forge/Forge.tsx` — `<Forge>` props (incl. wizard, `fieldProps`, `onSubmit`).
- `src/Forger/Forger.tsx` — `<Forger>` props, `transform.input/output`, platform event wiring.
- `src/useFieldArray/useFieldArray.tsx`, `src/useForgeValues/useForgeValues.tsx`, `src/usePersist/usePersist.tsx`, `src/useSubscribe.ts` — hook signatures.
- `src/validateField.ts` — `validateField` signature + supported rules.
- `src/reactNative.ts`, `src/utils.ts` — exported platform-detection utilities (`isWeb`/`isReactNative`/`isMobile`, `getEventHandlerName`, `getComponentType`, `mergePlatformProps`, `REACT_NATIVE_COMPONENTS`, etc.).
- `src/index.ts` — the authoritative public export list (don't document non-exported symbols).
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md` — component responsibilities + stack facts to keep docs accurate.

### CI to write/modify (CICD-01/02/03)
- `.github/workflows/ci.yml` (new) — lint + test on push/PR, Ubuntu + Node 20 (D-06/D-07).
- `.github/workflows/publish.yml` — rework: release trigger (D-08), SHA-pin actions (D-09), provenance + `id-token: write` (D-10). Current state: push-to-main trigger, `checkout@v3`/`setup-node@v3` tag-pinned, `npm ci` + `npm publish --access public`.
- `package.json` — add `lint`/`lint:fix` scripts + ESLint/Prettier/conventional-changelog devDeps; uses npm (`package-lock.json` committed).
- `eslint.config.js`, `.prettierrc`, `.prettierignore` (new) — lint/format config (D-12/D-13/D-14).
- `vitest.config.ts` — read-only; its coverage thresholds already gate `npm test` (D-11).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`publish.yml`** already has the right bones (Node 20, `registry-url: registry.npmjs.org`, `npm ci`, `NODE_AUTH_TOKEN` from `NPM_ACCESS_TOKEN`) — Phase 5 hardens it (trigger, SHA-pin, gating, provenance), it does not start from scratch.
- **`examples/ReactNativeExample.md`** is an existing RN example to refresh rather than author fresh (D-05).
- **`package.json` scripts** already include `build`/`prepack`/`typecheck`/`test` — add `lint`/`lint:fix` alongside.
- **`vitest.config.ts` coverage thresholds** (set in Phase 3) already fail `npm test` on shortfall — the CI test step inherits this gate for free.

### Established Patterns
- Project uses **npm** (committed `package-lock.json`, CI uses `npm ci`) despite success-criteria text saying "yarn" — scripts run under both; treat "yarn lint"/"yarn test" as generic.
- **Public RHF API + cross-platform via runtime detection** — docs must show the web AND RN paths using the same `useForge`/`Forge`/`Forger` surface (no hard `react-native` import).
- Conventional commits are already the project norm — conventional-changelog (D-15) fits.

### Integration Points
- `package.json` `version` is `1.0.3` (extraction leftover) — CHANGELOG `[Unreleased]` (D-16) deliberately avoids touching it; Phase 6 owns version + tag.
- `prepack` (Phase 4) is the build seam the release publish relies on — `publish.yml` does not need a separate build step.
- The `src/index.ts` export list bounds what `docs/API.md` documents.

</code_context>

<specifics>
## Specific Ideas

- Quickstart must be a **realistic signup-style form (text + select + checkbox)**, shown for **both web and RN**, using the real `useForge` → `<Forge control={...}>` → `<Forger>`-wraps-a-custom-component pattern (D-04). This is the literal DOCS-01 acceptance bar — a reader following it on a fresh project gets a working, validated form on either platform.
- The three concrete DOCS-03 cleanups to verify gone repo-wide: the **"part of the Swifter project"** blurb (README L363), **placeholder install text** ("The forge library is included in your project"), and the **`__tests__/`** reference (MIGRATION.md L346).
- Publish must be **safe by construction**: release-triggered + lint/test-gated so a stray push to main can never publish (the current biggest CI hazard).

</specifics>

<deferred>
## Deferred Ideas

- **Release version selection + git tag** — Phase 6 (Publish). CHANGELOG stays `[Unreleased]` until then.
- **Hosted documentation site** (TypeDoc → GitHub Pages) — explicitly out of scope for v1 per PROJECT.md.
- **Node/OS test matrix** (Node 18/20/22, Ubuntu+Windows) — deferred; single Ubuntu+Node 20 for v1 (D-07). Worth revisiting if the Windows vitest flakiness noted in project memory bites consumers.
- **Stricter lint (`strict-type-checked`) + clearing the ~46 `as any` casts** — out of scope for a docs/CI phase; a future code-quality pass.

</deferred>

---

*Phase: 5-Docs & CI*
*Context gathered: 2026-05-31*
