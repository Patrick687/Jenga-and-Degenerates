#!/usr/bin/env bash
# Runs ON THE DROPLET, started by GitHub Actions right after the backend source
# has been rsynced to /var/www/jenga-api. Safe to run repeatedly.
set -euo pipefail

# The backend needs Node 22+, installed side by side so other apps keep the system Node.
export PATH=/opt/node-22/bin:$PATH

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

# The running API keeps the SQLite file open, which blocks migrations ("database is locked").
echo "==> Stopping the API"
sudo -n systemctl stop jenga-api

echo "==> Applying database migrations"
npm run db:migrate

# Seed the starter cards when the database is brand new. If RESEED_CARDS=true
# (set in the workflow), also wipe and reload them from backend/prisma/seed-cards.json
# on every deploy, so the cards always match what is committed. That overwrites
# anything added or edited in /admin.
if [ "${RESEED_CARDS:-false}" = true ]; then
  echo "==> Reseeding cards from the committed list (RESEED_CARDS=true)"
  npm run db:seed -- --force
elif [ "$FIRST_RUN" = true ]; then
  echo "==> First run: seeding starter cards"
  npm run db:seed
fi

echo "==> Starting the API"
sudo -n systemctl start jenga-api

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
