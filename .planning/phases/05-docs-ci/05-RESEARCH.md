# Phase 5: Docs & CI - Research

**Researched:** 2026-05-31
**Domain:** Documentation authoring, ESLint 9 flat config, conventional-changelog tooling, GitHub Actions CI/CD hardening, npm provenance publishing
**Confidence:** HIGH (all tooling decisions verified via npm registry and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Documentation structure (DOCS-01, DOCS-02)**
- **D-01:** API reference lives in a separate `docs/API.md`, linked from README. Tables MUST cover `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and platform-detection utilities.
- **D-02:** Full README rewrite (not a patch). Hero description → badges → install → quickstart → key concepts → links to `docs/API.md` and `examples/`.
- **D-03:** README opens with standard status badges: npm version, CI status, license.
- **D-04:** Canonical quickstart is a realistic signup-style form (text + select + checkbox), both web and React Native variants, showing `useForge` → `<Forge control={...}>` → `<Forger>`-wraps-custom-component with validation and real submit.
- **D-05:** Keep `examples/` directory. Refresh `examples/ReactNativeExample.md` to current API + correct imports (`@adexdsamson/forge`), link from README.

**CI & publish pipeline (CICD-02, CICD-03)**
- **D-06:** Split into two workflows: `ci.yml` (lint+test on push/PR) and `publish.yml` (release-triggered publish).
- **D-07:** Single CI environment: `ubuntu-latest` + Node 20.
- **D-08:** `publish.yml` triggers on GitHub `release` events (replacing current push-to-main trigger). Re-runs lint+test before publish. Keep `workflow_dispatch` as manual fallback (at planner discretion).
- **D-09:** Pin all GitHub Actions to commit SHA (not version tags).
- **D-10:** Publish with `npm publish --provenance --access public`, requires `permissions: { id-token: write }`. Auth via `NODE_AUTH_TOKEN` from `secrets.NPM_ACCESS_TOKEN`, registry `https://registry.npmjs.org`.
- **D-11:** Publish from repo root; `prepack` rebuilds `dist/` — no separate build step in CI.

**Lint policy (CICD-01)**
- **D-12:** ESLint flat config (`eslint.config.js`, ESLint 9) with `typescript-eslint recommended` (NOT strict-type-checked) plus react-hooks rules.
- **D-13:** Prettier runs separately; `eslint-config-prettier` disables stylistic ESLint rules. NOT `eslint-plugin-prettier`.
- **D-14:** `lint` = `eslint src/` + `prettier --check src/` (check-only, non-zero exit on violations). Separate `lint:fix` for local auto-fixing. CI runs check-only, does NOT auto-fix or push.

**CHANGELOG & MIGRATION (DOCS-03)**
- **D-15:** CHANGELOG via conventional-changelog tooling.
- **D-16:** Initial entry under `## [Unreleased]` — Phase 6 renames to version. Wrinkle: no prior release tags means first generation sweeps all extraction-era commits; initial `[Unreleased]` content needs curation.
- **D-17:** Repurpose `MIGRATION.md` as "migrating from raw react-hook-form to Forge". Remove dead `__tests__/ReactNativeForm.test.tsx` reference (MIGRATION.md:346).

### Claude's Discretion
- Exact README section ordering/wording, badge providers (shields.io etc.), and prose tone.
- Exact prop-table columns/format in `docs/API.md`.
- Specific ESLint plugin set beyond typescript-eslint + react-hooks (e.g., whether to add `eslint-plugin-react`).
- Whether `publish.yml` keeps `workflow_dispatch` as manual fallback.
- Specific conventional-changelog flavor/preset — pick lightest that satisfies D-15/D-16.
- Verify `LICENSE` (MIT, shipped Phase 4) copyright/wording.

### Deferred Ideas (OUT OF SCOPE)
- Release version selection + git tag — Phase 6.
- Hosted documentation site (TypeDoc → GitHub Pages) — v2.
- Node/OS test matrix — deferred.
- Stricter lint (`strict-type-checked`) + clearing ~46 `as any` casts — future code-quality pass.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | README has accurate install instructions, quickstart, and working web + RN examples using current API | D-02/D-04: Full rewrite with real `useForge` + `<Forge control={...}>` + `<Forger>` examples; confirmed API surface from `src/index.ts` and source files |
| DOCS-02 | API reference (prop/return tables) for `useForge`, `Forge`, `Forger`, `useFieldArray`, `useForgeValues`, `usePersist`, `validateField`, and platform-detection utilities | D-01: Separate `docs/API.md`; exported symbols enumerated in this research |
| DOCS-03 | `MIGRATION.md`, `README`, and `LICENSE` corrected; remove Swifter blurb, fix placeholder install, remove `__tests__/` ref; add `CHANGELOG.md` | D-17 MIGRATION repurpose; D-15/D-16 `commit-and-tag-version` CHANGELOG; LICENSE verified correct |
| CICD-01 | Lint + format tooling (ESLint + Prettier) configured and runnable | D-12/D-13/D-14: ESLint 9 flat config + typescript-eslint + react-hooks + eslint-config-prettier |
| CICD-02 | CI workflow runs lint + tests on every PR and push; status check visible | D-06: New `ci.yml` with correct trigger, ubuntu-latest + Node 20 |
| CICD-03 | Automated publish on release, publish action SHA-pinned, auth-token secret, lint+test-gated | D-08/D-09/D-10: Release trigger, SHA pins resolved, provenance publishing |
</phase_requirements>

---

## Summary

Phase 5 converts a private-origin codebase into a polished OSS package with accurate documentation, enforced lint standards, and a hardened CI pipeline. All major decisions are locked in CONTEXT.md — this research focuses on the three open "Claude's Discretion" tooling areas plus concrete setup for each locked decision.

**Conventional changelog tool selected: `commit-and-tag-version`** — the actively-maintained `standard-version` fork. It is lighter than `@changesets/cli`, does not require monorepo infrastructure, and supports skipping the version-bump and git-tag steps while still generating a `CHANGELOG.md`. The key mechanism for the "no prior tags + stay under `[Unreleased]`" requirement is running it with `--skip.bump --skip.tag --skip.commit` on first execution, then manually curating the generated `[Unreleased]` section.

**ESLint 9 flat config:** Use `typescript-eslint@^8.x` (the `typescript-eslint` meta-package), `eslint-plugin-react-hooks@^7.x` (now ships a `flat['recommended-latest']` config), and `eslint-config-prettier@^10.x` to suppress stylistic conflicts. The config file is `eslint.config.js` (CJS default, since `package.json` has no `"type": "module"`).

**GitHub Actions SHA pins resolved:** `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2) and `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0) — both verified via `git ls-remote` in this session.

