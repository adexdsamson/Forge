# Changelog

All notable changes will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [1.1.0] - 2026-06-01

### Features

* **Forger / Forge:** new opt-in `forgeSubmit` marker prop for React Native submit buttons — `<TouchableOpacity forgeSubmit>` auto-wires `onPress` to the form's `handleSubmit`, removing the redundant manual `onPress={handleSubmit(onSubmit)}` previously required on native. Web `<button type="submit">` inside `<Forge>` continues to work unchanged. Fully backward compatible (manual wiring still works).

### Documentation

* **AGENTS.md:** authoritative LLM / AI-coding-agent usage guide at the repo root — mental model, the public-export reference, copy-paste recipes (web, React Native, field arrays, persistence, wizard, transforms, schema resolvers, standalone validation), and a "Common Mistakes" section covering predictable API pitfalls.
* **llms.txt / llms-full.txt:** machine-discoverable documentation index (per llmstxt.org) and a single-file consolidated reference.
* **TSDoc:** inline documentation added to all public exports, now carried in the shipped `dist/index.d.ts` type declarations.

## [1.0.0] - 2026-06-01

### Features

* **useForge / Forge / Forger:** initial open-source release — cross-platform React form library wrapping react-hook-form with a streamlined composable API (web + React Native, runtime detection)
* **Forge:** renders a real `<form>` on web and a Fragment on React Native; wizard multi-step mode with `handleNext` / `handlePrevious` / `handleWizardSubmit`
* **useForge:** `onSubmit` is optional; `noValidate` prop supported; augments RHF `control` with `hasFields`, wizard state, and navigation helpers
* **usePersist:** reactive persistence hook — subscribes to form state changes via `useWatch` + `useFormState`; handler receives `(values, { isDirty, isValid })`
* **useFieldArray:** decorate-on-top field-array management preserving per-item `inputProps` across `append` / `remove` / `insert` / `swap` / `update`
* **useForgeValues:** thin public-API wrapper exposing `getValue`, `setValue`, `getValues` without accessing RHF internals
* **Forger:** `deepEqual`-based memoization replaces lodash `isEqual`; `component` typed as `React.ElementType` for cross-platform compatibility
* **control augmentation:** `Object.assign`-based in-place control augmentation returns the same RHF instance typed as `ForgeControl<T>`
* **devtools:** `@hookform/devtools` dev-gate via synchronous guarded `require` — excluded from production bundle

### Bug Fixes

* **field arrays:** preserve index alignment in field-array root errors
* **field arrays:** phantom array error, dead import, and false string value types resolved
* **Forger / Slot:** layered fail-fast child errors; `updateFieldArrayRootError` canonical in `logic/` (removed utils.ts duplicate)
* **wizard:** `onFormSubmit` guard, imperative handle correctness, and memoized submit callback
