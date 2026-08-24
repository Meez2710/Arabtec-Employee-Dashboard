# On-premises deployment — Arabtec Employee Workspace

Target: a fresh Linux server on the internal company network, reached by IP.
No Cloudflare, no tunnel, no public DNS, no HTTPS certificate.

- **Server** 10.20.0.9 · SSH user `ATS`
- **Stack** React 18 + Vite (SPA) · Node.js 22 + Express + tRPC · Drizzle ORM · **MySQL 8**
- **Runtime** systemd service on 127.0.0.1:3000, Nginx publishing port 80

---

## Read this first: the database is MySQL

The brief said PostgreSQL. The application is MySQL and cannot talk to Postgres
without a port:

| Evidence | Value |
|---|---|
| `drizzle.config.ts` | `dialect: "mysql"` |
| `package.json` | `mysql2@^3.15.0` — no `pg` driver |
| `drizzle/0000_*.sql` | ``CREATE TABLE `dailyDigestEntries` ( `id` int AUTO_INCREMENT …`` |

Backtick identifiers and `AUTO_INCREMENT` are MySQL-only. Against Postgres all
seven migrations fail on their first statement.

**Recommended:** install MySQL 8 (this runbook). No code changes, and it matches
what is running today.

**If company policy mandates PostgreSQL**, that is a porting project, not a
config switch: change the Drizzle dialect, swap `mysql2` for `pg`, rewrite
`drizzle/schema.ts` to `pg-core`, delete and regenerate all seven migrations,
then re-test. Budget a day plus testing. Ask before starting — it is a real
change to a system that currently works.

---

## 1. Connect

```
ssh ATS@10.20.0.9
```

Set up key auth and disable password login once you are in — the password for
this account has been shared in plain text and should be rotated.

## 2. Bootstrap the server (once)

Installs Node 22, pnpm, MySQL 8, Nginx; creates the `arabtec` user, the
database, and `/etc/arabtec-workspace.env` with generated secrets.

```
sudo bash install-server.sh
```

It prints the generated admin email and password. Save them, then change the
password in `/etc/arabtec-workspace.env`.

## 3. Deploy the application

Clones the repo to `/opt/arabtec-workspace`, installs, builds, runs migrations,
installs and starts the systemd unit, and health-checks the result.

```
sudo bash deploy.sh deployment/standalone-mac
```

## 4. Publish it on port 80

```
sudo cp nginx-arabtec.conf /etc/nginx/sites-available/arabtec-workspace
```
```
sudo ln -sf /etc/nginx/sites-available/arabtec-workspace /etc/nginx/sites-enabled/arabtec-workspace
```
```
sudo rm -f /etc/nginx/sites-enabled/default
```
```
sudo nginx -t && sudo systemctl reload nginx
```

Open `http://10.20.0.9/` from any machine on the network.

## 5. Allow port 80 internally

Only if `ufw` is active. Confirm with IT before changing firewall rules.

```
sudo ufw allow from 10.20.0.0/16 to any port 80 proto tcp
```

---

## Redeploying later

```
sudo bash /opt/arabtec-workspace/deploy/onprem/deploy.sh
```

Uploads live in `/var/lib/arabtec-workspace/uploads`, outside the deploy
directory, so redeploys never remove them.

## Operating it

| Task | Command |
|---|---|
| Status | `systemctl status arabtec-workspace` |
| Logs (live) | `journalctl -u arabtec-workspace -f` |
| Logs (recent) | `journalctl -u arabtec-workspace -n 100 --no-pager` |
| Restart | `systemctl restart arabtec-workspace` |
| App health | `curl -s http://127.0.0.1:3000/health` |
| Nginx errors | `tail -50 /var/log/nginx/arabtec-workspace.error.log` |

## Backups

Nightly dump, kept 14 days. Add to root's crontab.

```
0 1 * * * /usr/bin/mysqldump --single-transaction --databases arabtec_workspace | gzip > /var/backups/arabtec-$(date +\%F).sql.gz && find /var/backups -name 'arabtec-*.sql.gz' -mtime +14 -delete
```

Back up `/var/lib/arabtec-workspace/uploads` on the same schedule.

---

## What changed from the Cloudflare deployment

| Was | Now |
|---|---|
| Cloudflare tunnel to `hr-arabtecegy.online` | Nginx on port 80, reached by IP |
| `TUNNEL_TOKEN` in `.env` | removed |
| `cloudflared` container | removed |
| Docker Compose (app + db + tunnel) | systemd service + host MySQL |
| MySQL in a container volume | MySQL on the host, dumped nightly |
| Uploads in a Docker volume | `/var/lib/arabtec-workspace/uploads` |
| HTTPS terminated at Cloudflare | plain HTTP on the internal network |

Nothing in the application code changes. The app already binds `0.0.0.0:3000`
and calls `app.set("trust proxy", 1)`, so it sits behind Nginx unmodified.

## Adding the internal domain later

1. Ask IT for an internal DNS A record, e.g. `dashboard.arabtec.local` → 10.20.0.9
2. Set `server_name dashboard.arabtec.local 10.20.0.9;` in the Nginx config
3. `sudo nginx -t && sudo systemctl reload nginx`

No application change is needed. For HTTPS, use a certificate from the company
internal CA — public ACME cannot validate a private hostname.

## Notes

- The database starts empty. The employee pages correctly show "Nothing is
  published here yet" until content is published at `/admin`.
- The demo seed is development-only and will not run here.
- `pnpm db:push` is a development command: it runs `generate` first, which
  authors new migrations. Production uses `pnpm exec drizzle-kit migrate`.
