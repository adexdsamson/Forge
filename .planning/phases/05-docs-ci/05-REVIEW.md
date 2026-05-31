---
phase: 05-docs-ci
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .github/workflows/ci.yml
  - .github/workflows/publish.yml
  - docs/API.md
  - examples/ReactNativeExample.md
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed two GitHub Actions workflows and two documentation/example files. The
workflows are in good shape: both third-party actions are SHA-pinned with
version comments, `publish.yml` declares least-privilege `permissions`, secrets
are scoped to the publish step only, and no `${{ }}` interpolation is injected
into `run:` shell bodies. The npm scripts referenced by CI (`lint`, `test`) both
exist in `package.json`.

The documentation, however, contains multiple factual inaccuracies against the
actual public API. The most serious: `docs/API.md` documents `validateField` as
a default export of `@adexdsamson/forge`, but `src/index.ts` never re-exports it
— consumers following the doc get an import that resolves to `undefined`. The
React Native example uses a `reactNative={{ ... }}` prop on every `<Forger>` that
the library does not consume, so all the native input options it nests there are
silently dropped (or spread onto the DOM/native node as an invalid prop). Per
the review instructions, doc/code mismatches are classified as Warnings except
where the documented symbol does not exist at all (Critical, because following
the doc produces broken consumer code).

## Critical Issues

### CR-01: `validateField` documented as a public export but is not exported from the package

**File:** `docs/API.md:391-416` (and Table of Contents entry at `docs/API.md:19`)
**Issue:** The "validateField" section documents an import and usage:
```ts
import validateField from '@adexdsamson/forge';
```
and states "`validateField` is the default export from the module and re-exported
from `@adexdsamson/forge`." This is false. `src/index.ts` (lines 1-19) only
wildcard/named-exports `Forge`, `Forger`, `useForge`, `usePersist`,
`useFieldArray`, `useForgeValues`, `./types`, `./reactNative`, and a named list
of `utils` booleans/guards. `src/validateField.ts:126` declares
`export default async <T>(...)`, but that module is never re-exported by
`src/index.ts`. There is also no default export on the package barrel at all, so
`import validateField from '@adexdsamson/forge'` resolves to `undefined` and any
call throws `TypeError: validateField is not a function`. A consumer following
this doc verbatim ships broken code.
**Fix:** Either (a) remove the `validateField` section + ToC entry from
`docs/API.md` since the symbol is intentionally internal (the section itself says
"This is an internal-use function"), or (b) actually export it from
`src/index.ts` and document the real import shape, e.g.:
```ts
// src/index.ts
export { default as validateField } from './validateField';
```
```ts
// then in API.md
import { validateField } from '@adexdsamson/forge';
```
Do not document a default export — the barrel has none. Pick one approach; do not
leave the doc claiming an export that does not exist.

## Warnings

### WR-01: React Native example passes a `reactNative={{...}}` prop that `Forger` does not consume

**File:** `examples/ReactNativeExample.md:184-187, 202-205, 225-229, 242-244, 262-264, 305-309, 322-324`
**Issue:** Every `<Forger>` in the example nests its native input options inside a
`reactNative={{ autoCapitalize, keyboardType, multiline, ... }}` prop. `Forger`
(`src/Forger/Forger.tsx:115-146`) accepts `ForgerProps`, destructures
`rules/transform/methods/component/name/handler` in `ForgerController`
(`Forger.tsx:25`), and spreads everything else (`...rest`) straight onto the
rendered component (`Forger.tsx:71`). There is no handling of a `reactNative` key
and no `mergePlatformProps` call in the Forger path. The result is that
`reactNative` is forwarded as a literal prop to `StyledTextInput`/`<TextInput>`
(an unknown prop, dropped or warned by RN), and the intended options
(`keyboardType`, `autoCapitalize`, `numberOfLines`, etc.) never reach the native
input. The example does not work as written.
**Fix:** Spread the native options directly as props on `<Forger>` (they flow
through `...rest` to the component), e.g.:
```tsx
<Forger
  name="email"
  control={control}
  component={StyledTextInput}
  placeholder="Enter email address"
  rules={validationRules.email}
  keyboardType="email-address"
  autoCapitalize="none"
  autoCorrect={false}
/>
```
If a structured `{ web, reactNative }` split is the intended API, that requires a
code change in `Forger` to call `mergePlatformProps`; until then the example must
not imply a `reactNative` prop exists.

### WR-02: API.md claims `useForgeValues` accesses zero RHF internals, but architecture notes and history conflict — verify the doc's stronger claims

**File:** `docs/API.md:293-296`
**Issue:** The doc states `useForgeValues` is a "Thin wrapper over RHF's public
`setValue`/`getValues` APIs." The current `src/useForgeValues/useForgeValues.tsx`
implementation (lines 58-80) does match that — it uses only `useFormContext`,
`getValues`, `setValue`. However, CLAUDE.md's architecture mapping still describes
`useForgeValues` as directly reading `control._formValues`, `control._fields`,
`control._subjects`, etc., and lists an `executeBuiltInValidation` path that no
longer exists in source. The doc and the code agree; the stale third source
(CLAUDE.md) increases the risk that a future edit re-introduces the private-API
version and the doc silently becomes wrong. The doc also omits the documented
`hasPath` "field not registered until first interaction" limitation
(`useForgeValues.tsx:30-34`) that affects `getValue` throwing behavior.
**Fix:** Add a one-line note to the `useForgeValues` doc reflecting the source
caveat: `getValue` throws for a field that is absent from `getValues()` (a field
with no `defaultValue` that has never been written may be absent until first
interaction). Separately, reconcile the stale CLAUDE.md architecture section in a
follow-up so the three sources do not drift.

