---
phase: quick-260601-ciw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - AGENTS.md
  - llms.txt
  - llms-full.txt
  - src/Forge/Forge.tsx
  - src/Forger/Forger.tsx
  - src/useForge/useForge.tsx
  - src/usePersist/usePersist.tsx
  - src/useFieldArray/useFieldArray.tsx
  - src/useForgeValues/useForgeValues.tsx
  - src/useSubscribe.ts
  - src/validateField.ts
  - src/reactNative.ts
  - src/types.ts
autonomous: true
requirements:
  - LLM-01

must_haves:
  truths:
    - "AGENTS.md exists at repo root with a '## Common Mistakes' section containing all 7 failure modes"
    - "llms.txt exists at repo root following llmstxt.org format (H1 + blockquote + link list)"
    - "llms-full.txt exists at repo root assembled from AGENTS.md content + condensed API table"
    - "Every primary export reachable from src/index.ts has a TSDoc /** */ block in its source file"
    - "npm run typecheck exits 0 after TSDoc edits"
    - "npm run lint exits 0 after TSDoc edits (prettier --write applied to all touched src/ files)"
    - "npm test stays green (9 files / 23 tests)"
  artifacts:
    - path: "AGENTS.md"
      provides: "Authoritative LLM usage guide — mental model, 8 exports, recipes, 7 Common Mistakes"
      contains: "## Common Mistakes"
    - path: "llms.txt"
      provides: "llmstxt.org index — thin map to all Forge docs"
      contains: "# @adexdsamson/forge"
    - path: "llms-full.txt"
      provides: "Single paste-the-whole-thing file assembled from AGENTS.md body + condensed API table"
      contains: "## Common Mistakes"
  key_links:
    - from: "llms-full.txt"
      to: "AGENTS.md"
      via: "content assembled from AGENTS.md — no independent copy of failure modes"
      pattern: "Common Mistakes"
    - from: "TSDoc on Forger"
      to: "AGENTS.md Common Mistakes item 1"
      via: "one-liner: RN props go directly on <Forger>, not via reactNative={{}}"
      pattern: "reactNative"
---

<objective>
Produce the LLM-friendly doc layer for @adexdsamson/forge: AGENTS.md (authoritative usage guide), llms.txt (index), llms-full.txt (single-file paste), and TSDoc blocks on all exported symbols so dist/index.d.ts carries inline usage hints.

Purpose: AI coding agents and chat LLMs currently get Forge wrong in predictable ways (using inert reactNative={} prop, missing name on inputs, hand-wiring handleSubmit on RN, etc.). These artifacts eliminate those failure modes at the point of consumption — in-repo agents read AGENTS.md and TSDoc; chat LLMs get llms-full.txt.

Output: Three new repo-root files + TSDoc additions across 9 src/ files. No behavior changes, no version bump, no publish. docs/API.md stays unchanged.
</objective>

<execution_context>
@C:/Users/HomePC/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/HomePC/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/HomePC/Documents/GitHub/Forge/.planning/PROJECT.md
@C:/Users/HomePC/Documents/GitHub/Forge/.planning/ROADMAP.md
@C:/Users/HomePC/Documents/GitHub/Forge/.planning/STATE.md
@C:/Users/HomePC/Documents/GitHub/Forge/docs/superpowers/specs/2026-06-01-llm-friendly-forge-design.md

<interfaces>
<!-- Verified export surface from src/index.ts — source of truth. -->
<!-- Primary 8 runtime exports: -->
<!--   useForge       → src/useForge/useForge.tsx -->
<!--   Forge          → src/Forge/Forge.tsx -->
<!--   Forger         → src/Forger/Forger.tsx -->
<!--   useFieldArray  → src/useFieldArray/useFieldArray.tsx -->
<!--   useForgeValues → src/useForgeValues/useForgeValues.tsx -->
<!--   usePersist     → src/usePersist/usePersist.tsx -->
<!--   useSubscribe   → src/useSubscribe.ts -->
<!--   validateField  → src/validateField.ts (default export) -->
<!-- Additional exports: all types from src/types.ts; -->
<!--   reactNative helpers from src/reactNative.ts; -->
<!--   platform detection booleans + slot guards from src/utils.ts -->

