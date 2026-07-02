#!/usr/bin/env bash
#
# Deploy FAZ Academy to production.
#
#   ./deploy.sh              # push main, pull+build+reload on the server (zero-downtime)
#   ./deploy.sh --migrate    # also run `prisma db push` (apply schema.prisma changes to the DB)
#   ./deploy.sh --restart    # full pm2 restart instead of a rolling reload
#
# Config can be overridden via env vars, e.g.:
#   SSH_KEY=~/.ssh/faz REMOTE_HOST=1.2.3.4 ./deploy.sh
#
set -euo pipefail

# ---------------- config ----------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-143.198.94.130}"
REMOTE_USER="${REMOTE_USER:-admin}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/faz}"
SSH_KEY="${SSH_KEY:-$SCRIPT_DIR/faz-lms-server-access/faz_lms_ed25519}"
APP_NAME="${APP_NAME:-faz-api}"
BRANCH="${BRANCH:-main}"

# ---------------- args ----------------
MIGRATE=0
RESTART=0
for arg in "$@"; do
  case "$arg" in
    --migrate) MIGRATE=1 ;;
    --restart) RESTART=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

cd "$SCRIPT_DIR"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "!! SSH key not found: $SSH_KEY" >&2
  echo "   Set SSH_KEY=/path/to/key or restore faz-lms-server-access/." >&2
  exit 1
fi
chmod 600 "$SSH_KEY" 2>/dev/null || true
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new"

# ---------------- 1. push local branch ----------------
echo "==> [1/3] Push $BRANCH to origin"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "!! Working tree is dirty — commit or stash before deploying:" >&2
  git status --short >&2
  exit 1
fi
CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CUR_BRANCH" != "$BRANCH" ]]; then
  echo "!! On branch '$CUR_BRANCH', expected '$BRANCH'. Checkout $BRANCH or set BRANCH=." >&2
  exit 1
fi
git push origin "$BRANCH"

# ---------------- 2. build + reload on server ----------------
echo "==> [2/3] Deploy on $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
$SSH "$REMOTE_USER@$REMOTE_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' APP_NAME='$APP_NAME' BRANCH='$BRANCH' MIGRATE='$MIGRATE' RESTART='$RESTART' bash -s" <<'REMOTE'
set -euo pipefail
export NODE_OPTIONS="--max-old-space-size=1536"
cd "$REMOTE_DIR"

echo "-- sync to origin/$BRANCH"
git fetch --prune origin
git reset --hard "origin/$BRANCH"          # .env, uploads/, dist/ are gitignored → untouched

echo "-- frontend: install + build"
npm ci --no-audit --no-fund
npm run build

echo "-- backend: install + prisma + build"
cd server
npm ci --no-audit --no-fund
npx prisma generate
if [[ "$MIGRATE" == "1" ]]; then
  echo "-- prisma db push"
  npx prisma db push
fi
npm run build

echo "-- reload pm2 process '$APP_NAME'"
if [[ "$RESTART" == "1" ]]; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 reload "$APP_NAME" --update-env
fi
pm2 save

echo "-- health check"
sleep 2
if curl -sf -m 5 http://127.0.0.1:4000/api/health >/dev/null; then
  echo "   health OK"
else
  echo "!! health check FAILED — recent logs:" >&2
  pm2 logs "$APP_NAME" --lines 30 --nostream || true
  exit 1
fi
REMOTE

echo "==> [3/3] Deployed. Live at https://belajar.fazacademy.id"
