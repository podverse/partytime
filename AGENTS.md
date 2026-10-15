# AI Agent Context

Guidance for coding assistants working in this repository
(`podverse-partytime`).

## Publish / release

Canonical steps: [scripts/publish/README.md](scripts/publish/README.md).

When the operator asks how to publish a new version, give them this from the
partytime repo root on **develop** (after `npm login` if `npm whoami` fails):

```bash
./scripts/publish/release.sh X.Y.Z
```

That script bumps on develop, merge-commits into main (never squash), and
publishes from the git tag. Do not bump on `main` first. After npm publish,
tell them to bump `podverse-partytime` in the Podverse monorepo.

Do not run `git push`, `npm publish`, or the publish scripts unless the
operator explicitly asks for that command in that message. Give copy-pasteable
commands instead.

## Release notes

Whenever you give the operator publish steps, include suggested release notes for the GitHub
release. `release.sh` asks them to paste that text (a line containing only `.` ends the paste,
Enter on the first prompt skips). Pasted notes are committed as `release-notes/X.Y.Z.md` with the
version bump and become the GitHub release body. npm has no separate notes field. Use
`release-notes/X.Y.Z.md` when it already exists; otherwise derive them from the
commits since the last formal tag:

```bash
LAST_TAG="$(git tag --list --sort=-v:refname | rg '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1)"
git log --no-merges --format='%s' "$LAST_TAG"..HEAD -- src
```

Partytime is a developer library, so notes are technical: breaking changes first, then added,
changed, and fixed (parsed tags, output shape, types). Leave out refactors, tests, and tooling.
Never describe a change the commits do not show. Put the notes in a fenced `text` block and say
they are a suggestion to edit before publishing.

## Tests

Operator-run: `npm test` (or a focused path) from the partytime repo root.
Do not run lint/test as a gate during implementation unless asked.