<!-- KEY BEHAVIORAL FACTS (verified from source): -->
<!-- Forger.tsx: ForgerController spreads `...rest` directly onto Component -->
<!--   — there is NO `reactNative` key; pass native props flat on <Forger> -->
<!-- Forge.tsx: isRNMode → renders React Fragment (no wrapper element) -->
<!--   isButtonSubmitSlot checks type="submit" OR forgeSubmit===true -->
<!--   forgeSubmit prop is stripped before reaching host component -->
<!-- isInputSlot(child) checks child.props.name truthy — nameless inputs skipped -->
<!-- usePersist: uses useWatch + useFormState (zero _* access); -->
<!--   handler signature: (values: TFieldValues, { isDirty, isValid }) => void -->
<!--   fires on mount (first useWatch emission) -->
<!-- useForgeValues.getValue: throws Forge-named error on unknown field -->
<!-- useSubscribe: generic Subject<T> observer; disabled prop skips subscribe -->
<!-- ForgeControl = RHF Control augmented in-place via Object.assign -->
<!--   (same instance; wizard state + hasFields overlaid) -->
<!-- transform: { input?: fn, output?: fn } -->
<!--   output transforms value BEFORE writing to RHF -->
<!--   input transforms value BEFORE passing to component -->
<!-- Fields outside <Forge> (outside FormProvider) must receive control prop -->
<!-- Forge.tsx platform prop: 'web' | 'react-native' | 'auto' (default 'auto') -->
<!-- useForge returns full UseFormReturn minus control, plus augmented control -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write AGENTS.md — authoritative LLM usage guide</name>
  <files>AGENTS.md</files>

  <read_first>
    - C:/Users/HomePC/Documents/GitHub/Forge/docs/superpowers/specs/2026-06-01-llm-friendly-forge-design.md — authoritative scope; follow section order exactly
    - C:/Users/HomePC/Documents/GitHub/Forge/src/index.ts — export list (source of truth)
    - C:/Users/HomePC/Documents/GitHub/Forge/src/Forger/Forger.tsx — confirm ...rest spread, no reactNative key
    - C:/Users/HomePC/Documents/GitHub/Forge/src/Forge/Forge.tsx — confirm Fragment on RN, forgeSubmit wiring
    - C:/Users/HomePC/Documents/GitHub/Forge/src/utils.ts — isInputSlot name-guard, isButtonSubmitSlot
    - C:/Users/HomePC/Documents/GitHub/Forge/src/types.ts — ForgeProps.platform, transform shape
    - C:/Users/HomePC/Documents/GitHub/Forge/src/usePersist/usePersist.tsx — handler signature
    - C:/Users/HomePC/Documents/GitHub/Forge/ReadMe.md — web + RN quickstart recipes (for recipe section)
    - C:/Users/HomePC/Documents/GitHub/Forge/docs/API.md — accurate signatures
  </read_first>

  <action>
Create `AGENTS.md` at the repo root. This is the single source of truth for LLM failure-mode content. No other artifact (llms-full.txt, TSDoc) should duplicate the failure-mode prose.

Structure (follow exactly):

## 1. Header
```
# @adexdsamson/forge — Agent Usage Guide
```
Version badge line: `> For @adexdsamson/forge v1.x`

## 2. What Forge Is (3-4 sentences)
Mental model: `useForge()` → `<Forge control>` → `<Forger>` wraps any custom input. Cross-platform: web (`<form>`) + React Native (Fragment) via runtime detection. Thin orchestration layer over react-hook-form; all form state lives in RHF's Control object.

## 3. The 8 Exports (table + one-line description each)
List these eight in order. Verify every name against src/index.ts before writing. Additional exports (types, reactNative helpers, platform booleans) are noted briefly as "also exported — see docs/API.md for full surface."

