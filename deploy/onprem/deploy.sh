#!/usr/bin/env bash
# Deploy (or redeploy) the Arabtec Employee Workspace.
# Pulls the branch, installs, builds, migrates, restarts, verifies.
#
#   sudo bash deploy.sh [branch]
set -Eeuo pipefail

APP_USER=arabtec
APP_DIR=/opt/arabtec-workspace
ENV_FILE=/etc/arabtec-workspace.env
REPO=https://github.com/Meez2710/Arabtec-Employee-Dashboard.git
BRANCH="${1:-deployment/standalone-mac}"

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (sudo bash deploy.sh)."
[ -f "$ENV_FILE" ] || die "$ENV_FILE is missing. Run install-server.sh first."

log "Fetching $BRANCH"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
  sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard "origin/$BRANCH"
else
  sudo -u "$APP_USER" git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
sudo -u "$APP_USER" git -C "$APP_DIR" log --oneline -1

log "Installing dependencies"
# Dev dependencies are kept: drizzle-kit runs the migrations below.
cd "$APP_DIR"
sudo -u "$APP_USER" env HOME="/home/$APP_USER" corepack pnpm install --frozen-lockfile

log "Type-checking"
# esbuild and vite do not typecheck, so without this a commit with type
# errors would build cleanly and fail at runtime. Runs before anything
# touches the live service.
sudo -u "$APP_USER" env HOME="/home/$APP_USER" corepack pnpm check

log "Building"
sudo -u "$APP_USER" env HOME="/home/$APP_USER" NODE_ENV=production corepack pnpm build

# vite build is the memory-hungry step. On a server with under 2 GB RAM,
# add swap first or the build is killed with no clear error.

log "Applying database migrations"
# migrate only. 'pnpm db:push' also runs 'generate', which authors new
# migrations from the schema and has no place on a production host.
set -a; . "$ENV_FILE"; set +a
sudo -u "$APP_USER" env HOME="/home/$APP_USER" DATABASE_URL="$DATABASE_URL" \
  corepack pnpm exec drizzle-kit migrate

log "Restarting the service"
install -m 0644 "$APP_DIR/deploy/onprem/arabtec-workspace.service" /etc/systemd/system/arabtec-workspace.service
systemctl daemon-reload
systemctl enable arabtec-workspace
systemctl restart arabtec-workspace

log "Verifying"
for i in $(seq 1 20); do
  if curl -fsS -m 5 http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo "health check passed after ~$((i*3))s"
    curl -fsS http://127.0.0.1:3000/health; echo
    log "Deployed: $(git -C "$APP_DIR" rev-parse --short HEAD) on $BRANCH"
    exit 0
  fi
  sleep 3
done
die "The app did not become healthy. Inspect: journalctl -u arabtec-workspace -n 80 --no-pager"
