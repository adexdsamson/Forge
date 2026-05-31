# Phase 6: Publish - Research

**Researched:** 2026-06-01
**Domain:** npm publish pipeline — version bump, CHANGELOG finalization, git tag, GitHub Release trigger, smoke test
**Confidence:** HIGH (all findings verified against live codebase, live CLI output, and GitHub API)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** First public release is `1.0.0`. Reset the leftover extraction value `1.0.3`.
- **D-02:** Publish via the CI release flow, not a local `npm publish`. GitHub Release fires `publish.yml` → lint + test → publishes with provenance. Required because npm provenance attestation (id-token: write OIDC) is CI-only.
- **D-03:** Use `commit-and-tag-version` (the `standard-version` successor already installed as `commit-and-tag-version@12.7.3`) to bump `package.json` to `1.0.0`, finalize the CHANGELOG `[Unreleased]` heading, commit, and create the git tag. CHANGELOG body is already curated — the tool finalizes the heading only.
- **D-04:** Tag format follows whatever `commit-and-tag-version` emits by default (conventionally `v1.0.0`). Success criterion 3 requires the version tag to match `package.json` version and exist on `main`.
- **D-05:** PR-then-tag. Open a release PR for the bump commit, merge it to `main`, then create the tag / GitHub Release on the merged commit.
- **D-06:** npm auth is not confirmed ready — the plan MUST include an explicit pre-publish readiness check before cutting the release: (a) confirm npm account owns the `@adexdsamson` scope, (b) confirm `NPM_ACCESS_TOKEN` is an automation/granular token that bypasses 2FA, (c) run `npm publish --dry-run`.
- **D-07:** Full post-publish smoke test: fresh throwaway project → `npm install @adexdsamson/forge` from the live registry → import the 6 named exports → `tsc` → zero type errors. Re-installs from actually-published artifact, not a tarball.

### Claude's Discretion

- Exact GitHub Release body wording (derive a short summary from the finalized CHANGELOG `1.0.0` section).
- Whether to keep `workflow_dispatch` as a manual fallback trigger on `publish.yml` (already present — keep it).
- Exact throwaway-project location/scaffold for the post-publish smoke (use `c:\Temp\forge-smoke-test` which already exists).
- Precise `commit-and-tag-version` invocation flags (e.g., `--release-as 1.0.0`).

### Deferred Ideas (OUT OF SCOPE)

- Quality-debt pass (raising coverage thresholds, clearing `as any` casts).
- Node/OS test matrix — single Ubuntu + Node 20 for v1.
- Hosted documentation site (TypeDoc → GitHub Pages).
- Post-1.0 release automation.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | The package is published to the chosen registry and `install` in a fresh project succeeds with `{ useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist }` importing and type-checking correctly | All six research questions below directly enable implementation. Readiness gate (D-06) + bump+tag flow (D-03/D-04/D-05) + publish trigger (D-02) + smoke (D-07) together satisfy this requirement. |
</phase_requirements>

---

## Summary

Phase 6 operates an already-built and verified publish pipeline. The principal work is: (1) a pre-publish readiness gate, (2) version bump + CHANGELOG heading finalization via `commit-and-tag-version`, (3) getting that commit to `main` via PR merge (no enforced branch protection exists, but D-05 specifies PR-then-tag), (4) creating a git tag on the merged commit and a GitHub Release that fires `publish.yml`, and (5) a post-publish fresh-install smoke test against the live registry.

The critical tool is `commit-and-tag-version` (not `standard-version` — the two names are often used interchangeably in D-03, but the actual installed package is `commit-and-tag-version@12.7.3`, which is the maintained fork). A dry-run confirmed it would REGENERATE the CHANGELOG body with raw commits, destroying the curated content, **unless** `--skip.changelog` is passed. The current `.versionrc.json` skips bump/tag/commit but NOT changelog, making it the wrong config for the full bump-tag-commit flow. The invocation for Phase 6 requires overriding `.versionrc.json` with CLI flags to suppress changelog regeneration.

The npm readiness gate has one confirmed item (scope ownership: `adexdsamson` is confirmed owner via `npm org ls`), one unverifiable item without the token itself (automation token type — requires human confirmation), and one runnable pre-flight check (`npm publish --dry-run`). The `NPM_ACCESS_TOKEN` secret IS registered in the repo (confirmed via `gh secret list`, updated 2024-03-09). The package does NOT yet exist on the registry — `npm view @adexdsamson/forge` returns 404 — making this a genuine first publish.

