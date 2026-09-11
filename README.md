# Cyverax Nova

Cyverax Nova is a self-hosted cloud-console application. A fresh installation starts with an empty PostgreSQL-backed inventory; it does not load demonstration infrastructure.

## One-command LXC installation

Use a clean Debian 12 or Debian 13 LXC with at least 2 CPU cores, 4 GB RAM, 20 GB storage, systemd, working DNS, and Internet access.

Because this repository is private, authenticate the LXC to GitHub with an SSH deploy key first. Then run:

```bash
git clone git@github.com:gustavoalmanzavargas-dotcom/Novacloud.git && cd Novacloud && sudo bash install.sh
```

The installer asks for the web hostname, administrator account, optional Gemini key, and optional HTTPS. It automatically installs Node.js, PostgreSQL, Nginx, the database schema, the Nova service, and Let's Encrypt when selected.

## Update an installed instance

```bash
cd /path/to/Novacloud
sudo git pull
sudo npm install
sudo npm run db:migrate
sudo npm run build
sudo systemctl restart novacloud
```

## Troubleshooting

```bash
systemctl status novacloud --no-pager
journalctl -u novacloud -n 100 --no-pager
curl http://127.0.0.1:3000/api/health
nginx -t
```
