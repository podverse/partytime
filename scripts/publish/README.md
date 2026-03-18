# Publishing podverse-partytime to npm

This directory contains scripts and steps for releasing new versions of
`podverse-partytime` to npm.

## Prerequisites

- Clean `package.json` (no uncommitted version changes) when running bump.
- npm account with publish access to the package.
- Logged in to npm: `npm whoami` (log in with `npm login` if needed).

## Process

### 1. Bump version

From the **repo root** (partytime):

```bash
./scripts/publish/bump-version.sh
```

The script will:

- Run `npm run lint` and `npm run test`.
- Prompt for the next version (e.g. `5.0.7`). Use [semver](https://semver.org/).
- Update `package.json` to that version.
- Commit the change with message `chore: bump version to X.Y.Z`.
- Create an annotated tag `vX.Y.Z`.
- Push the branch and the tag to `origin`.

### 2. Publish to npm

From the **repo root**, either:

**Option A: Publish from the new tag (recommended)**

```bash
git checkout v5.0.7   # use the tag you just pushed
./scripts/publish/publish-module.sh
```

**Option B: Publish from current branch**

```bash
./scripts/publish/publish-module.sh
```

The script will warn if HEAD is not the tag matching `package.json` and ask for
confirmation. `npm publish` runs the `prepublishOnly` lifecycle (lint, test,
build) before publishing.

**Dry run (no publish):**

```bash
./scripts/publish/publish-module.sh --dry-run
```

This runs lint, test, and build, then `npm publish --dry-run` so you can
verify without publishing.

### 3. After publishing

- `postpublish` in `package.json` runs `git push --tags` (tags are usually
  already pushed by bump-version.sh).
- In the Podverse monorepo, update the dependency on `podverse-partytime` to
  the new version and run install/build as needed.

## Script reference

| Script               | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `bump-version.sh`    | Bump version, commit, tag, push. Run first.          |
| `publish-module.sh`  | Publish to npm (optionally `--dry-run`). Run second.  |

## Version format

Use **X.Y.Z** (semver):

- **X** (major): Breaking API or behaviour changes.
- **Y** (minor): New features, backward compatible.
- **Z** (patch): Bug fixes, backward compatible.
