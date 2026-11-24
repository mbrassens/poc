#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/new-poc.sh <poc-slug> [--no-branch]"
  echo "Example: ./scripts/new-poc.sh kobento-sdui"
  exit 1
fi

SLUG="$1"
NO_BRANCH="${2:-}"

if ! [[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: POC slug must be kebab-case (lowercase letters, digits, hyphens). Got: '$SLUG'"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
TARGET_DIR="$REPO_ROOT/pocs/$SLUG"

if [ -d "$TARGET_DIR" ]; then
  echo "Error: $TARGET_DIR already exists."
  exit 1
fi

if [ "$NO_BRANCH" != "--no-branch" ]; then
  BRANCH="poc/$SLUG"
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    echo "Switching to existing branch $BRANCH..."
    git checkout "$BRANCH"
  else
    echo "Creating branch $BRANCH..."
    git checkout -b "$BRANCH"
  fi
fi

mkdir -p "$TARGET_DIR"
cp -R "$REPO_ROOT/_template/." "$TARGET_DIR/"

TODAY="$(date +%Y-%m-%d)"
sed -i.bak "s/YYYY-MM-DD/$TODAY/g; s/<poc-slug>/$SLUG/g" "$TARGET_DIR/README.md" && rm -f "$TARGET_DIR/README.md.bak"

echo "Scaffolded new POC at pocs/$SLUG"
echo "Next steps:"
echo "  1. Edit pocs/$SLUG/README.md with your goal and stack."
echo "  2. Build inside pocs/$SLUG/ (keep all dependencies local to that folder)."
echo "  3. Add a row for $SLUG to the root README.md POC Index before opening your PR."