**Primary recommendation:** Run readiness gate first, bump via `commit-and-tag-version --release-as 1.0.0 --skip.changelog` (with a manual CHANGELOG heading edit), open a release PR, merge, tag the merged commit, create GitHub Release, watch CI publish, then run the live smoke.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version bump + CHANGELOG heading | Local dev machine | — | `commit-and-tag-version` runs locally; edits `package.json` + `CHANGELOG.md` |
| Git tag creation | Local dev machine | GitHub (Release tag) | Tag created locally after PR merge, OR via GitHub Release UI (both are valid) |
| npm publish | CI (GitHub Actions) | — | D-02: provenance requires OIDC `id-token: write` only available in CI |
| Artifact build (`prepack`) | CI (GitHub Actions) | — | `prepack` triggers automatically during `npm publish` on CI |
| Smoke test | Local dev machine (Windows) | — | Post-publish verification runs on the developer's machine |
| npm scope ownership gate | npm registry + human | — | Requires the account owner to confirm token type; cannot be automated |

---

## Standard Stack

### Core Tools Already Installed
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| `commit-and-tag-version` | `12.7.3` (devDep) | Version bump + CHANGELOG + git tag | [VERIFIED: node_modules] |
| `npm` | (project npm) | Pack, dry-run, install | [VERIFIED: package-lock.json present] |
| `gh` (GitHub CLI) | (system) | Create release, check secrets, list tags | [VERIFIED: used in research] |

### Supporting
| Tool | Purpose | Where It Lives |
|------|---------|---------------|
| `.versionrc.json` | `commit-and-tag-version` config — currently skips bump/tag/commit; MUST be overridden for Phase 6 | Repo root |
| `publish.yml` | The CI publish executor — do not modify | `.github/workflows/publish.yml` |
| `smoke.ts` + `tsconfig.json` | Existing smoke scaffold | `c:\Temp\forge-smoke-test\` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `commit-and-tag-version` | Manual `npm version` + CHANGELOG edit | Manual is simpler and avoids the body-regeneration footgun, but loses the standard tool cohesion with Phase 5 D-15 |
| CI-gated GitHub Release trigger | `workflow_dispatch` manual trigger | `workflow_dispatch` is already present as fallback; the release-publish path is the intended steady state |

---

## Research Question Answers

### Q1: `commit-and-tag-version` — Exact Invocation for v1.0.0

**Tool name:** The installed tool is `commit-and-tag-version` (NOT `standard-version`). `standard-version` is deprecated; `commit-and-tag-version` is its maintained fork. The `changelog` script in `package.json` already uses it. [VERIFIED: `node_modules/commit-and-tag-version/package.json` version 12.7.3]

**Current `.versionrc.json` state:**
```json
{
  "skip": {
    "bump": true,
    "tag": true,
    "commit": true
  }
}
```
This config was set in Phase 5 to allow changelog-only generation (`npm run changelog`). It skips bump, tag, and commit — but does NOT skip changelog. For Phase 6, the full bump+commit+tag flow is needed.

**The CHANGELOG body-regeneration problem (CRITICAL FOOTGUN):**
Dry-run confirmed: running `commit-and-tag-version --release-as 1.0.0` without `--skip.changelog` would:
1. Regenerate the CHANGELOG with a new `## 1.0.3 (2026-05-31)` header (using the CURRENT version, not 1.0.0)
2. Populate the body with ~20 raw commit messages from the extraction history
3. DISCARD the curated `## [Unreleased]` content

[VERIFIED: dry-run output observed in research session]

**Recommended invocation to preserve curated body:**

**Option A — Skip changelog entirely (safest for curated body):**
```powershell
# Step 1: Manually edit CHANGELOG.md to rename [Unreleased] -> [1.0.0] - 2026-06-01
# Step 2: Run bump+commit+tag with changelog skipped
npx commit-and-tag-version --release-as 1.0.0 --skip.changelog --no-verify
```

`--skip.changelog` is a valid CLI flag (confirmed: `--help` output shows `--skip` map). It prevents the tool from touching CHANGELOG.md while still bumping `package.json`, creating the commit, and creating the git tag.

**Option B — Override .versionrc.json with a Phase-6-specific invocation:**
```powershell
npx commit-and-tag-version --release-as 1.0.0 --skip.changelog
```

**Tag format:** Default tag prefix is `v` (confirmed from `--help`: `--tag-prefix [string] [default: "v"]`). The command creates tag `v1.0.0`. [VERIFIED: CLI help output]

**What `--release-as 1.0.0` does:** Forces the version to exactly `1.0.0` regardless of commit-type inference. Without this flag, since the current version in `package.json` is `1.0.3`, the tool would normally increment it further. `--release-as` overrides the SemVer logic entirely. [VERIFIED: CLI help output]

**`--first-release` flag (irrelevant here):** There is a `--first-release` flag that was designed to handle the no-prior-tags case — it is NOT needed here because we're using `--release-as` to force the exact version.

**`--no-verify` flag:** Bypasses git pre-commit and commit-msg hooks. Include if the project has husky hooks that would block the automated commit. Currently no husky is detected, but including it is defensive. [ASSUMED — no husky config file was found in repo root, but not exhaustively checked]

**Commit message format:** The tool creates a commit like `chore(release): 1.0.0`. No conventional-commit prefix that would trigger CI/CD rules.

