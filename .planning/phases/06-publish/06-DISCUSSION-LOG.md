# Phase 6: Publish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 6-Publish
**Areas discussed:** Release version, Publish mechanism, Version-bump/tagging tooling, Verification depth, npm auth readiness, Tag-to-main path

---

## Release version

| Option | Description | Selected |
|--------|-------------|----------|
| 1.0.0 | Clean first stable release; resets leftover 1.0.3; semver stability promise on the proven orbipayx API; caveats are quality-debt not API instability | ✓ |
| 0.1.0 | Signal early/pre-1.0; 0.x allows breaking changes in minors; lowers consumer expectations | |
| Keep 1.0.3 | Publish at current number; implies a fake prior public history | |

**User's choice:** 1.0.0
**Notes:** Maps to D-01.

---

## Publish mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| CI release flow | Bump+tag on main → GitHub Release → publish.yml runs lint+test, publishes with provenance. Required for the provenance/verified badge | ✓ |
| Manual local publish | Local `npm publish` for v1; loses provenance (no CI id-token); diverges from gated pipeline | |
| workflow_dispatch run | Manual CI trigger (keeps provenance+gating) but needs a separate tag/release for SC3 | |

**User's choice:** CI release flow
**Notes:** Maps to D-02. Provenance constraint makes this the required path.

---

## Version-bump / tagging tooling

| Option | Description | Selected |
|--------|-------------|----------|
| standard-version | One command bumps package.json, renames CHANGELOG `[Unreleased]`→version+date, commits, tags; coheres with Phase 5 conventional-changelog | ✓ |
| Manual npm version | `npm version <x>` + hand-edit CHANGELOG; more manual, easier to forget the rename | |

**User's choice:** standard-version
**Notes:** Maps to D-03/D-04.

---

## Verification depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full post-publish smoke | Dry-run, then post-publish fresh install from live registry → import 6 exports → tsc; proves all 3 success criteria | ✓ |
| Dry-run + registry check | `npm publish --dry-run` + confirm version on npmjs + tag exists; reuses Phase 4 tarball smoke | |

**User's choice:** Full post-publish smoke
**Notes:** Maps to D-07. User wanted proof against the live registry.

---

## npm auth readiness

| Option | Description | Selected |
|--------|-------------|----------|
| All set | Scope owned + automation token (or 2FA not enforced); CI publishes unattended | |
| Needs setup/verify | Token type / scope / 2FA not confirmed; plan must include an explicit pre-publish readiness check | ✓ |
| You decide | Planner adds defensive readiness verification regardless | |

**User's choice:** Needs setup/verify
**Notes:** Maps to D-06. Most likely hard-blocker — verify scope ownership, automation token, dry-run before the real release.

---

## Tag-to-main path

| Option | Description | Selected |
|--------|-------------|----------|
| Direct push to main | Run standard-version locally, push bump+tag straight to main; assumes no branch protection | |
| PR then tag | Release PR → merge to main → tag/Release on merged commit; needed under branch protection | ✓ |
| You decide | Planner detects protection state and chooses | |

**User's choice:** PR then tag
**Notes:** Maps to D-05. Tag must land on main to satisfy SC3.

---

## Claude's Discretion

- GitHub Release body wording (summarize from finalized CHANGELOG 1.0.0 section).
- Whether to keep `workflow_dispatch` on `publish.yml` (carry from Phase 5 D-08).
- Throwaway-project location for the post-publish smoke (e.g. `c:\Temp\forge-smoke-test`).
- Precise `standard-version` flags (e.g. `--release-as 1.0.0`).

## Deferred Ideas

- Quality-debt pass (coverage thresholds, ~46 `as any` casts) — future milestone.
- Node/OS test matrix — single Ubuntu+Node 20 for v1.
- Hosted documentation site (TypeDoc → GitHub Pages) — out of scope for v1.
- Post-1.0 release automation — v1 uses manual PR-then-tag + GitHub Release.
