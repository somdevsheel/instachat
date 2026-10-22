#!/usr/bin/env bash
# ======================================================
# BACKUP BOTH DATABASES TO S3
# ======================================================
# Dumps MongoDB (documents) and PostgreSQL (social graph) and uploads
# both to S3 under one timestamped prefix, so a restore uses a matching
# pair. Run from cron, e.g. daily at 03:15:
#
#   15 3 * * * cd /home/ubuntu/instachat/backend && ./ops/backup.sh >> ~/backup.log 2>&1
#
# Needs: mongodump (mongodb-database-tools), pg_dump (same major
# version as the server or newer), aws CLI with write access to the
# bucket. Reads MONGO_URI / POSTGRES_URL from backend/.env.
#
#   BACKUP_S3_URI   e.g. s3://instachat-backups/prod   (required)
#
# Retention: set an S3 lifecycle rule on the bucket (e.g. expire after
# 30 days) instead of deleting here. Use a SEPARATE bucket from media,
# with versioning + block-public-access on.
# ======================================================
set -euo pipefail

cd "$(dirname "$0")/.."
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${MONGO_URI:?MONGO_URI is not set}"
: "${POSTGRES_URL:?POSTGRES_URL is not set}"
: "${BACKUP_S3_URI:?BACKUP_S3_URI is not set (e.g. s3://instachat-backups/prod)}"

STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[$STAMP] Dumping MongoDB..."
mongodump --uri="$MONGO_URI" --archive="$WORK/mongo.archive.gz" --gzip --quiet

echo "[$STAMP] Dumping PostgreSQL..."
pg_dump --dbname="$POSTGRES_URL" --format=custom --no-owner --file="$WORK/postgres.dump"

# Fail loudly on empty dumps rather than "successfully" uploading nothing.
for f in mongo.archive.gz postgres.dump; do
  if [[ ! -s "$WORK/$f" ]]; then
    echo "ERROR: $f is empty" >&2
    exit 1
  fi
done

echo "[$STAMP] Uploading to $BACKUP_S3_URI/$STAMP/ ..."
aws s3 cp "$WORK/mongo.archive.gz" "$BACKUP_S3_URI/$STAMP/mongo.archive.gz" --only-show-errors
aws s3 cp "$WORK/postgres.dump"    "$BACKUP_S3_URI/$STAMP/postgres.dump"    --only-show-errors

echo "[$STAMP] Backup complete: $BACKUP_S3_URI/$STAMP/"