**Full steps for the CHANGELOG+bump+tag flow:**
1. Manually edit `CHANGELOG.md`: change `## [Unreleased]` to `## [1.0.0] - 2026-06-01` (one-line edit)
2. Run: `npx commit-and-tag-version --release-as 1.0.0 --skip.changelog`
3. Verify: `package.json` version is now `1.0.0`, git tag `v1.0.0` exists locally, `CHANGELOG.md` heading is correct, commit `chore(release): 1.0.0` is created

**Alternative simpler approach (no tool, fully transparent):**
```powershell
# 1. Edit CHANGELOG.md heading manually
# 2. Edit package.json version: 1.0.3 -> 1.0.0
# 3. Edit package-lock.json version to match (or npm install --package-lock-only)
# 4. git add CHANGELOG.md package.json package-lock.json
# 5. git commit -m "chore(release): 1.0.0"
# 6. git tag v1.0.0
```
This avoids the tool entirely and is fully transparent. The planner may prefer this for a one-time first release.

---

### Q2: npm Readiness Gate (D-06) — Exact Commands

**a) Confirm `@adexdsamson` scope ownership:**
```powershell
npm org ls adexdsamson --registry https://registry.npmjs.org
```
Expected output if owner: `adexdsamson - owner`
[VERIFIED: ran during research — output was `adexdsamson - owner`]

Note: This requires being logged in to npm locally (`npm login`). Locally, the machine is NOT currently logged in (`npm whoami` returned ENEEDAUTH). This command must be run either (a) after `npm login`, or (b) the human can confirm scope ownership directly on npmjs.org. Since D-06 says "confirm the npm account owns the `@adexdsamson` scope," this is a human-confirmation step.

**b) Confirm `NPM_ACCESS_TOKEN` is an automation/granular token:**
This CANNOT be done unattended by an agent. The token is stored in GitHub Secrets (`NPM_ACCESS_TOKEN` — confirmed present, set 2024-03-09). Determining the token type requires:
1. The human visits npmjs.com → Access Tokens
2. Locates the token used for `NPM_ACCESS_TOKEN`
3. Confirms it is type "Automation" (bypasses 2FA) or "Granular Access Token" with publish permissions and 2FA bypass

If the token is a "Publish" (legacy) or "Read-only" token, or was created before the account enabled 2FA, it may fail. An "Automation" token is the correct type for unattended CI publish.

**The NPM_ACCESS_TOKEN secret exists but is from 2024-03-09** — this is ~2 years old. The planner should include a human task to verify it has not expired and is the correct type.

**c) `npm publish --dry-run`:**
```powershell
cd "C:\Users\HomePC\Documents\GitHub\Forge"
npm publish --dry-run --access public
```
Expected output: dry-run listing of files (same as `npm pack --dry-run`), no actual publish. This runs `prepack` (rebuilds dist) and lists the tarball contents. If it exits 0, the package structure is valid.