**Primary recommendation:** Follow the locked decisions verbatim. The only non-trivial discretion call is `commit-and-tag-version` as the CHANGELOG tool — confirmed actively maintained, lightest fit, and supports the "generate without version-bump or tag" workflow Phase 5 requires.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| README + API docs authoring | Repository files | — | Static markdown; no runtime component |
| CHANGELOG generation | Dev tooling (local CLI) | — | Runs locally or in CI pre-release; `commit-and-tag-version` |
| MIGRATION.md rewrite | Repository files | — | Static markdown |
| ESLint + Prettier config | Dev tooling | CI (enforcement) | Config files in repo root; enforced by ci.yml |
| `ci.yml` (lint+test on push/PR) | GitHub Actions | — | Cloud CI; ubuntu-latest + Node 20 |
| `publish.yml` (release-triggered) | GitHub Actions | npm registry | Release event → lint+test+publish |
| npm provenance attestation | npm registry + GitHub OIDC | — | `id-token: write` + `--provenance` flag |

---

## Standard Stack

### Core — Lint Tooling (CICD-01)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `eslint` | `^9.x` (currently `10.4.1`) | Linter runtime | ESLint 9 is the flat-config generation; ESLint 10 is backward-compatible |
| `typescript-eslint` | `^8.60.0` | TS parser + `recommended` ruleset | The meta-package that replaces `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` separately |
| `eslint-plugin-react-hooks` | `^7.1.1` | Rules of Hooks enforcement | Official React plugin; v7 adds `flat['recommended-latest']` config |
| `eslint-config-prettier` | `^10.1.8` | Disables ESLint stylistic rules that conflict with Prettier | The approved non-plugin approach (D-13) |
| `prettier` | `^3.8.3` | Opinionated formatter | Already the ecosystem standard; runs separately per D-13 |
| `@eslint/js` | `^10.0.1` | Core ESLint recommended rules | Peer of `typescript-eslint`; provides `js.configs.recommended` |

**Version verification:** All versions confirmed via `npm view <package> version` during this session. [VERIFIED: npm registry]

**Installation:**
```bash
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-config-prettier prettier
```

### Core — CHANGELOG Tooling (DOCS-03)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commit-and-tag-version` | `^12.7.3` | CHANGELOG generation from conventional commits | Actively maintained fork of deprecated `standard-version`; last published 2026-05-08 [VERIFIED: npm registry]; does NOT require a monorepo setup |

**Note on alternatives:**
- `conventional-changelog-cli@^5.0.0` — lower-level, outputs to stdout/file but does not handle versioning, tagging, or skip logic. Last published 2026-03-01 [VERIFIED: npm registry]. Acceptable but requires more manual orchestration.
- `@changesets/cli@^2.31.0` — monorepo-oriented, adds separate `changeset` workflow files and a PR review step that is overkill for a single-package repo.

