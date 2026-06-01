# Design: LLM-friendly Forge (unreleased v1.1)

**Date:** 2026-06-01
**Status:** Approved — ready for /gsd-quick execution
**Scope:** Unreleased v1.1 docs/types work. No version bump, no publish.

## Goal

Make `@adexdsamson/forge` easy for LLMs and AI coding agents to understand and use *correctly* — serving both in-project coding agents (Claude Code / Cursor / Copilot) and chat LLMs answering "how do I use Forge". The emphasis is on eliminating the predictable, recurring ways LLMs get the API wrong.

## Approach

"AGENTS.md is the brain, llms.txt is the map, TSDoc is the inline net." Single source of truth for failure-mode content (AGENTS.md) to avoid drift across the now-six doc surfaces (README, docs/API.md, examples, + these three).

## Artifacts

### 1. `AGENTS.md` (repo root) — authoritative LLM usage guide

- **What Forge is** (3–4 sentences) + mental model: `useForge()` → `<Forge control>` → `<Forger>` wraps any custom input. Cross-platform via runtime detection (web + React Native).
- **The 8 exports**, one line + minimal signature each: `useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist, useSubscribe, validateField`.
- **Recipes** (copy-paste, web + RN): basic web form; RN form with `forgeSubmit`; `useFieldArray`; `usePersist`; wizard multi-step; `transform`; schema `resolver` (zod/yup); standalone `validateField`.
- **Common Mistakes (do NOT → do)** — the high-value core:
  1. RN native props go **directly on `<Forger>`** (`keyboardType=`, `multiline=`, `secureTextEntry=`), NOT via an inert `reactNative={{}}` prop (ForgerController spreads `...rest` onto the component; there is no `reactNative` key).
  2. Every input needs a **`name`** — nameless inputs fail Forge's input name-guard (`isInputSlot`) and are not wired.
  3. RN submit: `<TouchableOpacity forgeSubmit>` auto-wires `onPress`; do NOT hand-wire `onPress={handleSubmit(onSubmit)}` (works but redundant). Web: a `<button type="submit">` inside `<Forge>` just works (real `<form>`).
  4. `<Forge>` renders a real `<form>` on web and a `Fragment` on RN — do not expect a wrapping element / `className` on native.
  5. `transform` is `{ input, output }` — `output` transforms before writing to RHF, `input` transforms before passing to the component.
  6. Fields rendered **outside** `<Forge>` must receive `control` as a prop (Forger falls back to the `control` prop when there is no FormProvider context).
  7. `usePersist` handler fires on mount (drain the initial emission); `getValue` throws a named error on an unknown field.

### 2. `llms.txt` (repo root) — llmstxt.org index

One-paragraph intro + curated link list (README, `docs/API.md`, `AGENTS.md`, `examples/ReactNativeExample.md`, `CHANGELOG.md`), each with a one-line description.

### 3. `llms-full.txt` (repo root) — single "paste-the-whole-thing" file

`AGENTS.md` body + a condensed API signature table. Assembled from AGENTS.md content (no independent copy of the gotchas → no drift).

### 4. TSDoc on the public API

Concise `/** */` on each exported symbol in `src/` so `dist/index.d.ts` carries inline usage + its one-line gotcha (e.g. on `Forger`: "RN: pass native props directly, not via `reactNative={{}}`"). This is the only artifact in-project agents read from `node_modules`.

## DRY / source of truth

- Failure-modes & recipes: **AGENTS.md** (once).
- Long-form human API reference: **docs/API.md** (unchanged).
- `llms-full.txt`: assembled from AGENTS.md + condensed API table.
- TSDoc: one-line gotchas pointing the same direction as AGENTS.md.

## Distribution

- Markdown (`AGENTS.md`, `llms.txt`, `llms-full.txt`): repo-root — web-discoverable and agent-fetchable.
- TSDoc: ships automatically inside `dist/index.d.ts`.
- NOT added to `package.json` `files[]` for now (revisit if in-`node_modules` discovery is wanted).

## Verification

- `npx tsc --noEmit` exit 0, `npm run lint` exit 0, `npm test` green (TSDoc edits touch source).
- Doc accuracy spot-checked against the real exports in `src/index.ts` (all 8 present) and the actual prop/behavior surface.
- Windows vitest cold-run flakiness: re-run before trusting.

## Out of scope (deferred)

- Hosted docs site / true `forge.dev/llms.txt`.
- Build-step generation of `llms-full.txt`.
- Shipping the `.txt` files in the npm tarball.
- Version bump / publish (this is unreleased v1.1; ships in a future 1.1.0 release cycle).
