# Phase 4: Packaging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 4-Packaging
**Areas discussed:** Registry target, Build + publish model, Tarball contents + verify, Metadata polish, LICENSE, Version handling

---

## Registry target (PKG-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Public npm | registry.npmjs.org; zero-config install; matches existing CI + NPM_ACCESS_TOKEN | ✓ |
| GitHub Packages | npm.pkg.github.com; keeps current publishConfig but requires authenticated .npmrc for every consumer | |

**User's choice:** Public npm
**Notes:** Resolves the publishConfig (GitHub Packages) vs CI (npmjs.org) conflict that PROJECT.md explicitly deferred to this phase. Friction-free install aligns with the "install in minutes" core value.

### publishConfig encoding

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit registry + access | `publishConfig: { registry: "https://registry.npmjs.org", access: "public" }`; self-documenting; logged in PROJECT.md | ✓ |
| Remove publishConfig entirely | Rely on npm default + CI `--access public`; intent lives only in CI | |

**User's choice:** Explicit registry + access
**Notes:** Decision to also be logged in PROJECT.md Key Decisions per PKG-04 success criterion.

---

## Build + publish model (PKG-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Publish from repo root | files:["dist"] controls tarball; entry points point at dist/; standard | ✓ |
| Keep publishing from dist/ | Generate package.json into dist/ and publish there; non-standard | |

**User's choice:** Publish from repo root
**Notes:** Requires removing `working-directory: dist` from the CI publish step.

### Build-before-publish hook

| Option | Description | Selected |
|--------|-------------|----------|
| prepack | Builds before both npm pack and npm publish; covers verification + CI freshness | ✓ |
| prepublishOnly | Builds only on npm publish; pack verification won't auto-rebuild | |
| Both / belt-and-suspenders | prepack build + prepublishOnly guard (typecheck/test) | |

**User's choice:** prepack
**Notes:** Also resolves CI's current missing-build-step problem since publish runs from root.

---

## Tarball contents + verify (PKG-02, PKG-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Ship sourcemaps | Keep files:["dist"]; *.js.map ships; better consumer debugging | ✓ |
| Exclude sourcemaps | files glob / .npmignore to drop *.map; leaner tarball | |

**User's choice:** Ship sourcemaps

### Verification depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full fresh-project smoke test | npm pack → install into throwaway TS project → import + tsc; manual, not committed | ✓ |
| npm pack --dry-run inspection only | Verify entries listed; weaker evidence | |
| Committed install-test script | Reusable scripts/verify-pack; CI wiring leans into Phase 5 | |

**User's choice:** Full fresh-project smoke test

---

## Metadata polish (PKG-01)

| Option | Description | Selected |
|--------|-------------|----------|
| sideEffects: false | Enables consumer tree-shaking; safe for pure-export lib | ✓ |
| author as object | Expand to { name, url } | ✓ |
| engines field | node >=18 install-time guidance | ✓ |
| Keep minimal | Add none; required fields already satisfy PKG-01 | |

**User's choice:** sideEffects: false + author as object + engines field (multi-select)
**Notes:** `type` field deliberately NOT added (exports map already handles resolution). Personal email not auto-inserted into author object without explicit confirmation.

---

## LICENSE (added gray area)

| Option | Description | Selected |
|--------|-------------|----------|
| Add LICENSE now in Phase 4 | Standard MIT file (copyright adexdsamson); tarball legally complete | ✓ |
| Defer LICENSE to Phase 5 | Leave to DOCS-03; strict phase boundary but ships no license until Phase 5 | |

**User's choice:** Add LICENSE now in Phase 4
**Notes:** Surfaced during exploration — package declares MIT but no LICENSE file exists, so the tarball currently ships no license text. Phase 5 may still refine wording.

---

## Version handling (added gray area)

| Option | Description | Selected |
|--------|-------------|----------|
| Leave version to Phase 6 | Release number + git tag decided at Publish; note as deferred | ✓ |
| Reset baseline now | Set deliberate pre-publish version (0.1.0 / 1.0.0) in Phase 4 | |

**User's choice:** Leave version to Phase 6
**Notes:** Current version 1.0.3 is an orbipayx-extraction leftover; Phase 4 does not touch it.

---

## Claude's Discretion

- Exact `keywords` tuning (existing set acceptable).
- Exact GitHub profile URL string for the `author` object.

## Deferred Ideas

- Version bump / first-publish release number + git tag → Phase 6 (Publish).
- Full CI hardening (SHA-pinning, lint/test gating, release trigger, --provenance) → Phase 5 (CICD-02/03).
- README content rewrite + CHANGELOG creation → Phase 5 (DOCS-01/03).
