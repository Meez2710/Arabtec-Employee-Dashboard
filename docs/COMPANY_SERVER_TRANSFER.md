# Company server transfer manual

This runbook moves the standalone Arabtec Employee Workspace from the temporary Mac host to a company-owned Ubuntu server without changing the public Cloudflare hostname. It does not depend on Manus.

## Target and prerequisites

Recommended target:

- Ubuntu Server 24.04 LTS
- 4 CPU cores, 8 GB RAM, 80 GB SSD minimum
- Stable outbound internet access
- A non-root deployment user with sudo and SSH access
- Company backup destination or NAS
- Correct system time and timezone

The company firewall must allow outbound HTTPS and Cloudflare Tunnel traffic. No inbound HTTP, HTTPS, MySQL, router port-forward, or public IP is required. Permit outbound TCP 443 and, where policy allows, UDP/TCP 7844 for Cloudflare Tunnel. It falls back when QUIC is unavailable.

## Phase 1 — Prepare Ubuntu

Run on the company server:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git gnupg ufw
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Sign out and back in, then verify:

```bash
docker --version
docker compose version
```

Configure a basic firewall only after confirming SSH access:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## Phase 2 — Install the application code

```bash
sudo mkdir -p /opt/Arabtec-Standalone
sudo chown "$USER":"$USER" /opt/Arabtec-Standalone
git clone --branch deployment/standalone-mac --single-branch https://github.com/Meez2710/Arabtec-Employee-Dashboard.git /opt/Arabtec-Standalone
cd /opt/Arabtec-Standalone
git rev-parse --short HEAD
```

Do not create a new `.env` on the server. Securely copy the working Mac `.env` during the transfer so the tunnel, database credentials, administrator login, and session signing remain consistent.

## Phase 3 — Create a consistent final backup on the Mac

Announce a short editing freeze. Do not edit or publish content until cutover completes.

From the Mac project folder:

```bash
cd ~/Desktop/Arabtec-Standalone
mkdir -p backups
docker compose stop app
docker compose exec -T db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' | gzip > backups/database-final.sql.gz
docker run --rm -v arabtec-standalone_uploads:/data -v "$PWD/backups:/backup" alpine tar czf /backup/uploads-final.tar.gz -C /data .
shasum -a 256 backups/database-final.sql.gz backups/uploads-final.tar.gz > backups/SHA256SUMS
```

The Mac site is intentionally paused after this final snapshot to prevent two databases diverging. If the cutover is aborted, restart it with `docker compose up -d app`.

## Phase 4 — Copy secrets and backups securely

Use SSH/SCP from the Mac, replacing `DEPLOY_USER` and the server address:

```bash
ssh DEPLOY_USER@10.20.0.9 'mkdir -p /opt/Arabtec-Standalone/backups && chmod 700 /opt/Arabtec-Standalone/backups'
scp .env backups/database-final.sql.gz backups/uploads-final.tar.gz backups/SHA256SUMS DEPLOY_USER@10.20.0.9:/opt/Arabtec-Standalone/backups/
```

On the server:

```bash
cd /opt/Arabtec-Standalone
mv backups/.env .env
chmod 600 .env
cd backups
sha256sum -c SHA256SUMS
cd ..
```

Never email `.env`, place it in chat, or commit it to Git.

## Phase 5 — Build and restore on the company server

```bash
cd /opt/Arabtec-Standalone
docker compose up -d db
docker compose build app
```

Wait for MySQL:

```bash
until [ "$(docker inspect -f '{{.State.Health.Status}}' arabtec-standalone-db-1)" = "healthy" ]; do sleep 5; done
```

Restore the database:

```bash
gunzip -c backups/database-final.sql.gz | docker compose exec -T db sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose run --rm app pnpm exec drizzle-kit migrate
```

Restore uploads:

```bash
docker run --rm -v arabtec-standalone_uploads:/data -v "$PWD/backups:/backup:ro" alpine sh -c 'rm -rf /data/* && tar xzf /backup/uploads-final.tar.gz -C /data'
```

Start and verify locally:

```bash
docker compose up -d app
sleep 10
docker compose ps
curl -fsS http://127.0.0.1:3000/health && echo
```

