# Requirements: Forge

**Defined:** 2026-05-31
**Core Value:** A React developer — on web or React Native — can install Forge, follow the README, and build a working, validated form with custom components in minutes; it behaves correctly (real submit, fields re-render, clear errors) and stays stable across react-hook-form updates.

## v1 Requirements

Requirements for the initial public release. Each maps to a roadmap phase.

### Correctness

- [ ] **CORR-01**: `<Forge>` renders a real `<form>` element wired to `handleSubmit` on web (native submit + Enter-to-submit + form semantics), while preserving React Native behavior via the existing platform detection
- [ ] **CORR-02**: Passing invalid or multiple children to `<Forger>` produces a clear, component-named error (identifies `Forger` + the field `name`) instead of the generic `Slot` "Only one child allowed" throw
- [ ] **CORR-03**: Stale JSDoc (`ForgeFormProps`/`UseForgeFormResult`, which do not exist) is corrected and dead/duplicate code (e.g. `updateFieldArrayRootError` duplicated across `utils.ts` and `logic/`) is removed
- [ ] **CORR-04**: Wizard last-step submission works — `handleWizardSubmit` is implemented in `useForge` and wired so the final wizard step actually submits (currently declared/destructured but undefined, a silent no-op)

### Stability

- [x] **STAB-01**: `useFieldArray` no longer depends on react-hook-form private `control._*` internals — reimplemented on the public `useFieldArray`/RHF API, or the unavoidable internal access is isolated, documented, and version-guarded
- [x] **STAB-02**: `usePersist`, `useForgeValues`, and `useSubscribe` obtain values via public RHF APIs (`watch`/`useWatch`) instead of `control._subjects`/`control._formValues`
- [x] **STAB-03**: `lodash` is removed as a runtime dependency (replaced with native equivalents), shrinking the published bundle
- [x] **STAB-04**: `@hookform/devtools` is no longer shipped to production — it is lazy-loaded/dev-gated or moved out of runtime `dependencies`, so `debug` mode never forces DevTools into consumer bundles
- [x] **STAB-05**: The library builds and behaves correctly against the supported `react-hook-form ^7` range; type safety is real (no `as any` masking the public API surface — `useForge`'s augmented `control` is properly typed)

### Testing

- [x] **TEST-01**: A test runner + config (Jest or Vitest) is set up for the TypeScript React library, runnable via `yarn test`
- [x] **TEST-02**: A test renders `useForge` + `<Forge>` + `<Forger>`, fills values, submits, and asserts the `onSubmit` callback receives correct data (web path)
- [x] **TEST-03**: Tests cover `useFieldArray` (append/remove), `usePersist`/`useForgeValues` (value subscriptions), `validateField` rules, and wizard navigation incl. last-step submit
- [x] **TEST-04**: A meaningful coverage threshold is enforced and fails the run when not met

### Packaging

- [x] **PKG-01**: `package.json` is publish-ready — `@adexdsamson/forge` with populated `description`/`keywords`/`repository`/`homepage`/`author`/`license`, no `private` flag
- [x] **PKG-02**: Entry points (`main`/`module`/`types`/`exports`) are correct and a `prepublishOnly`/`prepack` script builds fresh artifacts before publish
- [x] **PKG-03**: `dist/` is not committed to git and ships only via the npm `files` field
- [x] **PKG-04**: The publish target is settled (public npm vs GitHub Packages) and `package.json` `publishConfig` + the CI workflow are made consistent with that choice

### Documentation

- [x] **DOCS-01**: README has accurate install instructions, a quickstart, and working end-to-end examples for BOTH web and React Native using the real current API (`useForge` + `<Forge control={...}>` + `<Forger>`)
- [x] **DOCS-02**: API reference (prop/return tables) for `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and the platform-detection utilities
- [x] **DOCS-03**: `MIGRATION.md`, `README`, and `LICENSE` are corrected — remove the "part of the Swifter project" blurb, fix placeholder install text, and remove references to `__tests__/` that do not exist; add a `CHANGELOG.md` with an initial entry

### CI/CD

- [x] **CICD-01**: Lint + format tooling (ESLint + Prettier) is configured and runnable
- [x] **CICD-02**: A CI workflow runs lint + tests on every pull request and push
- [x] **CICD-03**: Automated publish runs on release to the chosen registry, with the publish action pinned to a SHA and requiring an auth-token secret

### Publish

- [ ] **PUB-01**: The package is published to the chosen registry and `install` in a fresh project succeeds with `{ useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist }` importing and type-checking correctly

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

- **FEAT-01**: Hosted API documentation site (TypeDoc → GitHub Pages or similar)
- **FEAT-02**: Additional field/composition helpers beyond the current API
- **RN-01**: A dedicated React Native example app / RN-specific test environment (beyond cross-platform unit tests)

## Out of Scope

Explicitly excluded for this milestone.

| Feature | Reason |
|---------|--------|
| Replacing react-hook-form | Forge is a thin wrapper over RHF by design, not a replacement |
| New form features beyond the current API | This milestone is "fix + harden + ship what exists," not feature expansion |
| Hosted documentation site | README + API reference suffice for v1; deferred to v2 |
| Migrating off Rollup to a different bundler | Keep the proven bundler; only modernize within it |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORR-01 | Phase 1 | Pending |
| CORR-02 | Phase 1 | Pending |
| CORR-03 | Phase 1 | Pending |
| CORR-04 | Phase 1 | Pending |
| STAB-01 | Phase 2 | Complete |
| STAB-02 | Phase 2 | Complete |
| STAB-03 | Phase 2 | Complete |
| STAB-04 | Phase 2 | Complete |
| STAB-05 | Phase 2 | Complete |
| TEST-01 | Phase 3 | Complete |
| TEST-02 | Phase 3 | Complete |
| TEST-03 | Phase 3 | Complete |
| TEST-04 | Phase 3 | Complete |
| PKG-01 | Phase 4 | Complete |
| PKG-02 | Phase 4 | Complete |
| PKG-03 | Phase 4 | Complete |
| PKG-04 | Phase 4 | Complete |
| DOCS-01 | Phase 5 | Complete |
| DOCS-02 | Phase 5 | Complete |
| DOCS-03 | Phase 5 | Complete |
| CICD-01 | Phase 5 | Complete |
| CICD-02 | Phase 5 | Complete |
| CICD-03 | Phase 5 | Complete |
| PUB-01 | Phase 6 | Pending |

---
*Requirements defined: 2026-05-31 — re-grounded on the cross-platform codebase extracted from orbipayx*
