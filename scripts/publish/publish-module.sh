#!/bin/bash
# Publish podverse-partytime to npm.
# Run from repo root. Run bump-version.sh first, then publish this tag.
# Use --dry-run to test without publishing.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DRY_RUN=""
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN="--dry-run"
    break
  fi
done

cd "$REPO_ROOT"

VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

# Ensure we're on the tag that matches package.json (or allow publishing from branch with warning)
CURRENT_TAG=$(git describe --tags --exact-match 2>/dev/null || true)
if [[ "$CURRENT_TAG" != "$TAG" ]]; then
  echo -e "${YELLOW}Warning: HEAD is not tagged as $TAG (got: ${CURRENT_TAG:-none}).${NC}"
  echo "Recommended: checkout the tag first, e.g. git checkout $TAG"
  read -p "Publish anyway from current HEAD? [y/N] " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# prepublishOnly will run lint, test, build before publish
if [[ -n "$DRY_RUN" ]]; then
  echo -e "${YELLOW}Running lint and tests (prepublishOnly would run on real publish)...${NC}"
  npm run lint
  npm run test
  npm run build
  echo -e "${YELLOW}Dry run: npm publish $DRY_RUN${NC}"
  npm publish $DRY_RUN
  echo -e "${GREEN}✓ Dry run complete. Remove --dry-run to publish for real.${NC}"
else
  echo -e "${YELLOW}Publishing podverse-partytime@$VERSION to npm...${NC}"
  npm publish
  echo -e "${GREEN}✓ Published podverse-partytime@$VERSION${NC}"
fi