**Recommendation:** Use `commit-and-tag-version` — it is the lightest single-package tool that handles the "generate CHANGELOG, skip bump and tag" workflow Phase 5 needs. [VERIFIED: npm registry]

**Installation:**
```bash
npm install --save-dev commit-and-tag-version
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `typescript-eslint` (meta-package) | `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` separately | Meta-package is the current recommended approach per official docs; separate packages require manual version syncing |
| `commit-and-tag-version` | `conventional-changelog-cli` | Lower-level; requires manually writing the `[Unreleased]` wrapper, no skip-lifecycle flags |
| `eslint-config-prettier` | `eslint-plugin-prettier` | Plugin embeds Prettier as a rule (slower, duplicate reports); config-only approach is faster and D-13 requires it |

---

## Architecture Patterns

### System Architecture Diagram

```
Developer Workstation                      GitHub / npm
─────────────────────                      ────────────
                                           ┌──────────────────────────────────────┐
  npm run lint                             │ Pull Request / Push to branch         │
  ├─► eslint src/       (exit ≠0 = fail)  │      │                               │
  └─► prettier --check  (exit ≠0 = fail)  │      ▼                               │
                                           │  ci.yml triggers                      │
  npm run lint:fix                         │  ├─ actions/checkout@<SHA>            │
  ├─► eslint src/ --fix                   │  ├─ actions/setup-node@<SHA>          │
  └─► prettier --write src/               │  ├─ npm ci                            │
                                           │  ├─ npm run lint   ──► FAIL = block  │
  npm test                                 │  └─ npm test       ──► FAIL = block  │
  └─► vitest run --coverage               │                                       │
      (thresholds gate exit code)          └──────────────────────────────────────┘

  npm run changelog                        ┌──────────────────────────────────────┐
  └─► commit-and-tag-version              │ GitHub Release event (published)      │
      --skip.bump --skip.tag              │      │                               │
      --skip.commit                        │      ▼                               │
      ──► CHANGELOG.md [Unreleased]        │  publish.yml triggers                 │
          (requires manual curation)       │  ├─ actions/checkout@<SHA>            │
                                           │  ├─ actions/setup-node@<SHA>          │
                                           │  ├─ npm ci                            │
                                           │  ├─ npm run lint   ──► FAIL = abort  │
                                           │  ├─ npm test       ──► FAIL = abort  │
                                           │  └─ npm publish --provenance          │
                                           │       --access public                 │
                                           │       ──► npmjs.org (with SLSA)       │
                                           └──────────────────────────────────────┘
```

### Recommended Project Structure (new files only)

```
/ (repo root)
├── eslint.config.js          # ESLint 9 flat config (D-12)
├── .prettierrc               # Prettier config (D-13)
├── .prettierignore           # Ignore dist/, node_modules/
├── CHANGELOG.md              # Auto-generated, [Unreleased] (D-15/D-16)
├── docs/
│   └── API.md               # New: prop/return reference tables (D-01)
├── examples/
│   └── ReactNativeExample.md # Refresh: @adexdsamson/forge imports (D-05)
├── README.md                 # Full rewrite (D-02)
├── MIGRATION.md              # Repurposed: RHF→Forge migration (D-17)
└── .github/workflows/
    ├── ci.yml               # New: lint+test on push/PR (D-06)
    └── publish.yml          # Reworked: release trigger, SHA pins, provenance (D-08/D-09/D-10)
```

### Pattern 1: ESLint 9 Flat Config (eslint.config.js)

**What:** Flat config using `typescript-eslint` `recommended` (no type-checking required), `react-hooks` flat config, and `prettier` conflict-disabling layer.

**Note on file name:** Project has no `"type": "module"` in `package.json`. Use `eslint.config.js` (CJS). If CJS syntax is needed, use `module.exports = [...]` — alternatively use `eslint.config.mjs` which always uses ESM syntax regardless of `package.json`. `eslint.config.mjs` is the safest cross-format choice.

**Example:**
```javascript
// eslint.config.mjs
// Source: https://typescript-eslint.io/getting-started/ [CITED: typescript-eslint.io]
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  prettierConfig,
  {
    // Apply only to src/
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Override any rules that produce too much noise on the ~46 as-any casts
      // D-12: recommended only, not strict-type-checked
      '@typescript-eslint/no-explicit-any': 'warn', // warn, not error, for the existing as-any backlog
    },
  },
  {
    // Ignore dist and node_modules
    ignores: ['dist/**', 'node_modules/**', '*.config.mjs', '*.config.ts'],
  }
);
```

**react-hooks flat config support status:** `eslint-plugin-react-hooks@7.x` ships `configs.flat['recommended-latest']` — this is the current recommended usage for ESLint 9 flat config. [VERIFIED: npm registry, peerDependencies confirmed `eslint: "^9.0.0 || ^10.0.0"`] [CITED: github.com/facebook/react/issues/28313]

### Pattern 2: Prettier Config

**What:** Minimal `.prettierrc` and `.prettierignore` to configure Prettier as the formatter. Prettier is invoked separately (not as an ESLint plugin per D-13).

**Example `.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Example `.prettierignore`:**
```
dist/
node_modules/
*.cjs.js
*.esm.js
```

