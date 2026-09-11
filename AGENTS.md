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

## Tests

Operator-run: `npm test` (or a focused path) from the partytime repo root.
Do not run lint/test as a gate during implementation unless asked.
