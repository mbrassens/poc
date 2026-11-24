#!/usr/bin/env bash
set -euo pipefail

POC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$POC_DIR/vendor"

KOBENTO_TS_SHA="cc51b00d81b6f7c8b50b34241429dc1df4346af8"
KOBENTO_TOOLS_SHA="10d50943dd6e14eae63b920049f21c7cfa67417d"

mkdir -p "$VENDOR_DIR"

fetch_repo() {
  local name="$1"
  local repo_url="$2"
  local sha="$3"
  local dest="$VENDOR_DIR/$name"

  if [ ! -d "$dest/.git" ]; then
    echo "Cloning $name at $sha..."
    git init "$dest" >/dev/null
    git -C "$dest" remote add origin "$repo_url"
    git -C "$dest" fetch --depth 1 origin "$sha"
    git -C "$dest" checkout --detach FETCH_HEAD >/dev/null
  else
    local current
    current="$(git -C "$dest" rev-parse HEAD)"
    if [ "$current" != "$sha" ]; then
      echo "Updating $name to $sha..."
      git -C "$dest" fetch --depth 1 origin "$sha"
      git -C "$dest" checkout --detach FETCH_HEAD >/dev/null
    else
      echo "$name already at pinned commit $sha"
    fi
  fi
}

fetch_repo "kobento-ts" "https://github.com/kobento/kobento-ts.git" "$KOBENTO_TS_SHA"
fetch_repo "kobento-tools" "https://github.com/kobento/kobento-tools.git" "$KOBENTO_TOOLS_SHA"

echo "Building kobento-ts web player bundle..."
# Use local esbuild from this POC so we don't need native canvas deps in kobento-ts
"$POC_DIR/node_modules/.bin/esbuild" \
  "$VENDOR_DIR/kobento-ts/src/web/main.ts" \
  --bundle \
  --outfile="$VENDOR_DIR/kobento-ts/web-player/bundle.js" \
  --format=iife \
  --target=es2020 \
  --global-name=RC

echo "Building kobento-tools json2rc compiler..."
if [ -f "$VENDOR_DIR/kobento-tools/json2rc/build.sh" ]; then
  (cd "$VENDOR_DIR/kobento-tools/json2rc" && bash build.sh)
fi

echo "Kobento vendor artifacts ready:"
ls -lh "$VENDOR_DIR/kobento-ts/web-player/bundle.js"
ls -la "$VENDOR_DIR/kobento-tools/json2rc/build" 2>/dev/null || true
