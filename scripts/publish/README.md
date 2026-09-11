# Publishing podverse-partytime to npm

Use **`release.sh`** for a normal release. It bumps on **develop**, merges that
commit to **main** (merge commit, no squash), and publishes from the **git tag**.

Do **not** bump on `main` first. Do **not** squash-merge develop into main after
tagging: the tag must remain on a commit that exists on both branches.

Agent reminder: [AGENTS.md](/AGENTS.md).

## Prerequisites

- On **develop**, with the release work already committed and a clean working tree.
- Logged in to npm (`npm login` if `npm whoami` fails). This is a **prestep**;
  the release script does not log you in.

## Process

From the **repo root** (partytime), on **develop**:

```bash
npm whoami
./scripts/publish/release.sh 5.0.15
```

Replace `5.0.15` with the next semver. The script asks you to type `yes` before
git writes, and again before `npm publish`.

**Dry run** (lint + test + print the plan; no commit, tag, push, merge, or publish):

```bash
./scripts/publish/release.sh 5.0.15 --dry-run
```

### What release.sh does

1. Checks `npm whoami`, branch (`develop`), clean tree, and that `develop` is
   not behind or diverged from `origin/develop`.
2. Runs lint and test, bumps `package.json`, commits, tags `vX.Y.Z`, pushes
   **develop** and the tag.
3. Checks out `main`, fast-forward pulls, `merge --no-ff develop`, pushes `main`.
4. Checks out the tag and runs `npm publish`.
5. Checks out `develop` again.

After publishing, update `podverse-partytime` in the Podverse monorepo to the
new version and run install/build as needed.

## Manual steps (only if you cannot use release.sh)

### 1. Bump version on develop

```bash
./scripts/publish/bump-version.sh 5.0.15
```

Omit the version argument to be prompted. The script runs lint and test, commits
`chore: bump version to X.Y.Z`, tags `vX.Y.Z`, and pushes develop + the tag.

### 2. Merge develop to main (no squash)

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' for v5.0.15"
git push origin main
```

### 3. Publish from the tag

```bash
git checkout v5.0.15
./scripts/publish/publish-module.sh
```

**Publish dry run only:**

```bash
git checkout v5.0.15
./scripts/publish/publish-module.sh --dry-run
```

## Script reference

| Script               | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `release.sh`         | Full develop → bump → merge main → npm publish.      |
| `bump-version.sh`    | Bump, commit, tag, push. Called by `release.sh`.     |
| `publish-module.sh`  | Publish to npm from the matching tag.                |

## Version format

Use **X.Y.Z** (semver):

- **X** (major): Breaking API or behaviour changes.
- **Y** (minor): New features, backward compatible.
- **Z** (patch): Bug fixes, backward compatible.
