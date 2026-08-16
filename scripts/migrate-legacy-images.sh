#!/usr/bin/env bash
#
# Lab 2 deliverable: lift-and-shift of KriptoStream's legacy DLT images into
# Artifactory, so the legacy registry can be decommissioned.
#
# The images are pulled from their public source, retagged onto the
# KriptoStream naming scheme, and pushed through the JFrog CLI so the migration
# itself is recorded as Build Info.
#
# Usage:
#   ./scripts/migrate-legacy-images.sh
#   BUILD_NUMBER=42 ./scripts/migrate-legacy-images.sh
#
set -euo pipefail

REGISTRY="${REGISTRY:-kripto1abs.jfrog.io}"
REPO="${REPO:-krypto-data-docker-prod-local}"
SERVER_ID="${SERVER_ID:-kripto-admin}"
PROJECT="${PROJECT:-krypto-data}"
BUILD_NAME="${BUILD_NAME:-krypto-legacy-migration}"
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d%H%M%S)}"

# source image | target image:tag - the DLT service each legacy image stands in for
LEGACY_IMAGES=(
  "busybox:1.34.1|dlt-data-feed:1.34.1"
  "busybox:1.35.0|dlt-data-feed:1.35.0"
  "alpine:3.18|dlt-base:3.18"
  "alpine:3.19|dlt-base:3.19"
)

log() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }

log "authenticating the Docker client against $REGISTRY"
jf docker login --server-id "$SERVER_ID"

for entry in "${LEGACY_IMAGES[@]}"; do
  src="${entry%%|*}"
  dst="${entry##*|}"
  target="$REGISTRY/$REPO/$dst"

  log "migrating $src -> $target"
  docker pull "$src"
  docker tag "$src" "$target"
  jf docker push "$target" \
    --build-name "$BUILD_NAME" \
    --build-number "$BUILD_NUMBER" \
    --server-id "$SERVER_ID" \
    --project "$PROJECT"
done

log "publishing Build Info: the chain of custody for the cut-over"
jf rt build-collect-env "$BUILD_NAME" "$BUILD_NUMBER"
jf rt build-publish "$BUILD_NAME" "$BUILD_NUMBER" \
  --server-id "$SERVER_ID" \
  --project "$PROJECT"

log "verifying what landed in $REPO"
jf rt search "$REPO/*/manifest.json" \
  --server-id "$SERVER_ID" \
  --project "$PROJECT" \
  | jq -r '.[].path'

log "migration complete (build $BUILD_NAME/$BUILD_NUMBER)"
