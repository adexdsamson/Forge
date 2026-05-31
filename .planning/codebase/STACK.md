# Technology Stack

**Analysis Date:** 2026-05-31

## Languages

**Primary:**
- TypeScript 5.3.3 — all source files under `src/`; strict mode enabled

**Secondary:**
- JavaScript (ESM) — `rollup.config.mjs` build config only

## Runtime

**Environment:**
- Node.js 20 (pinned in CI via `actions/setup-node@v3` with `node-version: 20` in `.github/workflows/publish.yml`)
- No `.nvmrc` or `.node-version` file present in the repo root; version is enforced only in CI

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (committed)

## Frameworks

**Core:**
- React 18 (`react@^18.2.0` peer dep, `^18.2.0` in devDependencies) — JSX transform via `react-jsx` (`tsconfig.json` `"jsx": "react-jsx"`)
- react-hook-form 7.x (`^7.50.1`) — peer dependency; this library is a thin orchestration wrapper around it

**Build/Dev:**
- Rollup 4.x (`^4.12.0`) — dual-output bundler, configured in `rollup.config.mjs`
- TypeScript compiler (`tsc`) — used only for `typecheck` (`tsc --noEmit`); declaration emit is handled by rollup-plugin-dts

## Key Dependencies

### Runtime (`dependencies` — bundled into dist or expected at consumer install time)

| Package | Version | Notes |
|---------|---------|-------|
| `@hookform/devtools` | `^4.3.1` | **Hard-imported** at the top of `src/Forge/Forge.tsx` as `import { DevTool } from "@hookform/devtools"`. Rendered unconditionally when `debug={true}`. This is a **dev/debug-only tool being shipped as a runtime dependency** — it will bloat consumers' bundles unless tree-shaken. See Concerns. |
| `lodash` | `^4.17.21` | **Runtime dependency** used throughout: `isUndefined`, `isObject`, `isString`, `isNumber`, `isEqual`, `isBoolean`, `isFunction` imported in `src/utils.ts`, `src/Forger/Forger.tsx`, `src/validateField.ts`, `src/useForgeValues/useForgeValues.tsx`, `src/logic/getDirtyFields.ts`. Full lodash, not `lodash-es`. |

### Peer Dependencies (consumer must supply)

| Package | Version | Required |
|---------|---------|---------|
| `react` | `>=18` | Required |
| `react-hook-form` | `^7.50.1` | Required |
| `react-dropzone` | (any) | Optional (`peerDependenciesMeta.react-dropzone.optional: true`) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `rollup` | `^4.12.0` | Build bundler |
| `rollup-plugin-dts` | `^6.1.0` | Generates `dist/index.d.ts` from TypeScript source |
| `@rollup/plugin-typescript` | `^11.1.6` | TS → JS transpilation inside Rollup |
| `@rollup/plugin-commonjs` | `^25.0.7` | Converts CJS deps to ESM within bundle |
| `@rollup/plugin-node-resolve` | `^15.2.3` | Resolves node_modules for bundling |
| `typescript` | `^5.3.3` | Type checking (`tsc --noEmit`) and type source |
| `tslib` | `^2.6.2` | TypeScript helper functions (reduces output size) |
| `react` | `^18.2.0` | Available locally for type resolution |
| `react-dom` | `^18.2.0` | Available locally for type resolution |
| `react-dropzone` | `^14.2.3` | Available locally; typed usage in `src/types.ts` (`import { Accept } from "react-dropzone"`) |
| `@types/react` | `^18.2.55` | React type definitions |
| `@types/lodash` | `^4.14.202` | Lodash type definitions |

## Module Output Format

The build produces **three output artifacts** under `dist/`, all from the single entry `src/index.ts`:

| File | Format | Field in `package.json` |
|------|--------|------------------------|
| `dist/index.cjs.js` | CommonJS (CJS) | `"main"` |
| `dist/index.esm.js` | ES Module (ESM) | `"module"` |
| `dist/index.d.ts` | TypeScript declarations | `"types"` |

