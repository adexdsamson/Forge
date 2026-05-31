# Phase 5: Docs & CI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 5-Docs & CI
**Areas discussed:** Doc structure & API ref, CI & publish pipeline, Lint policy, CHANGELOG & MIGRATION

---

## Doc structure & API ref

| Option | Description | Selected |
|--------|-------------|----------|
| Separate docs/API.md | README stays focused; full prop/return tables in docs/API.md, linked from README | ✓ |
| Inline in README | All API tables in one long README section | |

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted correction | Keep existing structure, fix the broken parts | |
| Full rewrite | Rewrite README from scratch as an OSS landing page | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal custom input | Small self-contained custom Input showing Forger wiring | |
| Realistic/styled example | Fleshed-out form closer to a real app | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Text + select + checkbox | Signup-style form, 2-3 distinct component types | ✓ |
| Text fields only | 2-3 text inputs + submit | |
| Kitchen-sink form | Every supported field type | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, standard badges | npm version + CI status + license | ✓ |
| No badges | Lead straight with description + example | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep & refresh examples/ | Refresh examples/ to current API; link from README | ✓ |
| Fold into README/API.md | Move RN example content into docs; delete examples/ | |

**User's choice:** Separate docs/API.md; full README rewrite; realistic signup-style example (text + select + checkbox); standard badges; keep & refresh examples/.
**Notes:** API tables must cover useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist, validateField + platform utils. Quickstart must show both web and RN paths.

---

## CI & publish pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Split: ci.yml + publish.yml | ci.yml = lint+test on push/PR; publish.yml = release-triggered | ✓ |
| One combined workflow | Single file with conditional jobs | |

| Option | Description | Selected |
|--------|-------------|----------|
| Single: Ubuntu + Node 20 | One job, matches existing setup | ✓ |
| Node version matrix | Node 18 + 20 (+22) | |
| OS + Node matrix | Ubuntu + Windows × Node versions | |

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add --provenance | npm provenance via OIDC, id-token: write | ✓ |
| No provenance | Plain npm publish --access public | |

**User's choice:** Split workflows; single Ubuntu + Node 20 environment; publish with --provenance.
**Notes:** CICD-03 already locks release-event trigger, SHA-pinned actions, auth secret, publish-after-lint+test-pass. Publish trigger switches from push-to-main → release events.

---

## Lint policy

| Option | Description | Selected |
|--------|-------------|----------|
| Flat config + recommended | eslint.config.js + typescript-eslint recommended + react-hooks | ✓ |
| Flat config + strict-type-checked | Type-aware strict ruleset (flags existing `as any`) | |
| Legacy .eslintrc | Classic .eslintrc.json + recommended | |

| Option | Description | Selected |
|--------|-------------|----------|
| Separate + eslint-config-prettier | Prettier as own formatter; config-prettier disables ESLint stylistic rules | ✓ |
| Prettier via eslint-plugin-prettier | Prettier runs as an ESLint rule | |

| Option | Description | Selected |
|--------|-------------|----------|
| Check-only; CI fails | lint = eslint + prettier --check; separate lint:fix; CI fails on violations | ✓ |
| CI auto-fixes & commits | CI auto-fixes and pushes formatting commits | |

**User's choice:** Flat config + typescript-eslint recommended; Prettier separate + eslint-config-prettier; check-only lint with CI failing on violations.
**Notes:** `recommended` (not `strict-type-checked`) chosen to avoid surfacing the ~46 existing `as any` casts as out-of-scope work.

---

## CHANGELOG & MIGRATION

| Option | Description | Selected |
|--------|-------------|----------|
| Manual Keep-a-Changelog | Hand-written CHANGELOG with one initial entry | |
| Auto-gen (conventional-changelog) | Generate changelog from conventional-commit history | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| [Unreleased] section | Initial entry under [Unreleased]; Phase 6 renames to version+date | ✓ |
| Pin to a version now | Write entry under a concrete version heading now | |

| Option | Description | Selected |
|--------|-------------|----------|
| Repurpose: from react-hook-form | Rewrite MIGRATION.md as "migrating from raw react-hook-form to Forge" | ✓ |
| Keep & correct existing | Keep web→cross-platform framing, fix broken bits | |
| Remove MIGRATION.md | Delete it, fold guidance into README/examples | |

**User's choice:** Auto-gen via conventional-changelog; initial entry under [Unreleased]; repurpose MIGRATION.md for the react-hook-form→Forge journey.
**Notes:** Flagged wrinkle — with no prior release tags, conventional-changelog sweeps all extraction-era commits into the first generated section; the initial [Unreleased] content needs curation.

---

## Claude's Discretion

- README section ordering/wording, badge providers, prose tone.
- `docs/API.md` table columns/format.
- ESLint plugin set beyond typescript-eslint + react-hooks.
- Whether publish.yml keeps `workflow_dispatch` as a manual fallback.
- Specific conventional-changelog flavor (cli vs standard-version vs changesets) — pick the lightest.
- LICENSE wording verification/refinement.

## Deferred Ideas

- Release version selection + git tag → Phase 6.
- Hosted documentation site (TypeDoc → GitHub Pages) → out of scope for v1.
- Node/OS test matrix → deferred; single Ubuntu + Node 20 for v1.
- Stricter lint (`strict-type-checked`) + clearing ~46 `as any` casts → future code-quality pass.
