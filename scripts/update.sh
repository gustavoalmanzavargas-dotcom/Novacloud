#!/usr/bin/env bash
set -Eeuo pipefail
if [[ ${EUID} -ne 0 ]]; then echo 'Run as root: sudo bash scripts/update.sh'; exit 1; fi
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ "$PWD" != /opt/novacloud || ! -f .env ]]; then
  echo 'Run this from the installed checkout in /opt/novacloud.'
  exit 1
fi
# Check out the reviewed release before invoking this script. Do not overwrite
# local source changes or replace controller credentials during an update.
npm ci --include=dev
npm run lint
npm run build
npm run db:migrate
if [[ -f /etc/novacloud-agent.env ]]; then
  bash scripts/install-nova-agent.sh
fi
NGINX_FILE=/etc/nginx/sites-available/novacloud
if [[ -f "${NGINX_FILE}" ]]; then
  NGINX_BACKUP="$(mktemp)"
  cp -p "${NGINX_FILE}" "${NGINX_BACKUP}"
  if ! node scripts/upgrade-nginx.mjs "${NGINX_FILE}" || ! nginx -t; then
    cp -p "${NGINX_BACKUP}" "${NGINX_FILE}"
    rm -f "${NGINX_BACKUP}"
    echo 'Nginx upgrade failed; previous configuration restored.'
    exit 1
  fi
  rm -f "${NGINX_BACKUP}"
  systemctl reload nginx
fi
# Existing installations also need journal access after this release.
mkdir -p /etc/systemd/system/novacloud.service.d
cat >/etc/systemd/system/novacloud.service.d/journal.conf <<'UNIT'
[Service]
SupplementaryGroups=systemd-journal
UNIT
systemctl daemon-reload
systemctl restart novacloud
for _ in {1..30}; do
  if curl -fsS http://127.0.0.1:3000/api/health; then echo; exit 0; fi
  sleep 1
done
journalctl -u novacloud -n 50 --no-pager
exit 1