### `exports` map (`package.json`)

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.esm.js",
    "require": "./dist/index.cjs.js"
  }
}
```

Modern bundlers and Node resolve via `exports`, falling back to `main`/`module` for older tooling.

### Build process (`rollup.config.mjs`)

Two Rollup passes over the same input:

**Pass 1 — JS output**
- Plugins: `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, `@rollup/plugin-typescript`
- Outputs: CJS + ESM both with `sourcemap: true`
- `declaration: false` on the typescript plugin (declarations handled separately)

**Pass 2 — Declaration output**
- Plugin: `rollup-plugin-dts`
- Output: `dist/index.d.ts` in ESM format

**External policy:** All `dependencies` and `peerDependencies` plus `react-dropzone`, `react-dom`, and `react/jsx-runtime` are marked external via:
```js
const isExternal = (id) =>
  external.some((dep) => id === dep || id.startsWith(`${dep}/`));
```
This means `@hookform/devtools` and `lodash` are listed as external and **not bundled** — consumers must install them. However, because they live in `dependencies`, npm will install them automatically. The `react-dropzone` import in `src/types.ts` (type-only, `Accept`) is also external.

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler config; target ES2019, moduleResolution `node`, strict mode, lib includes DOM (web-first) |
| `rollup.config.mjs` | Rollup bundler config — dual CJS+ESM output + dts |
| `package.json` | Package metadata, scripts, dependency declarations, `exports` map, `publishConfig` |

## TypeScript Configuration Details

```json
{
  "target": "ES2019",
  "module": "ESNext",
  "moduleResolution": "node",
  "jsx": "react-jsx",
  "lib": ["ES2019", "DOM", "DOM.Iterable"],
  "strict": true
}
```

- **`lib: ["DOM"]`** — includes browser DOM types. The library also supports React Native but does NOT include RN types in tsconfig. RN is supported via runtime feature detection only (see below).
- **`moduleResolution: "node"`** — legacy resolver; not `bundler` or `node16`. No path aliases configured.

## React Native Support Model

The library does **not** import `react-native` as a package. RN support is entirely via runtime environment detection in `src/utils.ts`:

```ts
export const isWeb =
  typeof window !== "undefined" &&
  typeof window.HTMLElement !== "undefined" &&
  typeof document !== "undefined";

export const isReactNative =
  !isWeb &&
  typeof navigator !== "undefined" &&
  navigator.product === "ReactNative";
```

These boolean constants (`isWeb`, `isReactNative`, `isMobile`) are exported from `src/index.ts` and used throughout:
- `src/Forge/Forge.tsx` — platform routing for `isRNMode`
- `src/Forger/Forger.tsx` — RN-specific event handler wiring (`onChangeText`, `onValueChange`)
- `src/validateField.ts` — `setCustomValidity` uses `setNativeProps` on RN, `reportValidity` on web
- `src/reactNative.ts` — platform-specific event/value prop name mappings, helpers
- `src/utils.ts` — `cloneObject` guards `Blob`/`FileList` (web) vs `uri`/`_dispatchInstances` (RN)

Because there is no `react-native` import, a single bundle runs in both environments; only the runtime detection branches differ. This also means RN-specific types (e.g., `TextInput` props) are typed as `any` — no `@types/react-native` installed.

## CI / Publish Pipeline

File: `.github/workflows/publish.yml`

- Trigger: push to `main` branch or manual dispatch
- Runner: `ubuntu-latest`
- Node: 20
- Publish command: `npm publish --access public` run from the **`dist/` directory** (not the project root)
- Registry: `https://registry.npmjs.org` (overrides the `publishConfig` in `package.json` which points to GitHub Package Registry)
- Auth: `NODE_AUTH_TOKEN` from `secrets.NPM_ACCESS_TOKEN`

> Note: `package.json` sets `"publishConfig.registry": "https://npm.pkg.github.com/adexdsamson"` (GitHub Packages), but the workflow overrides the registry to npmjs.org via `actions/setup-node`. The `package.json` name `@adexdsamson/forge` is a scoped package.

## Platform Requirements

**Development:**
- Node.js 20+
- npm (lockfile present)
- No test runner configured; no test scripts in `package.json`

**Production/Consumer:**
- React >= 18
- react-hook-form ^7.50.1
- Optionally: react-dropzone (for file input accept types)

---

## MAPPING COMPLETE
