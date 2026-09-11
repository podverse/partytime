#!/bin/bash
# Full release: bump on develop, merge to main (no squash), publish from the tag.
# Prestep: npm login (this script only checks npm whoami).
# Run from repo root on a clean develop branch.
# Usage: ./scripts/publish/release.sh 5.0.15
#        ./scripts/publish/release.sh 5.0.15 --dry-run

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

DRY_RUN=0
VERSION=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --*)
      echo -e "${RED}Error: unknown option $arg${NC}"
      echo "Usage: ./scripts/publish/release.sh X.Y.Z [--dry-run]"
      exit 1
      ;;
    *)
      if [[ -n "$VERSION" ]]; then
        echo -e "${RED}Error: unexpected extra argument $arg${NC}"
        echo "Usage: ./scripts/publish/release.sh X.Y.Z [--dry-run]"
        exit 1
      fi
      VERSION="$arg"
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo -e "${RED}Error: version is required.${NC}"
  echo "Usage: ./scripts/publish/release.sh X.Y.Z [--dry-run]"
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format. Expected: X.Y.Z (e.g., 5.0.15)${NC}"
  exit 1
fi

TAG="v$VERSION"

confirm() {
  local prompt="$1"
  local answer
  read -r -p "$prompt [yes/N] " answer
  if [[ "$answer" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
}

echo -e "${YELLOW}Checking npm login...${NC}"
if ! npm whoami >/dev/null 2>&1; then
  echo -e "${RED}Error: not logged in to npm. Run this first:${NC}"
  echo "  npm login"
  exit 1
fi
echo -e "npm user: ${GREEN}$(npm whoami)${NC}"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "develop" ]]; then
  echo -e "${RED}Error: must run from develop (currently on '$CURRENT_BRANCH').${NC}"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo -e "${RED}Error: working tree is dirty. Commit or stash first.${NC}"
  git status --short
  exit 1
fi

echo -e "${YELLOW}Fetching origin...${NC}"
git fetch origin

if ! git rev-parse --verify origin/develop >/dev/null 2>&1; then
  echo -e "${RED}Error: origin/develop does not exist.${NC}"
  exit 1
fi

if ! git rev-parse --verify origin/main >/dev/null 2>&1; then
  echo -e "${RED}Error: origin/main does not exist.${NC}"
  exit 1
fi

LOCAL_DEV="$(git rev-parse develop)"
REMOTE_DEV="$(git rev-parse origin/develop)"
BASE_DEV="$(git merge-base develop origin/develop)"
if [[ "$LOCAL_DEV" != "$REMOTE_DEV" && "$LOCAL_DEV" == "$BASE_DEV" ]]; then
  echo -e "${RED}Error: develop is behind origin/develop. Pull first.${NC}"
  exit 1
fi
if [[ "$LOCAL_DEV" != "$REMOTE_DEV" && "$REMOTE_DEV" != "$BASE_DEV" ]]; then
  echo -e "${RED}Error: develop has diverged from origin/develop.${NC}"
  exit 1
fi

if git rev-parse --verify "$TAG" >/dev/null 2>&1; then
  echo -e "${RED}Error: tag $TAG already exists locally.${NC}"
  exit 1
fi
if git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo -e "${RED}Error: tag $TAG already exists on origin.${NC}"
  exit 1
fi

CURRENT_VERSION="$(node -p "require('./package.json').version")"
echo ""
echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"
echo -e "Next version:    ${GREEN}$VERSION${NC}"
echo ""
echo "This will:"
echo "  1. lint + test"
echo "  2. bump package.json on develop, commit, tag $TAG, push develop + tag"
echo "  3. merge develop into main with a merge commit (no squash) and push main"
echo "  4. npm publish from $TAG"
echo ""

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo -e "${YELLOW}Dry run: lint and test only. No commit, tag, push, merge, or publish.${NC}"
  npm run lint
  npm run test
  echo -e "${GREEN}✓ Dry run complete. Re-run without --dry-run to release.${NC}"
  exit 0
fi

confirm "Type yes to bump, merge to main, and continue toward publish"

"$SCRIPT_DIR/bump-version.sh" "$VERSION"

echo -e "${YELLOW}Merging develop into main...${NC}"
git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' for $TAG"
git push origin main

echo -e "${YELLOW}Checking out $TAG for publish...${NC}"
git checkout "$TAG"

confirm "Type yes to publish podverse-partytime@$VERSION to npm"

"$SCRIPT_DIR/publish-module.sh"

git checkout develop
echo ""
echo -e "${GREEN}✓ Released podverse-partytime@$VERSION${NC}"
echo "Next: bump podverse-partytime to $VERSION in the Podverse monorepo."
