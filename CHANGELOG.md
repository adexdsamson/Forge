# Changelog

All notable changes will be documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
