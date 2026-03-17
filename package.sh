#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Packaging reStructuredText extension in $ROOT_DIR"

# Install dependencies using npm
if [ -f package-lock.json ]; then
  echo "Installing dependencies with npm ci..."
  npm ci --no-audit --no-fund
else
  echo "Installing dependencies with npm install..."
  npm install --no-audit --no-fund
fi

# Build extension
echo "Building extension..."
  # Update package version from GitVersion/git tags if available
  if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts['update-version'] ? 0 : 1)"; then
    echo "Running update-version to set package.json from Git tags..."
    npm run update-version || echo "update-version failed, continuing..."
  fi

  npm run compile --silent
  # continue

# Package using vsce (via npx)
echo "Packaging .vsix (using vsce)..."
if [ "${PRE_RELEASE:-}" = "true" ]; then
  npx -y vsce package --pre-release
else
  npx -y vsce package
fi

echo "Packaging complete. Locate the generated .vsix in $ROOT_DIR"