Note: `npm publish --dry-run` does NOT require npm authentication (it doesn't contact the registry). It validates the local package structure. [VERIFIED: npm behavior]

**npm pack --dry-run current output (pre-bump):**
```
npm notice name: @adexdsamson/forge
npm notice version: 1.0.3
npm notice filename: adexdsamson-forge-1.0.3.tgz
npm notice package size: 45.7 kB
npm notice unpacked size: 187.0 kB
npm notice total files: 8
```
Files: `LICENSE`, `ReadMe.md`, `dist/index.cjs.js`, `dist/index.cjs.js.map`, `dist/index.d.ts`, `dist/index.esm.js`, `dist/index.esm.js.map`, `package.json`.

After bumping to 1.0.0, filename becomes `adexdsamson-forge-1.0.0.tgz`. Same 8 files.

**Package does NOT yet exist on registry:** `npm view @adexdsamson/forge` returns 404. This is a clean first publish. [VERIFIED: npm view output]

**Readiness gate summary — which steps need the human:**
| Step | Can Agent Do? | Notes |
|------|--------------|-------|
| `npm org ls adexdsamson` | After human does `npm login` | Or human checks npmjs.com directly |
| Confirm automation token type | HUMAN ONLY | Requires npmjs.com account access |
| Confirm token not expired | HUMAN ONLY | Check npmjs.com Access Tokens page |
| `npm publish --dry-run` | Agent (after version bump) | Does not require registry auth |

---

### Q3: PR-Then-Tag Flow (D-05)

**Branch protection status:** VERIFIED via GitHub API — `main` is NOT currently protected (`.protected = false`, `.protection.enabled = false`). [VERIFIED: GitHub API]

This means pushing directly to `main` is technically possible, but D-05 specifies the PR-then-tag flow regardless. The flow:

```
1. git checkout -b release/v1.0.0
2. [Manual] Edit CHANGELOG.md: [Unreleased] → [1.0.0] - 2026-06-01
3. npx commit-and-tag-version --release-as 1.0.0 --skip.changelog
   # Creates commit "chore(release): 1.0.0" and local tag v1.0.0
   # BUT the tag is on the branch, not yet on main
4. git push origin release/v1.0.0
5. [HUMAN] Open PR: release/v1.0.0 → main
6. [HUMAN] Merge PR (squash or merge commit — see note below)
7. [AGENT/HUMAN] git checkout main && git pull origin main
8. git tag v1.0.0 $(git rev-parse HEAD)  # Re-tag on the merged main commit
   # OR: delete the branch-commit tag first:
   git tag -d v1.0.0
   git tag v1.0.0  # tags HEAD = merged main commit
9. [HUMAN] gh release create v1.0.0 --title "v1.0.0" --notes "..." --target main
   # This creates the GitHub Release AND the tag on GitHub simultaneously
   # (preferred over local tag push — see below)
```

**IMPORTANT: Tag alignment hazard with squash merges.** If the PR is merged via "Squash and merge" (creates a new commit hash on main different from the branch commit), the local tag `v1.0.0` will point at the branch commit, NOT the merged main commit. The agent must re-tag after merge, or use `gh release create` which creates the tag on the target commit directly.

**Preferred approach: Let `gh release create` handle the tag.**
```powershell
# After PR merges to main:
git checkout main
git pull origin main
# Do NOT push the local tag — create the release instead:
gh release create v1.0.0 --title "v1.0.0" --target main --notes "[release notes]"
```
`gh release create` creates both the GitHub Release AND the `v1.0.0` tag pointing at the current HEAD of `main`. This guarantees the tag is on the merged commit. [VERIFIED: gh CLI documentation behavior]

**publish.yml trigger:** The workflow fires on `release: types: [published]`. `gh release create` creates a published release by default. The tag is created as part of the GitHub Release, not pushed separately.

---

### Q4: publish.yml Trigger Mechanics (Confirmed from File)

**Trigger event (VERIFIED from `.github/workflows/publish.yml`):**
```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
```

The workflow fires when a GitHub Release is **published** (not drafted). `gh release create` by default creates a published release. If `--draft` is used, the publish step will NOT fire.

**What the human must do:**
1. Go to GitHub → Releases → Draft a new release (OR use `gh release create`)
2. Target: `main` branch
3. Tag: `v1.0.0` (new tag, created at this point)
4. Click "Publish release" (not "Save as draft")

**OR via CLI:**
```powershell
gh release create v1.0.0 --title "v1.0.0" --target main --notes "First public release..."
```

**publish.yml job sequence (VERIFIED):**
1. Checkout (SHA-pinned: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`)
2. Setup Node 20 + registry-url = `https://registry.npmjs.org` (SHA-pinned: `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020`)
3. `npm ci` (installs from lockfile)
4. `npm run lint` (ESLint + Prettier check — fails publish if violations)
5. `npm test` (Vitest with coverage — fails publish if tests fail or coverage thresholds not met)
6. `npm publish --provenance --access public` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_ACCESS_TOKEN }}`

**Permissions:** `id-token: write` is set — this is what enables npm provenance. [VERIFIED: workflow YAML]

**workflow_dispatch:** Already present as a fallback. It also runs lint + test before publish — it is NOT a bypass mechanism. [VERIFIED: workflow YAML — lint+test steps run before publish unconditionally]

**No mismatch between D-02/D-05 and the YAML:** The workflow correctly listens for `release: types: [published]`, which is exactly what `gh release create` fires.

---

### Q5: Post-Publish Smoke Test (D-07 / SC1+SC2) — Exact Steps

**Existing smoke scaffold at `c:\Temp\forge-smoke-test`:**
The directory exists with: `node_modules/`, `package-lock.json`, `package.json`, `smoke.ts`, `tsconfig.json`. [VERIFIED: directory listing]

**Current smoke.ts (Phase 4 tarball test):**
```typescript
import { useForge, Forge, Forger } from "@adexdsamson/forge";
const _check = { useForge, Forge, Forger }
```
Only imports 3 of the 6 exports. For D-07 / SC2, the smoke must import all 6: `useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist`.

**Current package.json (smoke):** Points to a local tarball `file:../../Users/HomePC/Documents/GitHub/Forge/adexdsamson-forge-1.0.3.tgz`. Must be updated to point at the live registry version `@adexdsamson/forge@1.0.0`.

**Smoke test tsconfig.json:** Has `"verbatimModuleSyntax": false` and `"skipLibCheck": true`. The Phase-4 TS1295 false alarm (`verbatimModuleSyntax`) was caused by the default tsconfig in a scaffold that had `verbatimModuleSyntax: true`. The smoke tsconfig already has it disabled — not a risk here.

**Exact steps for Phase 6 live-registry smoke (Windows PowerShell):**

```powershell
# Step 1: Update smoke project to use the live registry package
cd "C:\Temp\forge-smoke-test"

# Remove local tarball reference, install from live registry
npm uninstall @adexdsamson/forge
npm install @adexdsamson/forge react react-hook-form