| Export | Type | One-line purpose |
|--------|------|-----------------|
| `useForge` | Hook | Initializes form; returns full RHF toolkit + augmented `control` |
| `Forge` | Component | Form container; web=`<form>`, RN=Fragment; wires submit + wizard |
| `Forger` | Component | Connects one field to RHF via `useController`; auto event handlers |
| `useFieldArray` | Hook | Dynamic field arrays with per-item `inputProps` preservation |
| `useForgeValues` | Hook | Thin `setValue`/`getValue`/`getValues` wrapper over RHF public API |
| `usePersist` | Hook | Autosave/draft: fires handler on every value change + state flags |
| `useSubscribe` | Hook | Subscribe to any RHF `Subject<T>`; cleans up on unmount |
| `validateField` | Function | Async field validator; platform-aware (web + RN) |

## 4. Recipes (copy-paste)
Include these 8 named recipes as TypeScript code blocks:

a. **Basic web form** — `useForge` + `<Forge>` + `<Forger>` + `<button type="submit">` (source from ReadMe.md quickstart, condensed to ~20 lines, remove custom component definitions — show just the form structure)
b. **React Native form** — `platform="react-native"`, `<Forger>` with flat native props (e.g. `keyboardType`, `secureTextEntry` directly on `<Forger>`), `<TouchableOpacity forgeSubmit>` (do NOT use `reactNative={{}}`)
c. **Dynamic field array** — `useFieldArray` with `inputProps`, `fields.map(...)`, `append`/`remove`
d. **Autosave / persist** — `usePersist({ control, handler })` where handler receives `(values, { isDirty, isValid })`
e. **Wizard multi-step** — `useForge({ isWizard: true, totalSteps: 2 })`, two children of `<Forge>`, `data-wizard-nav="next"` / `data-wizard-nav="previous"` buttons
f. **Transform** — `<Forger transform={{ input: v => display(v), output: v => store(v) }}>`
g. **Schema resolver (Zod)** — `useForge({ resolver: zodResolver(schema) })`, no `rules` needed on Forger
h. **Standalone validateField** — import and call directly with a field ref and rules object

## 5. Common Mistakes (do NOT → do)
This section heading MUST be exactly `## Common Mistakes` (used as a grep gate).
List exactly 7 numbered items. Each item uses the pattern `**do NOT** … → **do** …`.

Item 1: RN native props. do NOT: `<Forger reactNative={{ keyboardType: 'email-pad' }}>`. do: `<Forger keyboardType="email-pad">`. Explanation: ForgerController spreads `...rest` directly onto the component; there is no `reactNative` key — it would be silently ignored.

Item 2: Missing name prop. do NOT: `<Forger component={MyInput}>` (no name). do: `<Forger name="email" component={MyInput}>`. Explanation: `isInputSlot` checks `child.props.name`; nameless inputs are not wired into the form.

Item 3: RN submit wiring. do NOT: `<TouchableOpacity onPress={handleSubmit(onSubmit)}>` inside `<Forge>`. do: `<TouchableOpacity forgeSubmit>` (Forge injects `onPress` automatically and strips `forgeSubmit` before it reaches the host component). Note: web `<button type="submit">` just works — no manual handler needed.

Item 4: Expecting a wrapper element on RN. do NOT: assume `<Forge platform="react-native">` renders a `<View>` or any container. do: wrap in your own `<View>` for layout — Forge renders a React Fragment on React Native.

Item 5: transform direction confusion. do NOT: use `output` to transform display value, `input` to transform stored value. do: `output` transforms value BEFORE writing to RHF (display→stored); `input` transforms value BEFORE passing to the component (stored→display).

Item 6: Fields outside FormProvider. do NOT: render `<Forger>` outside `<Forge>` without a `control` prop. do: pass `control` explicitly (`<Forger control={control} ...>`) — Forger falls back to the `control` prop when there is no FormProvider context.

Item 7: usePersist handler mount emission + getValue unknown field. Two sub-items:
  - do: expect usePersist handler to fire once on mount (drain the initial emission; gate on `isDirty` if needed).
  - do NOT: call `getValue("nonexistentField")` from `useForgeValues` — it throws a named Forge error on fields absent from `getValues()`.

