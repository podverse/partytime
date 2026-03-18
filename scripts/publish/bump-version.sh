#!/bin/bash
# Bump version in package.json, commit, and create a git tag.
# Run from repo root. Uses --no-verify to bypass git hooks.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

# Require clean package.json so we don't overwrite uncommitted changes
if [[ -n $(git status --porcelain package.json) ]]; then
  echo -e "${RED}Error: package.json has uncommitted changes. Commit or stash them first.${NC}"
  exit 1
fi

echo -e "${YELLOW}Running lint and tests...${NC}"
npm run lint
npm run test
echo ""

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"
echo ""
read -p "Enter next version (e.g., 5.0.7): " VERSION

if [[ -z "$VERSION" ]]; then
  echo -e "${RED}Error: No version entered. Aborting.${NC}"
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format. Expected: X.Y.Z (e.g., 5.0.7)${NC}"
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Bumping version to $VERSION on branch '$CURRENT_BRANCH'...${NC}"

npm version "$VERSION" --no-git-tag-version

git add package.json
git commit --no-verify -m "chore: bump version to $VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo -e "${YELLOW}Pushing branch and tag to origin...${NC}"
git push --no-verify origin "$CURRENT_BRANCH"
git push --no-verify origin "v$VERSION"

echo -e "${GREEN}✓ Version bumped to $VERSION, committed, tagged v$VERSION, and pushed${NC}"