### Pattern 3: package.json lint scripts (D-14)

```json
{
  "scripts": {
    "lint": "eslint src/ && prettier --check src/",
    "lint:fix": "eslint src/ --fix && prettier --write src/"
  }
}
```

**Behavior:** `lint` exits non-zero if ESLint finds violations OR Prettier finds formatting differences. `lint:fix` applies both in-place. CI runs `npm run lint` (check-only). [VERIFIED: ESLint and Prettier CLI behavior]

### Pattern 4: ci.yml (CICD-02)

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Setup Node
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 20
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test
```

**Notes:**
- SHA pins resolved and verified in this session via `git ls-remote` against GitHub. [VERIFIED: git ls-remote]
- `cache: 'npm'` is a `setup-node` built-in feature — caches `~/.npm` based on `package-lock.json` hash.
- No separate build step: `npm test` runs `vitest run --coverage`; `prepack` is only invoked on pack/publish.

### Pattern 5: publish.yml (CICD-03) — reworked from current

```yaml
name: Publish

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # Required for npm provenance (D-10)
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Setup Node
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Publish
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_ACCESS_TOKEN }}
```

**Changes from current `publish.yml`:**
- Trigger: `release: { types: [published] }` replaces `push: branches: [main]`
- `workflow_dispatch` retained as manual fallback (D-08)
- `permissions: id-token: write` added (D-10 provenance requirement)
- `actions/checkout@v3` → `@11bd71901bbe5b1630ceea73d27597364c9af683` (D-09)
- `actions/setup-node@v3` → `@49933ea5288caeca8642d1e84afbd3f7d6820020` (D-09)
- Lint + test steps added before publish (D-08 gate)
- `npm publish --provenance --access public` (D-10)
- No `working-directory` — publish from root (Phase 4 D-04, `prepack` handles build)

### Pattern 6: commit-and-tag-version CHANGELOG generation (D-15/D-16)

**For Phase 5 (generate `[Unreleased]` stub without version-bump or git tag):**

```bash
# Dry-run first to see what would be generated
npx commit-and-tag-version --dry-run --skip.bump --skip.tag --skip.commit

# Actually generate CHANGELOG.md (no version bump, no commit, no tag)
npx commit-and-tag-version --skip.bump --skip.tag --skip.commit
```

**What this does:** Reads all conventional commits since the beginning (no prior tags), generates a `CHANGELOG.md`. Without `--skip.bump/tag/commit` it would also bump `package.json` version and create a git tag — those belong to Phase 6.

**The curation wrinkle (D-16):** Because there are no prior release tags in this repo [VERIFIED: `git tag -l` returns empty], `commit-and-tag-version` will sweep ALL extraction-era commits into the generated section. The generated section header will show the current version from `package.json` (1.0.3) with a date, not `[Unreleased]`. The plan must include a manual edit step to:
1. Run the tool with skip flags as shown above.
2. Rename the generated version header to `## [Unreleased]` (removing the version number and date).
3. Curate the commit list down to a meaningful OSS-readiness summary (drop internal migration commits, keep feature/fix/perf entries meaningful to external users).

**Optional `.versionrc.json` config** to make this reproducible:
```json
{
  "skip": {
    "bump": true,
    "tag": true,
    "commit": true
  }
}
```
Then the Phase 5 changelog script is simply `commit-and-tag-version`.

**For Phase 6 (version release):** Run `commit-and-tag-version` without skip flags (or remove `.versionrc.json`) — it will bump version, update `CHANGELOG.md`, commit, and tag. [CITED: github.com/absolute-version/commit-and-tag-version]

### Anti-Patterns to Avoid

- **Using `eslint-plugin-prettier`:** Embeds Prettier as an ESLint rule, causing double-reporting and slower runs. D-13 explicitly requires `eslint-config-prettier` instead.
- **Using `strict-type-checked` in ESLint:** Requires `parserOptions.project` (type-aware linting), significantly slower, and would surface ~46 `as any` violations out of scope for this phase (D-12).
- **Triggering publish on push to main:** Current `publish.yml` has this — it is the primary security hazard. Must be replaced with release-event trigger.
- **Tag-pinned GitHub Actions:** `actions/checkout@v3` and `actions/setup-node@v3` tags are mutable (maintainers can move them). SHA pinning is required (D-09).
- **`conventional-changelog-cli` alone for D-16:** The CLI outputs to stdout/file but does not manage the `[Unreleased]` header, skip lifecycle, or produce the keep-a-changelog format that `commit-and-tag-version` generates by default.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CHANGELOG from commits | Custom git log parser script | `commit-and-tag-version` | Handles conventional-commits parsing, keep-a-changelog format, skip lifecycle flags, first-release behavior |
| ESLint TypeScript support | Manual TS parser config | `typescript-eslint` meta-package | Meta-package bundles parser + plugin at matched versions; manual setup risks version mismatch |
| Prettier+ESLint conflict resolution | Disable rules manually one-by-one | `eslint-config-prettier` | Maintains a curated, up-to-date list of all Prettier-conflicting ESLint rules |
| GitHub Actions SHA lookup | Manually browsing GitHub | `git ls-remote https://github.com/actions/checkout refs/tags/vX.Y.Z` | Deterministic, scriptable at execution time |