### WR-03: API.md documents `useForge` props (`initialStep`) and defaults that do not all match `UseForgeProps`

**File:** `docs/API.md:44, 45`
**Issue:** The doc's `useForge` props table lists `initialStep` (default `0`) and
`totalSteps` (default `0`) and `isWizard` (default `false`). `UseForgeProps`
(`src/types.ts:91-106`) declares `initialStep?`, `totalSteps?`, `isWizard?` — all
optional with no declared defaults; the types are `number | undefined` /
`boolean | undefined`. The documented defaults (`0`, `0`, `false`) are only real
if `useForge` applies them at runtime. This needs verification against
`src/useForge/useForge.tsx`; if `useForge` does not coerce `undefined` to those
values, the documented defaults are misleading (e.g. `control.isFirstStep`
computed from `currentStep === 0` and `isLastStep` from `currentStep ===
totalSteps - 1` behave differently when `totalSteps` is `undefined`).
**Fix:** Confirm the defaults in `src/useForge/useForge.tsx`. If the hook does not
default `totalSteps`/`initialStep`, change the doc's Default column to `—`
(undefined) or document the real fallback. Do not assert defaults the code does
not apply.

### WR-04: API.md documents Forger props `rules`/`transform`/`handler`/`dependencies` as first-class, but they are not in `ForgerProps`

**File:** `docs/API.md:167-170`
**Issue:** The Forger props table lists `rules`, `transform`, `handler`,
`dependencies` as documented props. `ForgerProps` (`src/types.ts:38-49`) does NOT
declare any of these; it declares `name`, `component`, `label`, `onChange`,
`accept`, `multiple`, `control`, plus `& Record<string, unknown>`. These four
props work at runtime only because they fall through `...rest` into
`ForgerControllerProps` (`src/types.ts:51-68`) where they are actually typed. This
means a TypeScript consumer gets no type-checking, autocomplete, or
type-safety on `rules`/`transform` from the `<Forger>` surface — they are typed as
`unknown` via the index signature. The doc presents them as if they were typed
Forger props.
**Fix:** Either tighten `ForgerProps` in `src/types.ts` to explicitly include
`rules`, `transform`, `handler`, `dependencies` (so the documented surface
matches the type), or add a note in `docs/API.md` that these props are accepted
via passthrough and are typed on `ForgerControllerProps`, not `ForgerProps`.
Preferred: add them to `ForgerProps` so the doc becomes accurate.

### WR-05: ReactNativeExample uses `isValid`-gated submit with `mode: 'onChange'` and a Switch with no transform — example will not submit and number fields stay strings

**File:** `examples/ReactNativeExample.md:135-136, 256-265, 315-325, 333-337`
**Issue:** Two correctness problems in the example as a teaching artifact:
(1) `age` and `rating` are typed `number` in `FormData` (lines 26, 30) and use
`StyledTextInput` (a `<TextInput>`), which emits **strings** via `onChangeText`.
No `transform={{ output: Number }}` is applied, so `age`/`rating` are stored as
strings while the interface claims `number`, and the `min`/`max` numeric rules
(lines 65-72, 86-92) compare against strings. (2) The submit `<Button>` is
`disabled={!isValid}` with `mode: 'onChange'`; because `age`/`rating` default to
`0`/`5` (numbers) but become strings on edit, and several required fields start
empty, `isValid` is `false` on mount and the example shows a disabled button with
no explanation. This makes the "build a working form in minutes" promise fail for
a copy-paste user.
**Fix:** Add `transform={{ output: (v) => Number(v) || 0, input: (v) => String(v ?? '') }}`
to the `age` and `rating` `<Forger>`s, and either drop `disabled={!isValid}` or
add a comment explaining the fields must be filled first. Wire `onError` (defined
at line 153 but never used — see IN-02) into the submit so validation failures
surface.

## Info

### IN-01: CLAUDE.md publish-from-`dist/` note is stale relative to `publish.yml`

**File:** `.github/workflows/publish.yml:39-40`
**Issue:** CLAUDE.md states the publish command is "run from the **`dist/`
directory**" with `npm publish --access public`. The actual workflow runs
`npm publish --provenance --access public` from the repo root, relying on
`package.json` `"files": ["dist"]` (line 96-98) and the `prepack` build script
(line 16). The workflow is correct; the project doc is stale. Not a workflow
defect, but the mismatch can mislead a maintainer debugging a publish.
**Fix:** Update the CI/Publish section of CLAUDE.md to describe the current
root-level `--provenance` publish flow.

### IN-02: ReactNativeExample defines `onError` but never wires it

**File:** `examples/ReactNativeExample.md:153-159, 335`
**Issue:** `onError` is defined (lines 153-159) to surface validation errors via
`Alert`, but the submit handler is `handleSubmit(onSubmit)` (line 335) with no
second argument, so `onError` is dead code. The example imports the pattern but
never demonstrates it.
**Fix:** Pass it: `onPress={handleSubmit(onSubmit, onError)}`.

### IN-03: CI `pull_request: branches: ["**"]` is redundant/has no effect for same-repo PRs already covered by push

**File:** `.github/workflows/ci.yml:3-7`
**Issue:** The CI triggers on both `push` to `["**"]` and `pull_request` to
`["**"]`. For same-repo branches this double-runs CI on every push that also has
an open PR (one `push` run + one `pull_request` run). The `pull_request` trigger
is still valuable for fork PRs, so this is intentional-but-noisy rather than
wrong. Worth a deliberate decision.
**Fix:** Optional — if double runs are undesirable, scope `push` to protected
branches (e.g. `branches: [main]`) and keep `pull_request: ["**"]` for the
per-branch validation. No action required if the redundancy is acceptable.

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