# Step 2: Update smoke.ts to test all 6 exports (edit file)
# Content: see below

# Step 3: Run tsc
npx tsc --noEmit

# Expected: exit 0, zero errors
```

**Updated smoke.ts content:**
```typescript
import { useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist } from "@adexdsamson/forge";

const _check = { useForge, Forge, Forger, useFieldArray, useForgeValues, usePersist };
```

**Acceptance criteria:**
- `npm install @adexdsamson/forge` exits 0 (SC1)
- `tsc --noEmit` exits 0 with zero type errors (SC2)
- `npm view @adexdsamson/forge version` returns `1.0.0` (SC3 registry side)
- `git tag -l v1.0.0` on `main` returns the tag (SC3 git side)

**Known false-alarm gotcha (from project memory — Phase 4):** TS1295 (`verbatimModuleSyntax`) is a consumer tsconfig issue, not a Forge typing issue. The real failure indicator is TS2307 ("Cannot find module '@adexdsamson/forge' or its corresponding type declarations"). If TS2307 fires: `dist/index.d.ts` was not included in the tarball or the `types` field in `package.json` is wrong. Current `npm pack --dry-run` confirms `dist/index.d.ts` IS included. [VERIFIED: npm pack dry-run output]

---

### Q6: Sequencing / Ordering Hazards

**Irreversible actions:**
- Publishing a version to npm is irreversible after 72 hours (the `npm unpublish` window). Version `1.0.0` cannot be re-used once published. [ASSUMED — npm deprecation/unpublish policy; well-known npm behavior]
- Creating a GitHub Release fires CI immediately. There is no undo for a publish started by CI.

**Required sequence:**
```
1. [HUMAN] Readiness gate:
   a. Confirm npm scope ownership (npmjs.com or npm org ls)
   b. Confirm NPM_ACCESS_TOKEN type is "Automation" (npmjs.com Access Tokens page)
   c. Confirm token not expired (2024-03-09 vintage — 2 years old)
   *** HARD STOP: Do not proceed if (b) or (c) fail ***

2. [AGENT] Version bump + CHANGELOG heading:
   a. Edit CHANGELOG.md: [Unreleased] → [1.0.0] - 2026-06-01
   b. npx commit-and-tag-version --release-as 1.0.0 --skip.changelog
      (creates: package.json version=1.0.0, package-lock.json updated,
       commit "chore(release): 1.0.0", local tag v1.0.0)
   c. git push origin release/v1.0.0  (push branch; NOT the tag yet)

3. [AGENT] npm publish --dry-run
   *** HARD STOP: Do not proceed if this exits non-zero ***

4. [HUMAN] Open PR: release/v1.0.0 → main

5. [HUMAN] Merge PR to main

6. [AGENT] git checkout main && git pull origin main

7. [HUMAN] gh release create v1.0.0 --title "v1.0.0" --target main --notes "..."
   (creates GitHub Release → fires publish.yml → CI runs lint+test+publish)
   *** Creates the tag on GitHub, pointing at merged main commit ***

8. [AGENT] Monitor CI run: gh run watch

9. [AGENT/HUMAN] Verify CI publish succeeded (gh run view)

10. [HUMAN] Post-publish smoke test:
    a. Update c:\Temp\forge-smoke-test to install from live registry
    b. npm install @adexdsamson/forge
    c. Update smoke.ts to import all 6 exports
    d. npx tsc --noEmit → exit 0
    e. npm view @adexdsamson/forge version → "1.0.0"
    f. gh release view v1.0.0 → confirm release exists on main
```

**Autonomous vs. human-in-loop classification:**
| Step | Autonomous | Human Required | Reason |
|------|-----------|----------------|--------|
| Edit CHANGELOG.md heading | Agent | — | File edit |
| Run commit-and-tag-version | Agent | — | CLI tool |
| npm publish --dry-run | Agent | — | CLI tool, no auth needed |
| Open PR | Agent (`gh pr create`) | — | Unless policy requires human |
| Merge PR | — | HUMAN | Merge decision |
| Create GitHub Release | — | HUMAN | Triggers irreversible publish |
| Confirm token type/expiry | — | HUMAN | npmjs.com account access |
| Monitor CI run | Agent | — | `gh run watch` |
| Post-publish smoke | Agent | — | Local CLI |
| SC3 verification | Agent | — | `npm view` + `git tag` |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version bump + tag | Manual sed on package.json | `commit-and-tag-version` | Handles package.json + package-lock.json + git commit + tag atomically |
| npm provenance attestation | Local publish with manual attestation | CI with `id-token: write` | OIDC attestation is CI-only; local publish cannot produce the verified badge |
| Publish auth | Hardcoded credentials | `NODE_AUTH_TOKEN` env var from GitHub Secret | npm's standard mechanism; token is already configured |
| GitHub Release creation | GitHub web UI only | `gh release create` | CLI creates release + tag in one atomic step, guarantees tag points at correct commit |

---

## Common Pitfalls

### Pitfall 1: commit-and-tag-version Regenerates CHANGELOG Body
**What goes wrong:** Running `npx commit-and-tag-version --release-as 1.0.0` without `--skip.changelog` replaces the curated `[Unreleased]` content with a raw dump of all extraction-era commits under a `## 1.0.3 (2026-05-31)` header.
**Why it happens:** The tool regenerates the changelog from git commit history by default. With no prior tags, it sweeps ALL commits.
**How to avoid:** Pass `--skip.changelog` on the CLI. Manually edit the CHANGELOG heading before running the tool.
**Warning signs:** Dry-run output shows `## 1.0.3 (2026-05-31)` header or lists individual phase commit messages.
[VERIFIED: dry-run output confirmed this behavior]