## 6. TypeScript quick reference
A mini table mapping the most useful exported types to their source:
ForgeControl, ForgeProps, ForgerProps, UseForgeProps, UseForgeResult, FieldProps, FormPropsRef — all from @adexdsamson/forge.

## 7. Further reading
Links: README (ReadMe.md), docs/API.md (full reference, unchanged), examples/ReactNativeExample.md, CHANGELOG.md.

ACCURACY RULES (non-negotiable):
- Every export name MUST match src/index.ts exactly. Do not invent exports.
- Every prop name MUST match src/types.ts and actual component source.
- No code example may use `reactNative={{}}` as a recommended pattern.
- ForgeProps.platform = 'web' | 'react-native' | 'auto' (not isNative as a recommended pattern — isNative is deprecated).
- usePersist handler signature: `(values: TFieldValues, state: { isDirty: boolean; isValid: boolean }) => void` — confirmed from src/usePersist/usePersist.tsx.
  </action>

  <verify>
    <automated>
      grep -c "## Common Mistakes" C:/Users/HomePC/Documents/GitHub/Forge/AGENTS.md
      grep -c "reactNative={{}}" C:/Users/HomePC/Documents/GitHub/Forge/AGENTS.md
    </automated>
    Expected: first grep = 1, second grep = 0 (zero occurrences of the inert prop pattern as a recommendation).
  </verify>

  <done>
    - AGENTS.md exists at repo root with all 7 sections present
    - `## Common Mistakes` heading present (exact match)
    - All 7 mistake items present and numbered
    - No occurrence of `reactNative={{}}` as a recommended pattern
    - All 8 export names match src/index.ts
    - usePersist handler signature matches src/usePersist/usePersist.tsx
    - transform direction (output=store, input=display) matches Forger.tsx behavior
  </done>
</task>

<task type="auto">
  <name>Task 2: Write llms.txt and llms-full.txt</name>
  <files>llms.txt, llms-full.txt</files>

  <read_first>
    - AGENTS.md (just written — Task 1 output; content is source for llms-full.txt body)
    - C:/Users/HomePC/Documents/GitHub/Forge/ReadMe.md — for README link description
    - C:/Users/HomePC/Documents/GitHub/Forge/CHANGELOG.md — confirm file exists
    - C:/Users/HomePC/Documents/GitHub/Forge/examples/ReactNativeExample.md — confirm file exists
    - C:/Users/HomePC/Documents/GitHub/Forge/docs/API.md — for link description
  </read_first>

  <action>
Create two files at the repo root.

### llms.txt
Follow the llmstxt.org specification format:
- H1 heading: `# @adexdsamson/forge`
- Blockquote paragraph: 2-3 sentence summary (same as "What Forge Is" from AGENTS.md, condensed to one paragraph)
- Blank line
- Link list sections. Use markdown links with one-line descriptions:

```
## Docs

- [README](ReadMe.md): Quickstart guide with web and React Native examples.
- [API Reference](docs/API.md): Full prop and return-value tables for every exported symbol.
- [Agent Usage Guide](AGENTS.md): Recipes, common mistakes, and LLM-optimised usage patterns.
- [CHANGELOG](CHANGELOG.md): Version history.

## Examples

- [React Native Example](examples/ReactNativeExample.md): Complete runnable RN form with multiple field types, validation, and submission.
```

No other content. llms.txt is intentionally short — it is a directory, not a tutorial.

### llms-full.txt
Assembled from AGENTS.md — do NOT copy failure-mode prose independently (DRY rule). Structure:

1. Opening line: `# @adexdsamson/forge — Full LLM Reference`
2. One-paragraph intro (same as AGENTS.md "What Forge Is" section, verbatim or near-verbatim).
3. Complete AGENTS.md body — copy the full text of AGENTS.md verbatim (sections 2–7: What Forge Is through Further reading). This includes the Common Mistakes section — it is in llms-full.txt because it comes FROM AGENTS.md, not as a separate copy.
4. After the AGENTS.md body, append:

```
---

## Condensed API Signature Table
```

Then a single markdown table with columns: Export | Signature | Notes.
Rows (verified from source files before writing):

