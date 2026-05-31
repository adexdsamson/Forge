# Phase 4: Packaging - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the npm package artifact correct and publish-ready: accurate `package.json` metadata, working entry points with a build-before-publish hook, clean `dist/` hygiene, a shipped license, and a single settled registry target. Requirements: **PKG-01, PKG-02, PKG-03, PKG-04**.

**In scope:** package.json correctness + polish, `prepack` build hook, publish model (publish-from-root), tarball contents + verification, settling the registry to public npm and making `publishConfig` consistent with it, adding a `LICENSE` file.

**Out of scope (belongs to Phase 5 — Docs & CI):** full CI workflow rebuild (SHA-pinning, lint/test gating, release-event trigger), README content rewrite, CHANGELOG creation, lint tooling. Phase 4 only touches CI to the minimum needed for registry/publish-model consistency (drop `working-directory: dist`). Version bump / release number belongs to Phase 6 — Publish.

</domain>

<decisions>
## Implementation Decisions

### Registry target (PKG-04)
- **D-01:** Publish to **public npm** (`registry.npmjs.org`), not GitHub Packages. Rationale: GitHub Packages requires every consumer to add an authenticated `.npmrc` to install even a public package — direct friction against the core value ("install and build a form in minutes"). Public npm installs with zero config and matches the existing CI (`NPM_ACCESS_TOKEN`, `--access public`).
- **D-02:** Encode it explicitly: `publishConfig: { "registry": "https://registry.npmjs.org", "access": "public" }`. Self-documenting, guarantees the scoped `@adexdsamson/forge` package publishes publicly, and won't inherit a stale `.npmrc`. The existing `publishConfig.registry` pointing at `https://npm.pkg.github.com/adexdsamson` must be **replaced**.
- **D-03:** Log this decision in `PROJECT.md` Key Decisions (PKG-04 success criterion requires the choice be documented). The existing "Publish target deferred to Packaging/Publish phase" row resolves to "Public npm".

### Build + publish model (PKG-02)
- **D-04:** **Publish from the repo root**, not from `dist/`. `files: ["dist"]` controls the tarball and the entry points already point at `dist/`. The current CI step `working-directory: dist` is wrong (dist has no `package.json`) and must be **removed** so publish runs at root.
- **D-05:** Add a **`prepack`** script that runs `rollup -c` (the existing `build` script) to rebuild `dist/` fresh before both `npm pack` and `npm publish`. Chosen over `prepublishOnly` because it also guarantees a fresh build for `npm pack` verification (PKG-02 success criterion) and for the smoke test. Because CI publishes from root, `prepack` also fixes CI's current missing-build-step problem with no separate CI build edit needed.

### Tarball contents + verification (PKG-02, PKG-03)
- **D-06:** Keep `files: ["dist"]` as-is so Rollup's sourcemaps (`*.js.map`) **ship** in the tarball — better consumer debugging into Forge; modest size cost is acceptable. npm auto-includes `package.json`, `README.md`, and `LICENSE`.
- **D-07:** Verify entry points + types with a **full fresh-project smoke test**, done manually during execution (not committed as a permanent test): `npm pack` → install the tarball into a throwaway TypeScript project → `import { useForge, Forge, Forger } from "@adexdsamson/forge"` → run `tsc` and confirm types resolve with no manual path config. `npm pack --dry-run` listing of `main`/`module`/`types` is a necessary-but-insufficient sub-check.
- **D-08:** No `.npmignore` exists and none should be added — `files: ["dist"]` is the single authoritative include list.

### Metadata polish (PKG-01)
- **D-09:** PKG-01 required fields are already present (`name @adexdsamson/forge`, `description`, `keywords`, `repository`, `homepage`, `author`, `license: MIT`, no `private`). Apply these **additional** polish items:
  - `sideEffects: false` — lets consumer bundlers tree-shake unused exports (aligns with the "keep runtime light" constraint; safe because Forge is pure exports).
  - `author` expanded from the string `"adexdsamson"` to an **object** `{ name, url }` (GitHub profile URL). Email is at the user's discretion — do NOT auto-insert a personal email into the public manifest without explicit confirmation.
  - `engines` field with `node >=18`.
- **D-10:** Do **not** add a `type` field — leaving it unset (defaults to commonjs) avoids breaking the `require`/`import` resolution that the `exports` map already handles correctly.

