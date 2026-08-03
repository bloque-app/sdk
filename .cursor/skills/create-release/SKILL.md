---
name: create-release
description: Creates and explains releases for the Bloque SDK monorepo using Changesets, Bun, version commits, and sdk-v/cli-v tags. Use when preparing, cutting, publishing, verifying, or documenting an SDK or CLI release.
---

# Create a Bloque SDK release

Use the repository files as the source of truth. Before acting, re-read:

- `package.json`
- `.changeset/config.json`
- `.github/workflows/release.yml`
- `.github/workflows/release-cli.yml`

The packages are in one Changesets fixed group, so versioning keeps all SDK packages and the CLI on the same version.

## Release model

1. Feature PRs add Changesets that describe user-visible changes.
2. `bun run version` consumes pending Changesets, updates package versions, and updates package changelogs.
3. A release commit is merged or pushed to `main`.
4. `sdk-vX.Y.Z` triggers publishing all non-CLI SDK packages to npm.
5. `cli-vX.Y.Z` triggers platform package publishing, the root CLI package, binaries, and a GitHub Release.

For a full repository release, create both tags at the same version. Never publish packages manually when the tag workflows are available.

## Safety rules

- Preserve unrelated user changes. Do not stash, discard, reset, or include them in the release.
- Release only from an up-to-date `main` with a clean working tree.
- Never retag an existing version or force-push a tag.
- Never use `scripts/bump.ts` for a normal release. It bypasses Changesets and changelog generation.
- Do not expose or print npm tokens.
- Do not push a commit or tag unless the user asked to create/publish the release.
- If the requested version disagrees with the Changesets result, stop and explain the mismatch.

## Prepare changes before release

For every releasable change, run:

```bash
bun run changeset
```

Select affected packages, choose the SemVer bump, and write a concise user-facing summary. Commit the generated `.changeset/*.md` file with the feature or fix.

SemVer guidance:

- `patch`: backward-compatible fixes and small improvements
- `minor`: backward-compatible features
- `major`: breaking API or behavior changes

Because the repository uses a fixed group, the highest pending bump determines the shared release bump.

## Cut a full release

### 1. Check repository state

```bash
git status --short
git branch --show-current
git fetch origin
git status --branch --short
bunx changeset status
```

Stop if the tree is dirty, the branch is not `main`, `main` is not synchronized with `origin/main`, or there are no intended pending Changesets.

Also verify that the target tags do not already exist:

```bash
git tag --list 'sdk-v*' --sort=-version:refname
git tag --list 'cli-v*' --sort=-version:refname
```

### 2. Validate before versioning

```bash
bun install --frozen-lockfile
bun run build
```

Fix failures before continuing.

### 3. Apply Changesets

```bash
bun run version
rm bun.lock
bun install
```

Deleting `bun.lock` is required with the repository's Bun version. A normal or forced install can leave stale workspace versions in the lockfile after package manifests are bumped. Regenerate it from scratch, then verify that every `workspaces` entry records the new package version.

Determine the resulting version from a package manifest:

```bash
bun -e "import pkg from './packages/sdk/package.json'; console.log(pkg.version)"
```

Review all modified package manifests and changelogs. Confirm every package has the same version and the changelog entries match the intended release.

### 4. Validate the versioned tree

```bash
bun run build
git diff --check
git status --short
```

The release diff should contain only expected package versions, changelogs, consumed Changesets, and the regenerated lockfile. Review third-party dependency changes carefully because regenerating the lockfile can update versions allowed by existing ranges.

### 5. Commit and push

Replace `X.Y.Z` with the verified manifest version:

```bash
git add .changeset packages bun.lock
git commit -m "chore(release): vX.Y.Z"
git push origin main
```

Stage only paths that actually belong to the release. The regenerated `bun.lock` must be included.

### 6. Tag the release

Create annotated tags from the pushed release commit:

```bash
git tag -a sdk-vX.Y.Z -m "SDK vX.Y.Z"
git tag -a cli-vX.Y.Z -m "CLI vX.Y.Z"
git push origin sdk-vX.Y.Z cli-vX.Y.Z
```

For an explicitly SDK-only or CLI-only release, push only its tag. Explain that all package manifests may still share the new version because of the fixed Changesets group.

## Verify publication

Watch both workflows:

```bash
gh run list --workflow release.yml --limit 5
gh run list --workflow release-cli.yml --limit 5
```

Inspect or watch the matching runs until they finish:

```bash
gh run watch <run-id> --exit-status
```

Then verify the published versions:

```bash
npm view @bloque/sdk version
npm view @bloque/cli version
```

For the CLI, also verify that the GitHub Release and binary assets exist.

If a workflow fails, report the failing job and logs. Fix forward when possible; do not delete or recreate published versions, and do not move existing tags.

## Report completion

Summarize:

- released version
- release commit
- tags pushed
- SDK and CLI workflow results
- npm versions verified
- GitHub Release URL for CLI
