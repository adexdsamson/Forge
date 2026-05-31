# Phase 4: Packaging - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 3 (2 modified, 1 new)
**Analogs found:** 0 / 3 (config files — no in-repo analogs apply; current state documented below)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | n/a | none | no-analog (config) |
| `.github/workflows/publish.yml` | config/CI | n/a | none | no-analog (config) |
| `LICENSE` | legal text | n/a | none | no-analog (new boilerplate) |

---

## Pattern Assignments

### `package.json` (config — edit in place)

No analog. Document the **exact current state** of every field that decisions D-02, D-05, D-09 require changing, so the executor edits precisely.

#### Current `publishConfig` (lines 26-28) — MUST REPLACE (D-02)

```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com/adexdsamson"
}
```

Replace entirely with:

```json
"publishConfig": {
  "registry": "https://registry.npmjs.org",
  "access": "public"
}
```

#### Current `scripts` block (lines 15-21) — ADD `prepack` (D-05)

```json
"scripts": {
  "build": "rollup -c",
  "rollup": "rollup -c",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --coverage",
  "test:watch": "vitest"
}
```

Add `"prepack": "npm run build"` as the first entry (runs before both `npm pack` and `npm publish`). Do not remove or rename the existing `build` script — `prepack` delegates to it.

Target state:

```json
"scripts": {
  "prepack": "npm run build",
  "build": "rollup -c",
  "rollup": "rollup -c",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --coverage",
  "test:watch": "vitest"
}
```

#### Current `author` (line 38) — EXPAND TO OBJECT (D-09)

```json
"author": "adexdsamson"
```

Expand to object form. Email is at the executor's discretion — do NOT insert a personal email into the public manifest without explicit user confirmation. Exact GitHub profile URL is at Claude's discretion (D-03 discretion clause). Target shape:

```json
"author": {
  "name": "adexdsamson",
  "url": "https://github.com/adexdsamson"
}
```

#### Fields to ADD — `sideEffects` and `engines` (D-09)

Neither field exists in the current `package.json`. Both must be added.

`sideEffects: false` — insert at the top level, near `license` (conventional placement for bundler metadata):

```json
"sideEffects": false
```

`engines` — insert at the top level (conventional placement after `license` or after `bugs`):

```json
"engines": {
  "node": ">=18"
}
```

#### Fields confirmed correct — DO NOT TOUCH

| Field | Current value | Status |
|-------|--------------|--------|
| `name` | `"@adexdsamson/forge"` | correct |
| `version` | `"1.0.3"` | frozen — Phase 6 owns version bump |
| `description` | present, accurate | correct |
| `license` | `"MIT"` | correct |
| `files` | `["dist"]` | correct — do not modify (D-06/D-08) |
| `exports` map | CJS + ESM + types | correct |
| `main` / `module` / `types` | point to `dist/` | correct |
| `keywords` | 7-item array | acceptable; minor tuning at executor discretion |
| `repository` / `homepage` / `bugs` | GitHub URLs | correct |
| `peerDependencies` | react + rhf | correct |
| `type` | absent | intentional — do NOT add (D-10) |
| `private` | absent | correct (must stay absent for publish) |

---

### `.github/workflows/publish.yml` (config/CI — edit in place)

No analog. Document the **exact current state** of the publish step so the executor removes precisely one field.

#### Current publish step (lines 27-32) — REMOVE `working-directory` (D-04)

```yaml
      - name: publish
        run: npm publish --access public
        working-directory: dist

        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_ACCESS_TOKEN}}
```

Remove the `working-directory: dist` line only. All other fields remain unchanged. Target state:

```yaml
      - name: publish
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_ACCESS_TOKEN}}
```

#### Fields confirmed correct — DO NOT TOUCH

| Field | Current value | Status |
|-------|--------------|--------|
| `registry-url` (node step) | `https://registry.npmjs.org` | already correct — matches D-01 |
| `node-version` | `20` | correct |
| `--access public` flag | present | correct |
| `NPM_ACCESS_TOKEN` secret reference | present | correct |
| Trigger (`push: branches: [main]`) | present | correct — Phase 5 owns trigger rework |
| SHA pinning (`@v3`) | not pinned | known concern — Phase 5 owns hardening |

---

### `LICENSE` (new file — no in-repo analog)

No in-repo analog exists. `LICENSE` does not currently exist at the repo root (confirmed absent).

The `package.json` already declares `"license": "MIT"`. This file makes that declaration legally effective by including the full license text.

**Pattern source:** Standard MIT License boilerplate (SPDX `MIT`). No existing file in this repo to copy from.

**Required content shape:**

```
MIT License

Copyright (c) <YEAR> adexdsamson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Replace `<YEAR>` with the current year (`2026`). Copyright name is `adexdsamson` per D-11. npm auto-includes this file in the tarball without any `files` entry change needed.

---

## Shared Patterns

None. This is a configuration-only phase. There are no cross-cutting code patterns (auth, error handling, validation) to extract. The only shared constraint is:

- **Do not touch source files** (`src/`, `rollup.config.mjs`, `tsconfig.json`) — Phase 4 scope is limited to `package.json`, `.github/workflows/publish.yml`, and `LICENSE`.

---

## PKG-03 Dist Hygiene Confirmation

**`.gitignore` current content (all 5 lines):**

```
node_modules
dist
*.log
.DS_Store
coverage/
```

`dist` is on line 2 — gitignored. `git ls-files dist/` returns no output (0 tracked dist files). PKG-03 is satisfied as a baseline. The executor should treat this as a **confirmation check** during plan execution, not greenfield work.

---

## Build System Confirmation (rollup.config.mjs — read-only)

`rollup.config.mjs` confirms:
- Input: `src/index.ts`
- Outputs: `dist/index.cjs.js` (CJS, sourcemap), `dist/index.esm.js` (ESM, sourcemap), `dist/index.d.ts` (dts)
- All peer deps + `react-dom` / `react/jsx-runtime` / `@hookform/devtools` / `react-dropzone` are externalized

This is what `prepack` invokes via `npm run build`. No changes to this file are needed or permitted in Phase 4.

---

## No Analog Found

All three Phase 4 files fall into this category — this is a configuration phase, not a feature phase:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `package.json` | config | n/a | Config files have no code-pattern analogs; current state is fully documented above |
| `.github/workflows/publish.yml` | CI config | n/a | No other workflow files in `.github/workflows/`; current state fully documented above |
| `LICENSE` | legal boilerplate | n/a | No license file exists yet; content is standard MIT text, not derived from any in-repo file |

---

## Metadata

**Analog search scope:** `.github/workflows/`, repo root, `.planning/`
**Files scanned:** 5 (`package.json`, `.github/workflows/publish.yml`, `.gitignore`, `rollup.config.mjs`, `tsconfig.json`)
**Pattern extraction date:** 2026-05-31
