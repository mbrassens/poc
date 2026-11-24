# Proof of Concepts (`poc`)

A sandbox repository for self-contained technical proof-of-concepts and product experiments. Each POC lives in its own isolated directory under `pocs/<poc-name>/` with its own dependencies, documentation, and verification scripts so experiments never cross-contaminate.

## POC Index

| POC | Status | Stack | Date | Summary |
| --- | --- | --- | --- | --- |
| *(none yet)* | — | — | — | Ready for the first experiment |

> **Status legend:** `idea` · `in-progress` · `done` · `archived`

## Repository Structure

```text
.
├── AGENTS.md                 # Conventions & rules for coding agents and contributors
├── README.md                 # This file (includes the POC index)
├── _template/                # Starter template copied into new POCs
├── pocs/                     # Isolated POC directories (one folder per POC)
│   └── <poc-name>/
├── scripts/
│   └── new-poc.sh            # Helper to scaffold a new POC and feature branch
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/
        └── repo-hygiene.yml  # Lightweight isolation & hygiene checks
```

## Starting a New POC

```bash
./scripts/new-poc.sh <poc-slug>
```

This creates a feature branch `poc/<poc-slug>` and copies `_template/` into `pocs/<poc-slug>/`.

When ready to merge:
1. Ensure the POC builds/tests cleanly from inside `pocs/<poc-slug>/`.
2. Add a row to the **POC Index** table in this `README.md`.
3. Open a pull request against `main`.