| Export | Signature | Notes |
|--------|-----------|-------|
| `useForge<T>` | `(props: UseForgeProps) => UseForgeResult<T>` | Props: defaultValues, resolver, fields, mode, isWizard, initialStep, totalSteps |
| `Forge<T>` | `(props: ForgeProps<T>) => JSX.Element` | Props: control (required), onSubmit, className, noValidate, children, ref, debug, platform, isWizard |
| `Forger<T>` | `(props: ForgerProps<T>) => JSX.Element` | Props: name (required), component (required), rules, transform, handler, label, control; extra props spread to component |
| `useFieldArray<IP,T>` | `(props: ForgeFieldArray<T,...> & { inputProps: IP }) => UseFieldArrayReturn & { fields: (RHFField & { inputProps: IP })[] }` | Wraps RHF useFieldArray; adds per-item inputProps |
| `useForgeValues<T>` | `({ control }) => { setValue, getValue, getValues }` | getValue throws on unknown field |
| `usePersist<T>` | `({ control, handler }) => void` | handler: (values: T, { isDirty, isValid }) => void; fires on mount |
| `useSubscribe<T>` | `({ subject, next, disabled? }) => void` | Generic Subject<T> observer; cleans up on unmount |
| `validateField` | `(field: Field, formValues, ...) => Promise<InternalFieldErrors>` | Platform-aware; web uses reportValidity; RN uses setNativeProps |

End the file with a line: `> Source of truth: AGENTS.md. This file is assembled from AGENTS.md content — do not edit independently.`

ACCURACY RULES:
- Signature column must reflect actual TypeScript generics — do not invent type params.
- ForgerProps: confirm the ...rest spread means extra props (keyboardType, etc.) flow through.
- Do NOT include `reactNative={{}}` anywhere in this file.
  </action>

  <verify>
    <automated>
      grep -c "# @adexdsamson/forge" C:/Users/HomePC/Documents/GitHub/Forge/llms.txt
      grep -c "## Common Mistakes" C:/Users/HomePC/Documents/GitHub/Forge/llms-full.txt
    </automated>
    Expected: both greps return 1 (llms.txt has H1; llms-full.txt contains the section from AGENTS.md body).
  </verify>

  <done>
    - llms.txt: H1 line is `# @adexdsamson/forge`; contains blockquote summary; link list covers ReadMe.md, docs/API.md, AGENTS.md, examples/ReactNativeExample.md, CHANGELOG.md
    - llms-full.txt: contains `## Common Mistakes` (sourced from AGENTS.md body); ends with "Source of truth: AGENTS.md" note; condensed API table present with 8 rows
    - Neither file contains `reactNative={{}}` as a recommended pattern
  </done>
</task>

<task type="auto">
  <name>Task 3: Add TSDoc /** */ to all exported symbols</name>
  <files>
    src/useForge/useForge.tsx,
    src/Forge/Forge.tsx,
    src/Forger/Forger.tsx,
    src/useFieldArray/useFieldArray.tsx,
    src/useForgeValues/useForgeValues.tsx,
    src/usePersist/usePersist.tsx,
    src/useSubscribe.ts,
    src/validateField.ts,
    src/reactNative.ts,
    src/types.ts
  </files>

  <read_first>
    - AGENTS.md (just written — the one-liner gotchas in TSDoc MUST agree with this file)
    - C:/Users/HomePC/Documents/GitHub/Forge/src/index.ts — full export list to ensure nothing is missed
    - Each src/ file to be edited — read before editing to understand existing comments
    - C:/Users/HomePC/Documents/GitHub/Forge/docs/API.md — accurate signatures for @param / @returns text
  </read_first>

  <action>
Add or upgrade `/** */` TSDoc blocks on every exported symbol reachable from src/index.ts. The goal is that `dist/index.d.ts` carries inline usage hints for every public export.

RULES:
- TSDoc comments must not change behavior — they are pure documentation additions.
- No hard react-native imports; no _* RHF private API references in comments.
- Each TSDoc block must contain:
  - One-line description (@summary-style first line inside the block)
  - One-line gotcha aligned with AGENTS.md (use @remarks or inline prose — NOT a standalone @gotcha tag)
  - @param tags for each significant parameter
  - @returns tag (where applicable)
  - @example with a minimal code snippet (3-8 lines) demonstrating the most common usage

