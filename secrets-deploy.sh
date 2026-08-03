#!/usr/bin/env bash
#
# Push local-only secrets into production's server/.env and restart the API.
# Secrets never touch this repo or git history — they live in $SECRETS_FILE
# (default: ~/.faz-secrets/production.env, outside any git-tracked directory)
# and are piped over the SSH connection's stdin straight into
# `node server/scripts/apply-secrets.mjs` on the server, which upserts them
# into server/.env by key. Any existing unrelated vars (DATABASE_URL,
# JWT_SECRET, etc.) are left untouched. Secret values are never printed,
# passed as CLI args, or written to shell history.
#
#   ./secrets-deploy.sh
#   SECRETS_FILE=/path/to/file ./secrets-deploy.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_HOST="${REMOTE_HOST:-143.198.94.130}"
REMOTE_USER="${REMOTE_USER:-admin}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/faz}"
SSH_KEY="${SSH_KEY:-$SCRIPT_DIR/faz-lms-server-access/faz_lms_ed25519}"
APP_NAME="${APP_NAME:-faz-api}"
SECRETS_FILE="${SECRETS_FILE:-$HOME/.faz-secrets/production.env}"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "!! SSH key not found: $SSH_KEY" >&2
  exit 1
fi
chmod 600 "$SSH_KEY" 2>/dev/null || true

if [[ ! -f "$SECRETS_FILE" ]]; then
  cat >&2 <<EOF
!! Secrets file not found: $SECRETS_FILE

Create it (outside the repo, never committed) with KEY=VALUE lines, e.g.:

  mkdir -p "\$HOME/.faz-secrets"
  cat > "\$HOME/.faz-secrets/production.env" <<'SECRETS'
MAIL_TRANSPORT=smtp
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_xxx
SECRETS
  chmod 600 "\$HOME/.faz-secrets/production.env"
EOF
  exit 1
fi
chmod 600 "$SECRETS_FILE" 2>/dev/null || true

COUNT="$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$SECRETS_FILE" || true)"
echo "==> Pushing $COUNT secret(s) from $SECRETS_FILE to $REMOTE_USER@$REMOTE_HOST (values never printed)"

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

"${SSH[@]}" "$REMOTE_USER@$REMOTE_HOST" "cd '$REMOTE_DIR/server' && node scripts/apply-secrets.mjs" < "$SECRETS_FILE"

echo "==> Restarting $APP_NAME with new env"
"${SSH[@]}" "$REMOTE_USER@$REMOTE_HOST" "pm2 restart $APP_NAME --update-env && pm2 save"

echo "==> Done."