### Pitfall 2: Tag Points at Branch Commit, Not Merged Main Commit
**What goes wrong:** If the PR is squash-merged, the merge commit on `main` has a different SHA than the branch tip. Pushing the local `v1.0.0` tag (created by `commit-and-tag-version`) will point at the wrong commit.
**Why it happens:** Squash merge creates a new commit. The local tag was created before the merge.
**How to avoid:** Use `gh release create v1.0.0 --target main` — this creates the tag on `main` HEAD at the moment of release creation, after the PR has merged.
**Warning signs:** `git log --oneline v1.0.0` shows the branch tip SHA, not the merge commit SHA on main.

### Pitfall 3: NPM_ACCESS_TOKEN Is Stale or Wrong Type
**What goes wrong:** CI publish step fails with `npm error 403 Forbidden` or `npm error OTP required`. publish.yml exits non-zero; package is not published.
**Why it happens:** The `NPM_ACCESS_TOKEN` secret was set in 2024-03-09 (2+ years ago). Token may have expired, been revoked, or be the wrong type (Publish token instead of Automation token — Automation type bypasses OTP/2FA on publish).
**How to avoid:** Human must verify the token at npmjs.com → Access Tokens BEFORE creating the GitHub Release.
**Warning signs:** CI publish step fails; `gh run view` shows the Publish step exited with code 1.

### Pitfall 4: workflow_dispatch Does Not Skip Lint/Test
**What goes wrong:** Human uses `workflow_dispatch` thinking it's a fast-path bypass, but it still runs lint + test. If lint fails (e.g. unformatted file), publish is blocked.
**Why it happens:** `workflow_dispatch` trigger runs the same job as the release trigger. No bypass path.
**How to avoid:** Ensure `npm run lint` and `npm test` both pass locally before creating the release.
**Warning signs:** `workflow_dispatch` run fails at Lint step.

### Pitfall 5: Smoke Test Installs Stale Tarball Instead of Live Package
**What goes wrong:** `c:\Temp\forge-smoke-test` `package.json` still references `file:../../Users/HomePC/Documents/GitHub/Forge/adexdsamson-forge-1.0.3.tgz`. Running `npm install` installs the old local tarball, not the live published package.
**Why it happens:** The smoke project was left in tarball-test mode from Phase 4.
**How to avoid:** Remove the `@adexdsamson/forge` dependency from the smoke `package.json` and `npm install @adexdsamson/forge` (without `file:` prefix) to pull from the live registry.
**Warning signs:** `npm ls @adexdsamson/forge` shows `file:..` path instead of the registry version.

### Pitfall 6: ReadMe.md vs README.md Casing (Windows/npm)
**What goes wrong:** `npm pack --dry-run` shows `ReadMe.md` in the tarball (capital R, lowercase md). On case-insensitive Windows FS this works fine; on the CI Ubuntu runner it may not pick up the file.
**Why it happens:** The file was committed with mixed case. Linux is case-sensitive.
**How to avoid:** Verify the file is accessible on CI. Currently CI runs lint + test and publishes — README is included in the tarball by npm auto-inclusion rules, which work by the file name on disk. Since it's already shipping in the 1.0.3 dry-run, it should be fine.
**Warning signs:** Tarball installs without README on Linux; not a blocking issue for type-checking.
[ASSUMED — casing behavior on case-sensitive FS; low risk]

---

## Code Examples

### commit-and-tag-version: Full Release Flow
```powershell
# Run from C:\Users\HomePC\Documents\GitHub\Forge
# Step 1: Edit CHANGELOG.md heading manually (one line)
# Change: ## [Unreleased]
# To:     ## [1.0.0] - 2026-06-01

# Step 2: Bump, commit, tag — skip changelog to preserve curated body
npx commit-and-tag-version --release-as 1.0.0 --skip.changelog

# Expected output:
# √ bumping version in package.json from 1.0.3 to 1.0.0
# √ bumping version in package-lock.json from 1.0.3 to 1.0.0
# √ tagging release v1.0.0
# [release v1.0.0] Run `git push --follow-tags origin main` to publish

# Step 3: Push branch (NOT main directly per D-05)
git push origin release/v1.0.0
# Note: Do NOT push the tag yet — use gh release create after PR merges
```