GOTCHA ALIGNMENT (these specific one-liners must appear verbatim or near-verbatim):

On `Forge`:
  "React Native: renders a Fragment (no wrapper element); use `platform=\"react-native\"` or auto-detection."
  "Web: renders a real `<form>` — native browser submit semantics (Enter key, type=\"submit\" button) apply."

On `Forger`:
  "RN: pass native props (e.g. `keyboardType`, `secureTextEntry`) directly on `<Forger>`, not via a `reactNative={{}}` prop — extra props are spread to the component via `...rest`."
  "Every `<Forger>` must have a `name` prop; nameless instances are not wired into the form."

On `useForge`:
  "Returns the full react-hook-form `UseFormReturn` toolkit plus an augmented `control` handle. Pass `control` (not `methods`) to `<Forge>`."

On `usePersist`:
  "Handler fires on mount (drain the initial emission). Signature: `(values, { isDirty, isValid }) => void`."

On `useForgeValues`:
  "`getValue(name)` throws a Forge-named error if the field is not found in `getValues()` — only call it for fields that have a `defaultValue` or have been written."

On `useSubscribe`:
  "Generic Subject<T> observer. Pass a `subject` from RHF internals (e.g. `control._subjects.values`) only when public RHF hooks are insufficient."

On `validateField`:
  "Platform-aware async validator. On web uses `reportValidity`; on React Native uses `setNativeProps({ error })`."

On `useFieldArray`:
  "Wraps RHF's `useFieldArray` and layers per-item `inputProps` onto each returned field. The `inputProps` attachment is the reason this hook exists — do not replace with a plain RHF `useFieldArray` call."

TYPE EXPORTS in src/types.ts — add concise /** */ to these exported types:
  - ForgeControl: "RHF `Control<T>` augmented in-place with Forge metadata (hasFields, fields, wizard state)."
  - ForgeProps: "Props for `<Forge>`. The `control` prop is required and must come from `useForge`."
  - ForgerProps: "Props for `<Forger>`. Extra props beyond the named ones are spread to `component` via `...rest`."
  - UseForgeProps: "Options for `useForge`. Mirrors RHF `useForm` options plus Forge-specific wizard config."
  - UseForgeResult: "Return type of `useForge`. Same as RHF `UseFormReturn` but `control` is `ForgeControl<T>`."
  - ForgeSubmitButtonProps: "Add `forgeSubmit` to any button inside `<Forge>` in RN mode; Forge injects `onPress` and strips this prop."
  - Other type exports (ForgerControllerProps, ForgerSlotProps, TForgerProps, FieldProps, FormPropsRef, ReactNativeInputProps, PlatformSpecificProps, CrossPlatformForgerProps): one-line description each.

REACTNATIVE.ts exports — add short /** */ to:
  - REACT_NATIVE_COMPONENTS: "Map of known React Native component display names used for event-handler routing."
  - getEventHandlerName: "Returns the correct event handler prop name for a given RN component type ('onChangeText', 'onValueChange', or 'onChange')."
  - getValuePropertyName: "Returns the correct value prop name for a given RN component type."
  - setReactNativeError: "Sets an error message on an RN input ref via setNativeProps."
  - Other exports: one-line each.

After editing all src/ files, run prettier --write on every touched file:
  npx prettier --write src/useForge/useForge.tsx src/Forge/Forge.tsx src/Forger/Forger.tsx src/useFieldArray/useFieldArray.tsx src/useForgeValues/useForgeValues.tsx src/usePersist/usePersist.tsx src/useSubscribe.ts src/validateField.ts src/reactNative.ts src/types.ts