**Key insight:** All three open tooling choices have well-maintained dedicated packages. The main trap is selecting deprecated/abandoned predecessors (`standard-version`, old `@typescript-eslint/*` split packages, `eslint-plugin-prettier`).

---

## API.md Documentation Surface (DOCS-02)

The `src/index.ts` public export list bounds what `docs/API.md` must document. These are the exported symbols by module group:

**Hooks (most important for consumers):**
- `useForge` — props: `UseForgeProps<TFieldProps, TFieldValues>`; returns `UseForgeResult<TFieldValues>` (RHF `UseFormReturn` + augmented `ForgeControl`)
- `useFieldArray` — custom hook wrapping RHF's `useFieldArray` with per-item `inputProps` preservation
- `useForgeValues` — thin wrapper: exposes `getValue(name)`, `setValue(name, value)`, `getValues()`
- `usePersist` — subscribes to form state changes via `useWatch`/`useFormState`; handler receives `(values, { isDirty, isValid })`

**Components:**
- `Forge` — props: `ForgeProps<TFieldValues, TFieldProps>` (includes `control`, `onSubmit`, `className`, `noValidate`, `debug`, `isWizard`, `platform`, `ref`)
- `Forger` — props: `ForgerProps<TFieldValues>` (includes `name`, `component`, `rules`, `transform`, `handler`, `dependencies`, plus all HTML input attrs)

**Standalone functions:**
- `validateField` — async validator; signature from `src/validateField.ts`

**Types (exported from `src/types.ts`):**
- `ForgeControl`, `ForgeProps`, `ForgerProps`, `ForgerControllerProps`, `ForgerSlotProps`, `TForgerProps`, `FieldProps`, `UseForgeProps`, `UseForgeResult`, `ReactNativeInputProps`, `PlatformSpecificProps`, `CrossPlatformForgerProps`, `FormPropsRef`

**Platform-detection utilities (from `src/reactNative.ts`):**
- `REACT_NATIVE_COMPONENTS`, `getEventHandlerName`, `getValuePropertyName`, `setReactNativeError`, `getComponentType`, `mergePlatformProps`, `REACT_NATIVE_VALIDATION_RULES`, `handleReactNativeFile`, `getPlatform`, `isValidReactNativeComponent`

**Platform booleans (from `src/utils.ts`):**
- `isWeb`, `isReactNative`, `isMobile`, `isTextInput`, `isCheckBoxInput`, `isRadioInput`, `isPicker`, `isSwitch`, `isSlider`

**Total documented surface:** 7 hook/component/function entries + 13 type aliases + 10 reactNative utilities + 9 utils booleans. [VERIFIED: src/index.ts]

---

## Housekeeping Cleanups (DOCS-03)

Exact strings to verify gone after Phase 5 (per CONTEXT.md `<specifics>`):

| File | Problem | Location | Action |
|------|---------|----------|--------|
| `README.md` | "part of the Swifter project" blurb | Line ~363 | Full rewrite removes it |
| `README.md` | Placeholder install text "The forge library is included in your project" | ~Line 15-20 | Full rewrite replaces with `npm install @adexdsamson/forge` |
| `README.md` | `'./lib/forge'` imports | Throughout examples | Full rewrite uses `@adexdsamson/forge` |
| `MIGRATION.md` | Dead `__tests__/ReactNativeForm.test.tsx` reference | Line 346 | Repurpose/rewrite removes it |
| `examples/ReactNativeExample.md` | `'../index'` import | Line 19 | Refresh to `@adexdsamson/forge` |
| `LICENSE` | Check wording is correct for public OSS package | All | Verified: MIT, copyright 2026 adexdsamson — correct [VERIFIED: LICENSE file] |

**LICENSE assessment:** The existing `LICENSE` file (shipped Phase 4) is standard MIT text with "Copyright (c) 2026 adexdsamson" — correct, complete, no changes needed. [VERIFIED: LICENSE file read this session]

---

## Common Pitfalls

### Pitfall 1: ESLint config file extension mismatch

**What goes wrong:** `eslint.config.js` in a project without `"type": "module"` is CJS — it needs `module.exports = [...]` syntax. Using `import/export` in a `.js` file in a CJS project causes `SyntaxError`.

