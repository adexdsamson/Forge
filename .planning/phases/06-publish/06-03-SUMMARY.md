# Plan 06-03 Summary — Version Bump 1.0.0 + Release PR

**Status:** Complete
**Requirement:** PUB-01
**Autonomous:** false (human PR-merge checkpoint)
**Completed:** 2026-06-01

## Outcome

`@adexdsamson/forge` is bumped to **1.0.0** on `main` via the D-05 PR-then-tag flow. PR #1 (`release/v1.0.0` → `main`) was reviewed and **merged by the human** (merge commit `a7d97dc`, preserving the release commit `884f409`). No git tag exists yet — that is created by `gh release create` in 06-04, anchored to the merged main HEAD.

## What landed on main

| Item | State |
|------|-------|
| `package.json` version | `1.0.3` → `1.0.0` (D-01) |
| `package-lock.json` version | `1.0.0` |
| `CHANGELOG.md` heading | `## [Unreleased]` → `## [1.0.0] - 2026-06-01` (D-03; curated body unchanged — diff is heading-only) |
| Release commit | `chore(release): 1.0.0` (`884f409`), merged via `a7d97dc` |
| `npm test` | 8 files / 21 tests green |
| Remote tag `v1.0.0` | NOT created yet (correct — 06-04 makes it) |

## Deviations from plan (justified)

The plan's `commit-and-tag-version` invocation was incomplete; two corrections were needed:

1. **`.versionrc.json` skips everything.** Phase 5 left `.versionrc.json` = `{"skip":{"bump":true,"tag":true,"commit":true}}` (for changelog-only generation). Running `--skip.changelog` alone inherits those skips and does nothing; `--skip.bump=false` CLI override did not work. **Fix:** temporarily `mv .versionrc.json .versionrc.json.bak`, run `npx commit-and-tag-version --release-as 1.0.0 --skip.changelog` (tool defaults = bump+tag+commit; only changelog skipped), then `mv` it back. The plan's "do NOT edit .versionrc.json" guidance was based on a flawed premise; the file is restored byte-for-byte (git clean). Verified with `--dry-run` first.
2. **The tool does not commit a pre-staged CHANGELOG.md.** With `--skip.changelog`, `commit-and-tag-version` commits only package.json + package-lock.json, leaving the staged CHANGELOG heading edit uncommitted. **Fix:** `git commit --amend --no-edit` to fold the heading edit into the release commit, then `git tag -f v1.0.0`. (That local tag was later deleted — the authoritative tag is created by `gh release create --target main` in 06-04.)

## Cleared to proceed

Plan 06-04 (the irreversible GitHub Release + post-publish smoke) may begin. Still nothing published; no tag on origin.
