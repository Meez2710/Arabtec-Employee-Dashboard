#!/usr/bin/env bash
# One-time server bootstrap for the Arabtec Employee Workspace.
# Installs Node 22, pnpm, MySQL 8 and Nginx, and creates the app user,
# directories and database. Safe to re-run.
#
#   sudo bash install-server.sh
set -Eeuo pipefail

APP_USER=arabtec
APP_DIR=/opt/arabtec-workspace
DATA_DIR=/var/lib/arabtec-workspace
DB_NAME=arabtec_workspace
DB_USER=arabtec_app
ENV_FILE=/etc/arabtec-workspace.env

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run as root (sudo bash install-server.sh)."
command -v apt-get >/dev/null 2>&1 || die \
"This script targets Debian/Ubuntu. On RHEL/Rocky/Alma swap:
   apt-get install -y X   ->  dnf install -y X
   mysql-server           ->  mysql-server (dnf module enable mysql:8.0)
   nginx                  ->  nginx (dnf install nginx)
 The rest of the steps are identical."

log "System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx mysql-server openssl

log "Node.js 22 (NodeSource)"
if ! node --version 2>/dev/null | grep -q '^v22\.'; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi
corepack enable
node --version

log "Application user and directories"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 0755 "$APP_DIR"
install -d -o "$APP_USER" -g "$APP_USER" -m 0750 "$DATA_DIR" "$DATA_DIR/uploads"

log "MySQL database and user"
systemctl enable --now mysql
# Generated once, then reused on re-runs so the env file stays valid.
if [ -f "$ENV_FILE" ] && grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  DB_PASS="$(sed -n 's|^DATABASE_URL=mysql://[^:]*:\([^@]*\)@.*|\1|p' "$ENV_FILE")"
  echo "Reusing the existing database password from $ENV_FILE"
else
  DB_PASS="$(openssl rand -hex 24)"
fi
mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

log "Environment file"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<ENV
NODE_ENV=production
PORT=3000

# Local MySQL over the loopback interface only.
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}

# Session signing key. Rotating this signs every user out.
JWT_SECRET=$(openssl rand -hex 32)

# The first administrator. This account is created on first successful login.
# CHANGE THIS PASSWORD before handing the server over.
ADMIN_EMAIL=hr@arabtec.local
ADMIN_PASSWORD=$(openssl rand -hex 12)
ADMIN_NAME=Workspace Administrator

# Shared secret for the review-reminder endpoint.
CRON_SECRET=$(openssl rand -hex 32)

# Uploaded images live outside the deploy directory so releases never wipe them.
UPLOAD_DIR=${DATA_DIR}/uploads

# Email delivery is optional. Leave unset and overdue reviews are still
# flagged in the console; only the outbound email is skipped.
# RESEND_API_KEY=
# WORKSPACE_REMINDER_FROM=workspace@arabtec.local
ENV
  chown root:"$APP_USER" "$ENV_FILE"
  chmod 0640 "$ENV_FILE"
else
  echo "Kept the existing $ENV_FILE"
fi

log "Done"
cat <<NEXT
  App directory : $APP_DIR
  Uploads       : $DATA_DIR/uploads
  Env file      : $ENV_FILE  (root:$APP_USER, 0640)

  Your generated admin sign-in:
    email    : $(sed -n 's/^ADMIN_EMAIL=//p' "$ENV_FILE")
    password : $(sed -n 's/^ADMIN_PASSWORD=//p' "$ENV_FILE")

  Next: deploy the code with deploy.sh
NEXT