### GitHub Release Creation (fires publish.yml)
```powershell
# After PR merges to main and you've pulled the merged commit:
git checkout main
git pull origin main

# Create release — creates tag v1.0.0 on main HEAD, fires publish.yml
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Public Release" \
  --target main \
  --notes "First public release of @adexdsamson/forge..."
```

### npm Publish Dry-Run
```powershell
cd "C:\Users\HomePC\Documents\GitHub\Forge"
npm publish --dry-run --access public
# Runs prepack (rebuilds dist), lists tarball, exits 0 if valid
# Does NOT require npm login
```

### Post-Publish Live Smoke (PowerShell, c:\Temp\forge-smoke-test)
```powershell
cd "C:\Temp\forge-smoke-test"

# Reinstall from live registry (not tarball)
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install @adexdsamson/forge@1.0.0 react react-hook-form

# Verify install
npm ls @adexdsamson/forge  # should show version from registry (not file:)

# Run type check
npx tsc --noEmit
# Expected: exit 0, zero output

# Verify registry version
npm view @adexdsamson/forge version  # should output: 1.0.0
```

### npm Scope Ownership Check
```powershell
# Requires being logged in to npm
npm login  # interactive — human must do this
npm org ls adexdsamson --registry https://registry.npmjs.org
# Expected: adexdsamson - owner
```