Then verify:
  npm run typecheck     (must exit 0)
  npm run lint          (must exit 0)
  npm test              (must stay green; re-run once on Windows if first run fails cold)
  </action>

  <verify>
    <automated>npm run typecheck && npm run lint && npm test</automated>
    All three commands must exit 0. On Windows vitest cold-run flakiness: re-run `npm test` once before treating a failure as real.

    Additionally confirm TSDoc coverage:
    grep -c "/\*\*" src/Forge/Forge.tsx
    grep -c "/\*\*" src/Forger/Forger.tsx
    grep -c "/\*\*" src/useForge/useForge.tsx
    (Each should return >= 1)

    Confirm the inert prop gotcha is present on Forger:
    grep -c "reactNative" src/Forger/Forger.tsx
    (Should return >= 1 — inside the TSDoc comment)
  </verify>

  <done>
    - Every exported symbol from src/index.ts has a /** */ TSDoc block in its source file
    - TSDoc on Forger contains the "pass native props directly, not via reactNative={{}}" one-liner
    - TSDoc gotchas agree with AGENTS.md (same direction, same meaning)
    - npm run typecheck exits 0
    - npm run lint exits 0 (prettier --write applied to all touched src/ files beforehand)
    - npm test green (9 files / 23 tests)
    - No new runtime imports added; no _* RHF private APIs referenced in TSDoc text
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| doc content → consumer LLM | Inaccurate API claims in AGENTS.md/llms.txt propagate to generated consumer code |
| TSDoc → dist/index.d.ts | TSDoc text ships in the tarball; misleading one-liners would persist across npm versions |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ciw-01 | Information Disclosure | AGENTS.md recipes | mitigate | Every code example verified against actual source before writing; no invented props/behaviors; accuracy gate is grep confirmation of export names matching src/index.ts |
| T-ciw-02 | Tampering | llms-full.txt drift | mitigate | llms-full.txt assembled from AGENTS.md body verbatim; footer note explicitly states "do not edit independently"; single DRY source prevents silent divergence |
| T-ciw-03 | Repudiation | TSDoc one-liners | accept | TSDoc is additive-only documentation; cannot change behavior; verified by typecheck + lint gates |
</threat_model>

<verification>
Run these checks after all three tasks complete:

1. Structure gates:
   - grep -c "## Common Mistakes" AGENTS.md   → must equal 1
   - grep -c "reactNative={{}}" AGENTS.md      → must equal 0
   - grep -c "# @adexdsamson/forge" llms.txt   → must equal 1
   - grep -c "## Common Mistakes" llms-full.txt → must equal 1 (from AGENTS.md body)

2. Export coverage gate:
   - Confirm all 8 primary exports in src/index.ts have TSDoc in their source file.

3. Build/quality gates:
   - npm run typecheck → exit 0
   - npm run lint      → exit 0
   - npm test          → green (9 files / 23 tests; re-run once on Windows cold-start flakiness)

4. No-regression gate:
   - docs/API.md is unchanged (git diff docs/API.md → empty)
   - package.json version field unchanged (still 1.0.0)
   - No new runtime imports in any src/ file
</verification>

<success_criteria>
- AGENTS.md at repo root: sections 1-7 present; exactly one `## Common Mistakes` heading; 7 numbered items; no `reactNative={{}}` as recommended; all 8 export names match src/index.ts; usePersist handler signature `(values, { isDirty, isValid })` documented correctly; transform direction (output=store, input=display) documented correctly.
- llms.txt at repo root: H1 `# @adexdsamson/forge`; blockquote summary; link list with 5 entries (ReadMe.md, docs/API.md, AGENTS.md, examples/ReactNativeExample.md, CHANGELOG.md).
- llms-full.txt at repo root: AGENTS.md body included verbatim; condensed API table with 8 rows; ends with source-of-truth note; `## Common Mistakes` present once (from AGENTS.md inclusion).
- TSDoc: every exported symbol reachable from src/index.ts has a `/** */` block; Forger TSDoc contains the "pass native props directly, not via reactNative={{}}" gotcha; all one-liners agree with AGENTS.md direction.
- Gates: `npm run typecheck` exit 0, `npm run lint` exit 0, `npm test` green.
- docs/API.md unchanged. package.json version unchanged at 1.0.0.
</success_criteria>

<output>
After completion, create `.planning/quick/260601-ciw-llm-friendly-docs/260601-ciw-SUMMARY.md` using the summary template.
</output>