### License (PKG-01, packaging completeness)
- **D-11:** Add a standard **MIT `LICENSE` file** (copyright `adexdsamson`) at the repo root in **this phase**, even though Phase 5 (DOCS-03) is scoped to "LICENSE reflects the correct project." Rationale: a "publish-ready" artifact must ship its declared license text. Phase 5 may still refine wording, but the file must exist now so the tarball is legally complete.

### Claude's Discretion
- Exact `keywords` list may be tuned during execution if obviously beneficial; the existing set is acceptable.
- Exact GitHub profile URL string for the `author` object.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external ADRs/specs exist for this phase — packaging decisions are fully captured in `<decisions>` above. The relevant artifacts to read and modify are project files:

### Files to modify
- `package.json` — `publishConfig` (D-02), `scripts.prepack` (D-05), `sideEffects`/`author`/`engines` (D-09/D-10). Currently has GitHub-Packages `publishConfig`, no `prepack`, string `author`, version `1.0.3`.
- `.github/workflows/publish.yml` — remove `working-directory: dist` (D-04). `registry-url` already `https://registry.npmjs.org` and matches D-01. (Deeper CI rework is Phase 5 — do NOT touch trigger, SHA-pinning, or gating here.)
- `LICENSE` (new file) — MIT, copyright adexdsamson (D-11).

### Files to read (do not modify)
- `rollup.config.mjs` — defines the `build` (`rollup -c`) that `prepack` will invoke; confirms dual CJS+ESM+dts output with `sourcemap: true` (D-06).
- `.gitignore` — already ignores `dist`; confirms PKG-03 dist hygiene is satisfied (0 dist files tracked).
- `tsconfig.json` — TypeScript config the consumer smoke test (D-07) implicitly validates against.

### Project decision record
- `.planning/PROJECT.md` §Key Decisions — the "Publish target deferred" row must be updated to "Public npm" (D-03).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts.build` (`rollup -c`) — already wired; `prepack` (D-05) should call it (e.g. `"prepack": "npm run build"` or `"prepack": "rollup -c"`) rather than duplicating the rollup invocation.
- `files: ["dist"]` and the `exports` map are already correctly structured — Phase 4 refines around them, it does not rebuild them.

### Established Patterns
- **PKG-01 and PKG-03 are already largely satisfied** by the current `package.json`/`.gitignore` (verified during scout): name/description/keywords/repository/homepage/author/license present, no `private`; `dist` gitignored with 0 tracked dist files; `files: ["dist"]` set. Planner should treat these as polish/confirmation, not greenfield work.
- A built `dist/` exists locally — `npm pack --dry-run` already produces a ~30 KB tarball (`README.md` + `dist/{index.cjs.js,index.esm.js,index.d.ts}` + their `.map` + `package.json`). Use this as the verification baseline.

### Integration Points
- `prepack` build hook (D-05) is the seam that makes both local `npm pack`/`npm publish` AND the Phase-5 CI publish produce fresh artifacts from source.
- `publishConfig` (package.json) + `registry-url` (CI workflow) are the two ends that PKG-04 requires to agree — both resolve to npmjs.org under D-01.

</code_context>

<specifics>
## Specific Ideas

- The headline gotcha to fix: CI publishes with `working-directory: dist` against a package whose modern setup expects publish-from-root — this contradiction is the practical core of PKG-02/PKG-04.
- Verification must be experiential (real consumer project + `tsc`), not just a dry-run listing — the user explicitly wanted proof that types resolve without manual path config.

</specifics>

<deferred>
## Deferred Ideas

- **Version bump / release number** — `package.json` version is `1.0.3` (orbipayx-extraction leftover). Phase 4 does NOT touch it; deciding the first-publish version and creating the matching git tag belongs to **Phase 6 — Publish**.
- **Full CI workflow hardening** — SHA-pinning the publish action, gating publish on lint+test, switching the trigger to release events, adding `--provenance` — all belong to **Phase 5 — Docs & CI** (CICD-02/CICD-03). Phase 4 only removes `working-directory: dist`.
- **README content rewrite + CHANGELOG creation** — **Phase 5** (DOCS-01/DOCS-03). Phase 4 ships whatever README currently exists in the tarball.

</deferred>

---

*Phase: 4-Packaging*
*Context gathered: 2026-05-31*