### Monitor CI Publish Run
```powershell
gh run list --workflow publish.yml --limit 5
gh run watch  # watch the most recent run live
# or:
gh run view <run-id> --log
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `standard-version` | `commit-and-tag-version` | 2023 (standard-version deprecated) | CLI flags are identical; same behavior; package name differs |
| Manual npm publish | GitHub Release → CI publish | Phase 5 (D-08) | Provenance requires CI OIDC path |
| push-to-main trigger | release: [published] trigger | Phase 5 (D-08) | Prevents accidental publish on every merge |
| `npm publish` without provenance | `npm publish --provenance --access public` | Phase 5 (D-10) | Generates signed source-to-artifact attestation; "verified" badge on npmjs.org |

**Deprecated/outdated:**
- `standard-version`: Archived/deprecated in 2022. `commit-and-tag-version` is the fork that maintains compatibility. The installed package is the correct one.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No husky hooks are configured — `--no-verify` is defensive, not required | Q1 (commit-and-tag-version) | Low: if husky exists and fails, just add `--no-verify` |
| A2 | npm unpublish window is 72 hours (version cannot be re-used after that) | Q6 (Sequencing) | Low: the 72h window is npm documented policy; worst case is permanent version lock |
| A3 | ReadMe.md mixed casing will not block CI npm tarball inclusion on Ubuntu | Pitfall 6 | Low: file already ships in current dry-run; linux npm auto-includes README variants |
| A4 | `gh release create` without `--draft` creates a published release that fires the `release: [published]` event | Q3 / Q4 | Medium: if gh creates a draft by default, publish.yml won't fire; verify with `gh release view` after creation |

**Note on A4:** `gh release create` documentation states the release is published by default (not draft) unless `--draft` is explicitly passed. This is the established gh CLI behavior. [ASSUMED: not verified via live release creation in this session]

---

## Open Questions

1. **NPM_ACCESS_TOKEN token type (MUST resolve before release)**
   - What we know: Secret exists, set 2024-03-09
   - What's unclear: Whether it is "Automation" type (bypasses OTP) vs "Publish" type (may require OTP). "Publish" tokens created before 2FA was enforced on the account may work unattended; those created after may require OTP.
   - Recommendation: Human must check npmjs.com → Access Tokens and confirm token type. If it's not "Automation", regenerate it as an Automation or Granular token before proceeding.

2. **Token expiry**
   - What we know: Token set 2024-03-09 (2+ years ago)
   - What's unclear: Whether the token has a configured expiry date
   - Recommendation: Human checks the token expiry date on npmjs.com. Rotate if it has expired.

3. **package-lock.json lockfileVersion after bump**
   - What we know: `commit-and-tag-version` updates `package.json` and `package-lock.json` versions
   - What's unclear: Whether the lockfile format version needs updating
   - Recommendation: Verify lockfile is valid after bump with `npm ci --dry-run`; this is a low-risk item but worth checking

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `commit-and-tag-version` | Version bump | ✓ | 12.7.3 (devDep) | Manual npm version + git tag |
| `gh` (GitHub CLI) | Release creation, CI monitoring | ✓ | (used in research) | GitHub web UI |
| `npm` | Dry-run, smoke install | ✓ | (project npm) | — |
| `npx tsc` | Smoke type-check | ✓ | TypeScript in smoke `node_modules` | — |
| `NPM_ACCESS_TOKEN` (GitHub Secret) | CI publish | ✓ (exists) | Set 2024-03-09 — type unverified | Regenerate token |
| `@adexdsamson` npm scope | First publish | ✓ | Confirmed owner | — |
| `c:\Temp\forge-smoke-test` | Post-publish smoke | ✓ | Exists with scaffold | Create fresh at any temp location |

**Missing dependencies with no fallback:**
- NPM_ACCESS_TOKEN must be valid and of type "Automation" — human must verify before creating the release

**Missing dependencies with fallback:**
- If `gh` CLI unavailable: use GitHub web UI to create the Release

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (runs with `--coverage` per `package.json` script) |

### Phase Requirements → Test Map

Phase 6 is an **operate-the-pipeline** phase. There is no new application code to unit-test. Validation is entirely through the real-world publish pipeline smoke test.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUB-01 (SC1) | `npm install @adexdsamson/forge` succeeds in fresh project | smoke (manual) | `npm install @adexdsamson/forge` in smoke dir | Scaffold exists at `c:\Temp\forge-smoke-test` |
| PUB-01 (SC2) | 6 named exports import + type-check with zero errors | smoke (manual) | `npx tsc --noEmit` in smoke dir | `smoke.ts` needs update to 6 exports |
| PUB-01 (SC3) | Published version = `package.json` version = git tag on main | manual verification | `npm view @adexdsamson/forge version` + `git tag -l v1.0.0` | — |

### Sampling Rate
- **Per task commit:** `npm test` (unit/integration suite, confirms existing tests still pass)
- **Phase gate:** publish.yml CI run green (lint + test + publish all exit 0) + smoke test exit 0

### Wave 0 Gaps
- [ ] `smoke.ts` in `c:\Temp\forge-smoke-test` — update to import all 6 exports (currently only 3)
- [ ] `package.json` in smoke dir — update `@adexdsamson/forge` from `file:` tarball to live registry reference

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (npm publish auth) | Automation token via `NPM_ACCESS_TOKEN` GitHub Secret; no hardcoded credentials |
| V3 Session Management | no | Not applicable |
| V4 Access Control | yes (CI publish gating) | Lint + test gate in publish.yml; release-event trigger prevents unauthorized publish |
| V5 Input Validation | no | No user input in publish pipeline |
| V6 Cryptography | yes (provenance) | npm `--provenance` via OIDC `id-token: write`; no hand-rolled crypto |

### Known Threat Patterns for npm Publish Pipeline

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale/compromised npm token | Elevation of privilege | Rotate token before publish; use Automation type; confirm expiry |
| Unintended publish on branch push | Tampering | Release-event trigger (not push trigger); already implemented in publish.yml |
| Supply chain injection (action hijack) | Tampering | SHA-pinned actions in publish.yml; already implemented |
| Publish without test gate | Tampering | Lint + test steps precede publish step in publish.yml; cannot be skipped |
| Provenance dropped (local publish) | Repudiation | D-02 mandates CI-only publish; `--provenance` flag in publish step |

---

## Sources

### Primary (HIGH confidence)
- `C:\Users\HomePC\Documents\GitHub\Forge\.github\workflows\publish.yml` — verified trigger event, steps, permissions, auth mechanism
- `C:\Users\HomePC\Documents\GitHub\Forge\package.json` — verified version (1.0.3), scripts, publishConfig, devDeps
- `C:\Users\HomePC\Documents\GitHub\Forge\CHANGELOG.md` — verified curated [Unreleased] content
- `C:\Users\HomePC\Documents\GitHub\Forge\.versionrc.json` — verified skip config
- `C:\Temp\forge-smoke-test\` — verified existing scaffold contents
- `npx commit-and-tag-version --help` — verified CLI flags, tag prefix default, skip map
- `npx commit-and-tag-version --release-as 1.0.0 --dry-run` — confirmed CHANGELOG body regeneration behavior
- `npm pack --dry-run` — verified tarball contents and file list
- `npm view @adexdsamson/forge` — confirmed 404 (not yet published)
- `gh api repos/adexdsamson/Forge/branches/main` — confirmed no branch protection
- `gh api repos/adexdsamson/Forge/releases` — confirmed 0 existing releases
- `gh secret list` — confirmed `NPM_ACCESS_TOKEN` exists (set 2024-03-09)
- `npm org ls adexdsamson` — confirmed adexdsamson is scope owner

### Secondary (MEDIUM confidence)
- commit-and-tag-version `--skip.changelog` behavior: verified exit 0 with no output in dry-run; confirmed flag is in the `--skip` map documented in `--help`

### Tertiary (LOW confidence)
- npm 72h unpublish window policy (A2)
- `gh release create` publishes non-draft by default (A4)

---

## Metadata

**Confidence breakdown:**
- Version bump flow: HIGH — verified via dry-run and CLI help
- publish.yml trigger: HIGH — read from actual workflow file
- npm readiness gate: HIGH for what's verifiable; LOW for token type (cannot inspect GitHub Secret value)
- Smoke test: HIGH — existing scaffold inspected, exact commands derived from it
- Branch protection: HIGH — confirmed via GitHub API

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (stable tooling; npm token status may change)
