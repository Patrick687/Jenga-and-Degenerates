#!/usr/bin/env bash
# Runs ON THE DROPLET, started by GitHub Actions right after the backend source
# has been rsynced to /var/www/jenga-api. Safe to run repeatedly.
set -euo pipefail

APP_DIR=/var/www/jenga-api
cd "$APP_DIR"

# Same settings the service uses (DATABASE_URL, ADMIN_PASSWORD, PORT ...).
set -a
# shellcheck disable=SC1091
. ./.env
set +a

DB_FILE="${DATABASE_URL#file:}"
FIRST_RUN=false
[ -f "$DB_FILE" ] || FIRST_RUN=true

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building"
npm run build

echo "==> Applying database migrations"
npm run db:migrate

# Seed the starter cards only when the database is brand new, so cards you
# deleted on purpose never come back on a later deploy.
if [ "$FIRST_RUN" = true ]; then
  echo "==> First run: seeding starter cards"
  npm run db:seed
fi

echo "==> Restarting the API"
sudo -n systemctl restart jenga-api

echo "==> Waiting for it to come up"
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${PORT:-4000}/health"; then
    echo
    echo "Backend is healthy."
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy. Recent logs:" >&2
sudo -n journalctl -u jenga-api -n 40 --no-pager >&2 || true
exit 1
