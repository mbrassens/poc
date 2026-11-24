# AGENTS.md — Repository Conventions

This repository hosts multiple independent Proof of Concepts (POCs). Keep every POC strictly isolated, lightweight, and reproducible.

## 1. Directory & Isolation Rules

- **One folder per POC:** Every POC lives under `pocs/<kebab-case-slug>/`.
- **Self-contained dependencies:** Never install packages or add language lockfiles (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc.) at the repository root. Each POC owns its own manifest, lockfile, `.env.example`, and build/test setup.
- **No cross-POC imports:** POCs must not import code or assets from another `pocs/<other>/` folder. Copy what you need so any POC can be deleted or extracted cleanly.
- **Required per-POC docs:** Every `pocs/<slug>/` folder must contain a `README.md` covering:
  - Goal / hypothesis being tested
  - Tech stack & prerequisites
  - Exact install, run, and test/verification commands
  - Findings / takeaways & next steps

## 2. Git & GitHub Workflow

- **Feature branches + PRs:** Never commit POC work directly to `main`. Create a focused branch `poc/<slug>` (or `chore/<slug>` for repo-level maintenance) and open a PR into `main`.
- **Small, logical commits:** Keep commit messages clear and scoped.
- **Update the root index:** When adding, completing, or archiving a POC, update the **POC Index** table in root `README.md`.
- **Zero secrets:** Never commit `.env` files, API keys, tokens, or credentials. Provide `.env.example` with placeholder values instead.

## 3. Scaffolding a New POC

Run the helper script from the repository root:

```bash
./scripts/new-poc.sh <poc-slug>
```

Or manually copy `_template/` to `pocs/<poc-slug>/` on a new `poc/<poc-slug>` branch.

## 4. Verification Before Opening a PR

Run all verification commands from inside `pocs/<slug>/` before declaring a POC ready:
1. Linter / typechecker (e.g., `tsc --noEmit`, `ruff`, `go vet`)
2. Automated tests (if applicable)
3. Build / smoke test of the core path
4. Verify `git status` has no untracked build artifacts or `.env` files