Expected response: `{"ok":true}`.

## Phase 6 — Move the existing Cloudflare Tunnel

The copied `.env` contains the existing private tunnel token. Never print it.

Start a company-server connector while the Mac tunnel is still connected:

```bash
docker compose --profile public up -d cloudflared
sleep 10
docker compose logs --tail=30 cloudflared
```

Confirm `Registered tunnel connection` and confirm the `arabtec-mac` tunnel shows an additional connected connector in Cloudflare. During this brief overlap, keep the admin editing freeze in place.

Stop the Mac connectors:

```bash
cd ~/Desktop/Arabtec-Standalone
docker compose --profile public stop cloudflared
docker rm -f arabtec-quick-tunnel 2>/dev/null || true
```

Do not change DNS or published application routes. They continue to target `http://app:3000` through the same named tunnel.

Verify:

- `https://hr-arabtecegy.online/health`
- `https://hr-arabtecegy.online`
- `https://hr-arabtecegy.online/login`
- `https://hr-arabtecegy.online/admin`
- `https://www.hr-arabtecegy.online`
- English, Arabic/RTL, images, search, editing, and publishing

Keep the stopped Mac copy for at least 72 hours as rollback protection.

## Phase 7 — Scheduled lifecycle

Create `/opt/Arabtec-Standalone/scripts/run-lifecycle.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/Arabtec-Standalone
set -a
. ./.env
set +a
curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/scheduled/workspace-review-reminders >/dev/null
```

Protect it and schedule it:

```bash
chmod 700 /opt/Arabtec-Standalone/scripts/run-lifecycle.sh
(crontab -l 2>/dev/null; echo '*/5 * * * * /opt/Arabtec-Standalone/scripts/run-lifecycle.sh') | crontab -
```

## Phase 8 — Daily backups

Create a protected backup directory on storage that is not the same physical disk as the application. Retain at least 14 daily backups.

Example commands:

```bash
cd /opt/Arabtec-Standalone
stamp="$(date +%Y%m%d-%H%M%S)"
docker compose exec -T db sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' | gzip > "/company-backups/arabtec-db-$stamp.sql.gz"
docker run --rm -v arabtec-standalone_uploads:/data -v /company-backups:/backup alpine tar czf "/backup/arabtec-uploads-$stamp.tar.gz" -C /data .
find /company-backups -type f -name 'arabtec-*' -mtime +14 -delete
```

Copy backups to a NAS or encrypted off-server destination and test a restore at least monthly.

## Updates

Before every update:

```bash
cd /opt/Arabtec-Standalone
# Create a database and upload backup first.
git fetch origin
git checkout deployment/standalone-mac
git pull --ff-only
docker compose build app
docker compose run --rm app pnpm exec drizzle-kit migrate
docker compose up -d app
curl -fsS http://127.0.0.1:3000/health && echo
```

## Rollback

If the server fails during cutover:

1. Stop its connector: `docker compose --profile public stop cloudflared`.
2. On the Mac, start the old snapshot: `docker compose up -d app`.
3. Start the Mac connector: `docker compose --profile public up -d cloudflared`.
4. Verify the public health URL.
5. Do not merge changes made independently in both databases; restore from the authoritative final backup instead.

## Cost model

Expected recurring software/platform cost when using an existing company server:

- Cloudflare Free DNS, SSL, and Tunnel: $0
- Docker Engine on Linux: $0
- MySQL Community Server image: $0
- Node.js and Git: $0
- GitHub repository under normal free limits: $0
- Public/static IP: not required
- SSL certificate: $0 through Cloudflare
- Resend email reminders: $0 when disabled; optional provider charges depend on plan/volume
- Domain: normal Spaceship annual renewal still applies
- Backup storage: existing NAS may have no incremental fee; cloud backup is provider-dependent
- Hardware, electricity, internet, IT labor, monitoring, and replacement disks remain company costs

Docker Desktop licensing can apply to larger organizations; use free Docker Engine on the Ubuntu company server rather than Docker Desktop.

After the company server has run correctly for at least 72 hours and all data backups are verified, the old Manus deployment can be cancelled. Render services continue billing until explicitly suspended or deleted; review them separately before cancelling anything that might contain other data.