**Why it happens:** ESLint 9 flat config examples are typically shown with ESM syntax; `package.json` of this project does NOT have `"type": "module"` (intentionally, per Phase 4 D-10).

**How to avoid:** Name the config file `eslint.config.mjs` — the `.mjs` extension forces ESM regardless of `package.json` `type` field. This is the safest cross-format choice.

**Warning signs:** `SyntaxError: Cannot use import statement in a module` when running `eslint`.

### Pitfall 2: commit-and-tag-version first-run sweeps ALL commits

**What goes wrong:** With zero git tags (confirmed: `git tag -l` returned empty in this repo), `commit-and-tag-version` generates a `CHANGELOG.md` that includes every conventional commit since the repo was created — including 20+ internal planning and refactoring commits that are noise for external users.

**Why it happens:** The tool looks for the most recent semver tag to determine the range. Finding none, it uses the beginning of history.

**How to avoid:** The plan must include an explicit "curate the generated `[Unreleased]` section" task. Accept the dump, then hand-edit to keep only user-facing changes. The generated section header will be labeled with the current `package.json` version (1.0.3) — rename it to `## [Unreleased]` manually.

**Warning signs:** `CHANGELOG.md` lists 30+ entries including docs/chore commits from the planning workflow.

### Pitfall 3: npm provenance failing on self-hosted or private-repo runners

**What goes wrong:** `npm publish --provenance` fails with an OIDC token error.

**Why it happens:** Provenance requires a GitHub-hosted runner (`ubuntu-latest`) and OIDC token issuance (`id-token: write` permission). Self-hosted runners do not have OIDC by default. Also: `package.json repository.url` must case-sensitively match the publishing GitHub repository URL. [CITED: docs.npmjs.com/generating-provenance-statements]

**How to avoid:** Use `ubuntu-latest` (already locked D-07), add `permissions: id-token: write` to the publish job, ensure `package.json repository.url` = `git+https://github.com/adexdsamson/Forge.git` matches case exactly. Current `package.json` already has this URL [VERIFIED: package.json].

**Warning signs:** `npm ERR! code EOTP` or OIDC token generation errors in the Actions log.

### Pitfall 4: `prettier --check src/` finds no files or wrong files

**What goes wrong:** Prettier checks no files (succeeds vacuously) because `src/` contains only `.ts`/`.tsx` files and Prettier defaults may not be configured.

**Why it happens:** Prettier auto-detects file types but `.prettierrc` must exist for consistent config. Without `--parser` flags, it relies on file extension detection.

**How to avoid:** Add `.prettierrc` before running `prettier --check src/`. Run it locally once to catch all current formatting violations before adding it to CI — failing CI on first PR due to existing formatting issues is embarrassing.

**Warning signs:** CI passes immediately on first run despite known formatting inconsistencies.

### Pitfall 5: `publish.yml` workflow_dispatch manual trigger publishes unintentionally

**What goes wrong:** A developer runs `workflow_dispatch` on the publish workflow on a non-release commit, accidentally publishing a half-finished version.

**Why it happens:** `workflow_dispatch` bypasses the release-event guard.

**How to avoid:** The lint+test gate in `publish.yml` provides a safety net. Document in workflow comments that `workflow_dispatch` is for emergency/recovery use only.

---

## GitHub Actions SHA Pins (D-09)

SHA pins resolved via `git ls-remote` during this session [VERIFIED: git ls-remote]:

| Action | Tag | Commit SHA | Verified Method |
|--------|-----|-----------|-----------------|
| `actions/checkout` | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` | `git ls-remote https://github.com/actions/checkout refs/tags/v4.2.2` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` | `git ls-remote https://github.com/actions/setup-node refs/tags/v4.4.0` |

**Usage syntax:**
```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
```

**Important:** These are the tag-object SHAs (lightweight tags pointing directly to commits). If the maintainer ever moves the tag (which would be unusual for a point release), re-run `git ls-remote` to get the updated SHA. The comment `# v4.2.2` / `# v4.4.0` is human-readable only; GitHub Actions uses the SHA.

**Note on "latest v4":** The v4 floating tag for both actions currently resolves to these same SHAs (`actions/checkout v4` → `11bd71...` = v4.2.2; `actions/setup-node v4` → `49933e...` = v4.4.0 at time of this session). Pinning to the point release SHA is the correct approach regardless.

---

## npm Provenance Publishing (D-10)

**Requirements** [CITED: docs.npmjs.com/generating-provenance-statements]:

