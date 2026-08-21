#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f docker-compose.yml ]]; then
  echo "Please run this command from the Arabtec-Standalone folder."
  exit 1
fi

printf "Administrator email: "
IFS= read -r admin_email
if [[ "$admin_email" != *@*.* ]]; then
  echo "The email address does not look valid. Nothing was created."
  exit 1
fi

printf "Create an administrator password (at least 16 characters): "
IFS= read -r -s admin_password
printf "\n"
if (( ${#admin_password} < 16 )); then
  echo "The password must contain at least 16 characters. Nothing was created."
  exit 1
fi

printf "Type the same password again: "
IFS= read -r -s admin_password_confirm
printf "\n"
if [[ "$admin_password" != "$admin_password_confirm" ]]; then
  echo "The passwords did not match. Nothing was created."
  exit 1
fi

escape_env() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

db_password="$(openssl rand -hex 24)"
root_password="$(openssl rand -hex 24)"
jwt_secret="$(openssl rand -hex 32)"
cron_secret="$(openssl rand -hex 32)"
admin_email_escaped="$(escape_env "${admin_email,,}")"
admin_password_escaped="$(escape_env "$admin_password")"

if [[ -f .env ]]; then
  cp .env ".env.backup.$(date +%Y%m%d%H%M%S)"
fi

cat > .env <<EOF
NODE_ENV=production
PORT=3000
MYSQL_DATABASE=arabtec_workspace
MYSQL_USER=arabtec_app
MYSQL_PASSWORD=$db_password
MYSQL_ROOT_PASSWORD=$root_password
DATABASE_URL=mysql://arabtec_app:$db_password@db:3306/arabtec_workspace
JWT_SECRET=$jwt_secret
ADMIN_EMAIL=$admin_email_escaped
ADMIN_PASSWORD=$admin_password_escaped
ADMIN_NAME="Workspace Administrator"
CRON_SECRET=$cron_secret
UPLOAD_DIR=/app/data/uploads
TUNNEL_TOKEN=
RESEND_API_KEY=
WORKSPACE_REMINDER_FROM=
EOF

chmod 600 .env
unset admin_password admin_password_confirm db_password root_password jwt_secret cron_secret

echo "Configuration created securely. No password or secret was displayed."
