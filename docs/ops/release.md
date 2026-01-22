# Release Workflow

- Semantic versioning starting at `v0.1.0`
- Tags: `v0.1.0`, `v0.1.1`, etc.
- Use Changesets for release notes and versioning.

## Release steps
1) Add a changeset: `pnpm changeset`
2) Version packages: `pnpm changeset:version`
3) Commit version bump
4) Tag: `git tag v0.x.y` and push tags