1. **Supported CI**: GitHub Actions with GitHub-hosted runner (`ubuntu-latest`) — cloud-hosted only; self-hosted runners not supported.
2. **npm version**: npm 9.5.0+ required. Node 20 ships npm 10.x by default — requirement met.
3. **`id-token: write` permission**: Must be on the job (not just workflow-level) performing the publish.
4. **`repository` in `package.json`**: Must case-sensitively match the GitHub repo URL. Current `package.json` has `git+https://github.com/adexdsamson/Forge.git` — correct.
5. **Public package**: Provenance is not generated for packages published from private repositories, even if the package itself is public. This is a public repo — no issue.
6. **Command**: `npm publish --provenance --access public`

**Common failure modes:**
- Missing `id-token: write` permission → OIDC token mint fails
- `repository` URL case mismatch → attestation verification failure at npm registry
- Using `npm publish --access public` without `--provenance` → publishes without attestation (no "Verified" badge on npmjs.com)
- Running on self-hosted runner → OIDC not available

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test` (`vitest run --coverage`) |
| Full suite command | `npm test` (single command runs all tests + coverage) |

### Phase Requirements → Test Map

Phase 5 is documentation + CI tooling. Most deliverables are static files (README, API.md, MIGRATION.md, CHANGELOG.md) or configuration files (`eslint.config.mjs`, `.prettierrc`, workflow YAML). These cannot be unit-tested with Vitest — they are verified by CI execution and manual review.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | README quickstart code compiles against current API | Manual smoke / typecheck | `npm run typecheck` | ✅ (`tsc --noEmit`) |
| DOCS-02 | API.md covers all exported symbols | Manual review | — (no automated check) | — |
| DOCS-03 | "Swifter", placeholder install, `__tests__/` refs absent | Manual grep / CI check | `grep -r "Swifter" . --include="*.md"` | — |
| CICD-01 | `npm run lint` exits non-zero on violations | CI enforcement | `npm run lint` | ❌ Wave 0 |
| CICD-02 | `ci.yml` runs on push/PR | CI execution | Trigger via PR | ❌ Wave 0 |
| CICD-03 | `publish.yml` triggers on release, SHA-pinned | CI execution | Verify workflow YAML | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run lint && npm run typecheck` (verify lint config does not break TS)
- **Per wave merge:** `npm test` (ensure lint additions didn't break coverage)
- **Phase gate:** `npm run lint && npm test` both green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `eslint.config.mjs` — must exist before `npm run lint` works (CICD-01)
- [ ] `.prettierrc` — must exist before `prettier --check` is meaningful (CICD-01)
- [ ] `package.json` `lint`/`lint:fix` scripts — must be added before lint step works (CICD-01)
- [ ] `commit-and-tag-version` devDep installed — must exist before `npm run changelog` works (DOCS-03)
- [ ] ESLint/Prettier devDeps installed — must be added to `package.json` before lint commands work (CICD-01)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` as separate packages | `typescript-eslint` meta-package (v6+) | typescript-eslint v6 (2023) | Single install, matched versions, single import |
| `standard-version` for CHANGELOG | `commit-and-tag-version` (maintained fork) | May 2022 (standard-version deprecated) | Drop-in replacement; same CLI flags |
| `eslint-plugin-prettier` to run Prettier as ESLint rule | `eslint-config-prettier` (config-only) + run Prettier separately | Industry-wide shift ~2020+ | No double-reporting, faster CI |
| ESLint `.eslintrc.js` (legacy config) | `eslint.config.js` flat config (ESLint 9) | ESLint 9.0 (April 2024) | Flat, explicit, more modular |
| `actions/checkout@v3` + `actions/setup-node@v3` | SHA-pinned v4.x | Current best practice | Supply-chain attack protection; v4 adds Node 20+ support and npm cache |

**Deprecated/outdated:**
- `standard-version`: Deprecated May 2022; last commit was June 2022. Use `commit-and-tag-version` instead.
- `@typescript-eslint/eslint-plugin` / `@typescript-eslint/parser` (separate): Still work but `typescript-eslint` meta-package is the current recommended path per official docs.
- ESLint `.eslintrc.*` files: Still supported in ESLint 9 via legacy compat layer but flat config is the default and only option in ESLint 10+.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `.versionrc.json` skip config prevents `commit-and-tag-version` from bumping `package.json` version | CHANGELOG Pattern | If wrong: tool bumps 1.0.3 → some semver bump during Phase 5, which Phase 6 must account for. Mitigation: dry-run first, inspect output |
| A2 | `eslint-plugin-react-hooks@7.1.1` `flat['recommended-latest']` config works without `eslint-plugin-react` | ESLint Pattern | If wrong: may need to add `eslint-plugin-react` or use manual plugin wiring. Low risk — peer deps confirmed ESLint 9/10 compatible |

---

## Open Questions

1. **Should `eslint-plugin-react` be added alongside `eslint-plugin-react-hooks`?**
   - What we know: D-12 specifies `typescript-eslint recommended` + react-hooks. `eslint-plugin-react` adds broader React rules (prop-types, display-name, etc.). The project is a library, not an app, and prop-types are not used (TypeScript handles types).
   - What's unclear: Whether the Claude's Discretion note about "whether to add `eslint-plugin-react`" indicates interest.
   - Recommendation: Skip `eslint-plugin-react` for Phase 5 — it adds 40+ rules, many not relevant to a library, and increases noise. The `recommended` config from `typescript-eslint` plus `react-hooks` is sufficient.

2. **Should `npm run changelog` be a dedicated package.json script?**
   - What we know: `commit-and-tag-version` can be invoked via `npx` or as a script.
   - What's unclear: Whether the planner wants a persistent `changelog` script in `package.json` vs a one-time `npx` invocation.
   - Recommendation: Add a `"changelog": "commit-and-tag-version --skip.bump --skip.tag --skip.commit"` script to `package.json` for repeatability. Phase 6 removes/modifies it when doing the real release.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20 | ESLint, Prettier, build | ✓ | CI-enforced; local Node inferred from project use | — |
| npm | Package installs, lint scripts | ✓ | Lockfile committed | — |
| GitHub Actions ubuntu-latest | ci.yml, publish.yml | ✓ | Cloud-hosted, always available | — |
| `secrets.NPM_ACCESS_TOKEN` | publish.yml auth | External (user must verify) | — | Publish blocked without it |
| `eslint`, `typescript-eslint`, etc. | CICD-01 | ✗ (not yet installed) | — | Install via Wave 0 npm step |
| `commit-and-tag-version` | DOCS-03 | ✗ (not yet installed) | — | Install via Wave 0 npm step |
| `prettier` | CICD-01 | ✗ (not yet installed) | — | Install via Wave 0 npm step |

**Missing dependencies with no fallback:**
- `secrets.NPM_ACCESS_TOKEN` — must exist in GitHub repository secrets before `publish.yml` can publish. Planner should note this as a prerequisite for Phase 6 (publish is Phase 6 anyway).

**Missing dependencies with fallback:**
- All lint/changelog devDeps — added as Wave 0 `npm install --save-dev` tasks.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 5 |
|-----------|------------------|
| TypeScript 5.x strict, public RHF APIs | README/API.md examples must use typed patterns; no `as any` in new code |
| Cross-platform Web + React Native (runtime detection) | Quickstart must show both web and RN variants (D-04 already requires this) |
| `@adexdsamson` scope | All install examples use `@adexdsamson/forge` |
| Conventional commits | `commit-and-tag-version` is consistent with this |
| Keep runtime light — externalize React/RHF as peers | README install instructions must show `react` + `react-hook-form` as required peer installs |
| `package-lock.json` committed, use npm | All CI commands use `npm ci`, not `yarn install`; `package.json` scripts use `npm run` |
| GSD workflow enforcement | All edits through GSD execute-phase workflow |

---

## Sources

### Primary (HIGH confidence)
- `src/index.ts`, `src/types.ts`, `src/useForge/useForge.tsx`, `src/reactNative.ts` — verified exported public symbols [VERIFIED: file reads this session]
- `package.json` — verified current scripts, devDeps, version, publishConfig, repository URL [VERIFIED: file read this session]
- `.github/workflows/publish.yml` — verified current trigger, steps, missing lint/test gate [VERIFIED: file read this session]
- `vitest.config.ts` — verified test command and coverage thresholds [VERIFIED: file read this session]
- `LICENSE` — verified MIT text correct [VERIFIED: file read this session]
- `git tag -l` — confirmed zero release tags in repo [VERIFIED: git command this session]
- npm registry via `npm view` — all package versions confirmed [VERIFIED: npm registry]
- `git ls-remote` — SHA pins for `actions/checkout` and `actions/setup-node` [VERIFIED: git ls-remote this session]

### Secondary (MEDIUM confidence)
- [typescript-eslint.io/getting-started](https://typescript-eslint.io/getting-started/) — minimal flat config setup [CITED: official docs]
- [docs.npmjs.com/generating-provenance-statements](https://docs.npmjs.com/generating-provenance-statements/) — provenance requirements [CITED: official docs]
- [github.com/absolute-version/commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) — skip lifecycle flags, first-release behavior [CITED: official README]

### Tertiary (LOW confidence)
- WebSearch result on `eslint-plugin-react-hooks` flat config (issue #28313 confirmed `flat['recommended-latest']`) — cross-verified via npm view peerDependencies

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via `npm view` this session
- Architecture: HIGH — based entirely on locked CONTEXT.md decisions
- Pitfalls: HIGH — derived from verified tool behaviors and current project state
- SHA pins: HIGH — resolved via `git ls-remote` this session; valid at 2026-05-31

**Research date:** 2026-05-31
**Valid until:** 2026-06-28 (30 days; SHA pins are stable for point releases; npm versions may advance)

---

## RESEARCH COMPLETE
