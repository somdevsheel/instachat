#!/usr/bin/env bash
# ======================================================
# RESTORE A BACKUP (from ops/backup.sh)
# ======================================================
# Restores a matching MongoDB + PostgreSQL pair into the databases
# given as arguments — point it at a STAGING / scratch copy first and
# verify, never straight at production.
#
#   ./ops/restore.sh s3://instachat-backups/prod/2026-10-22T031500Z \
#       "mongodb+srv://.../instachat_restore" \
#       "postgres://.../instachat_restore"
#
# The target PostgreSQL database must already exist and be empty.
# Practise this (a "restore drill") at least once before launch and
# after major changes: an untested backup is not a backup.
# ======================================================
set -euo pipefail

SRC="${1:?usage: restore.sh <s3-backup-prefix> <target-mongo-uri> <target-postgres-url>}"
TARGET_MONGO="${2:?target MongoDB URI required}"
TARGET_PG="${3:?target PostgreSQL URL required}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Downloading $SRC ..."
aws s3 cp "$SRC/mongo.archive.gz" "$WORK/mongo.archive.gz" --only-show-errors
aws s3 cp "$SRC/postgres.dump"    "$WORK/postgres.dump"    --only-show-errors

echo "Restoring MongoDB..."
mongorestore --uri="$TARGET_MONGO" --archive="$WORK/mongo.archive.gz" --gzip --drop --quiet

echo "Restoring PostgreSQL..."
pg_restore --dbname="$TARGET_PG" --no-owner --exit-on-error "$WORK/postgres.dump"

echo "Restore complete. Sanity-check counts, e.g.:"
echo "  mongosh \"$TARGET_MONGO\" --eval 'db.users.countDocuments()'"
echo "  psql \"$TARGET_PG\" -c 'SELECT count(*) FROM follows'"
