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

# Notes are saved into the version commit and used as the GitHub release body.
# npm has no separate notes field. A blank first line skips both.
NOTES_PATH="release-notes/${VERSION}.md"
NOTES_TMP=""
USE_NOTES=0

cleanup_notes_tmp() {
  if [[ -n "$NOTES_TMP" && -f "$NOTES_TMP" ]]; then
    rm -f "$NOTES_TMP"
  fi
}
trap cleanup_notes_tmp EXIT

collect_release_notes() {
  local dest="$1"
  local line
  local started=0
  : >"$dest"
  while IFS= read -r line; do
    if [[ "$started" -eq 0 && -z "$line" ]]; then
      rm -f "$dest"
      return 1
    fi
    if [[ "$line" == "." ]]; then
      break
    fi
    started=1
    printf '%s\n' "$line" >>"$dest"
  done
  if [[ ! -s "$dest" ]]; then
    rm -f "$dest"
    return 1
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
echo "  1. ask for release notes (Enter skips; a line with only . ends a paste)"
echo "  2. lint + test, bump package.json on develop, commit, tag $TAG, push develop + tag"
echo "  3. merge develop into main with a merge commit (no squash) and push main"
echo "  4. when notes were provided: commit $NOTES_PATH with the bump and create a GitHub release"
echo "  5. npm publish from $TAG"
echo ""

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo -e "${YELLOW}Dry run: lint and test only. No notes prompt, commit, tag, push, merge, or publish.${NC}"
  npm run lint
  npm run test
  echo -e "${GREEN}✓ Dry run complete. Re-run without --dry-run to release.${NC}"
  exit 0
fi

if [[ -f "$NOTES_PATH" ]]; then
  USE_NOTES=1
  echo -e "${GREEN}Using existing $NOTES_PATH${NC}"
else
  echo ""
  echo "Paste release notes for $TAG."
  echo "When the paste is finished, type a line that is only a period (.) and press Enter."
  echo "Or press Enter now to publish without release notes."
  NOTES_TMP="$(mktemp)"
  if collect_release_notes "$NOTES_TMP"; then
    USE_NOTES=1
    echo -e "${GREEN}Release notes captured.${NC}"
  else
    echo "No release notes. Publishing without a GitHub release."
  fi
fi
echo ""

confirm "Type yes to bump, merge to main, and continue toward publish"

if [[ "$USE_NOTES" -eq 1 && -n "$NOTES_TMP" ]]; then
  mkdir -p release-notes
  cp "$NOTES_TMP" "$NOTES_PATH"
fi

"$SCRIPT_DIR/bump-version.sh" "$VERSION"

echo -e "${YELLOW}Merging develop into main...${NC}"
git checkout main
git pull --ff-only origin main
git merge --no-ff develop -m "Merge branch 'develop' for $TAG"
git push origin main

echo -e "${YELLOW}Checking out $TAG for publish...${NC}"
git checkout "$TAG"

if [[ "$USE_NOTES" -eq 1 ]]; then
  echo -e "${YELLOW}Creating GitHub release $TAG...${NC}"
  if ! gh release create "$TAG" --title "podverse-partytime $VERSION" --notes-file "$NOTES_PATH"; then
    echo -e "${YELLOW}GitHub release was not created. After npm publish, run:${NC}"
    echo "  gh release create $TAG --title \"podverse-partytime $VERSION\" --notes-file $NOTES_PATH"
  fi
fi

confirm "Type yes to publish podverse-partytime@$VERSION to npm"

"$SCRIPT_DIR/publish-module.sh"

git checkout develop
echo ""
echo -e "${GREEN}✓ Released podverse-partytime@$VERSION${NC}"
echo "Next: bump podverse-partytime to $VERSION in the Podverse monorepo."
