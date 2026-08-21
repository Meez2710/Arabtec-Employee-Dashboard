# Standalone Mac deployment (no Manus)

This branch replaces Manus authentication, storage, scheduled-task authentication, and Vite runtime use. The existing visual design is unchanged.

## Safety

- Keep the existing Manus deployment online until this stack passes testing.
- Never commit `.env`.
- MySQL is private; Compose binds only the app to Mac localhost.
- The Mac must stay powered, awake, online, and running Docker Desktop.

## 1. Requirements

Install Docker Desktop and Git on the Mac. Clone this branch:

```bash
git clone --branch deployment/standalone-mac https://github.com/Meez2710/Arabtec-Employee-Dashboard.git
cd Arabtec-Employee-Dashboard
cp .env.example .env
```

Open `.env` locally and replace every `CHANGE_...` value. Use alphanumeric database passwords so the `DATABASE_URL` needs no URL escaping. Set `ADMIN_EMAIL` and a unique administrator password of at least 16 characters. Never send `.env` to anyone.

Generate secrets on macOS:

```bash
openssl rand -hex 32
```

Run it separately for `JWT_SECRET`, `CRON_SECRET`, and both database passwords.

## 2. Build and start locally

```bash
docker compose up -d db
docker compose build app
docker compose run --rm app pnpm exec drizzle-kit migrate
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
```

Open `http://localhost:3000`, then `http://localhost:3000/login` and sign in with the `.env` administrator credentials.

## 3. Public domain through free Cloudflare Tunnel

Keep the domain registered at Spaceship. Add it to a free Cloudflare account, carefully copy all existing MX/TXT/DKIM/DMARC records, then replace the domain's nameservers at Spaceship with those supplied by Cloudflare.

In Cloudflare Zero Trust create a tunnel and a public hostname such as `test-workspace.example.com` targeting `http://app:3000`. Put the tunnel token only in local `.env`, then run:

```bash
docker compose --profile public up -d cloudflared
```

Test the temporary hostname before changing the current live hostname. No router port forwarding is required.

## 4. Backups

Database:

```bash
mkdir -p backups
docker compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE" > backups/database.sql
```

Uploads:

```bash
docker run --rm -v arabtec-employee-dashboard_uploads:/data -v "$PWD/backups:/backup" alpine tar czf /backup/uploads.tar.gz -C /data .
```

## 5. Scheduled lifecycle

Call the protected endpoint every five minutes with `Authorization: Bearer <CRON_SECRET>`. Until a scheduler is configured, publishing due/expired items can be triggered manually with curl from the Mac.

## 6. Move to the company server

Install Docker on Ubuntu Server 24.04, clone this branch, securely copy `.env`, import the database dump and uploads archive, and start the same Compose stack. Stop `cloudflared` on the Mac before starting the same tunnel on the server; the public hostname remains unchanged.

## Rollback

Stop the standalone tunnel and restore the previous DNS target. The old Manus deployment and database are not modified by this stack.
