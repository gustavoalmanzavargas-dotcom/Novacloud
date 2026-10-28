#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/install-nova-agent.sh"
  exit 1
fi

source /etc/os-release
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="/opt/novacloud"
STATE_DIR="/var/lib/novacloud-agent"
read_existing() { sed -n "s/^$1=//p" /etc/novacloud-agent.env 2>/dev/null || true; }
BRIDGE="${NOVA_AGENT_BRIDGE:-$(read_existing NOVA_AGENT_BRIDGE)}"
BRIDGE="${BRIDGE:-novabr0}"
CIDR="${NOVA_AGENT_CIDR:-$(read_existing NOVA_AGENT_CIDR)}"
CIDR="${CIDR:-10.88.0.0/24}"
# Keep the controller's existing credential valid when updating the agent.
EXISTING_TOKEN="$(sed -n 's/^NOVA_AGENT_TOKEN=//p' /etc/novacloud-agent.env 2>/dev/null || true)"
TOKEN="${NOVA_AGENT_TOKEN:-${EXISTING_TOKEN}}"
AGENT_BIND="${NOVA_AGENT_BIND:-$(read_existing NOVA_AGENT_BIND)}"
AGENT_BIND="${AGENT_BIND:-127.0.0.1}"
DNS="${NOVA_AGENT_DNS:-$(read_existing NOVA_AGENT_DNS)}"
DNS="${DNS:-1.1.1.1,8.8.8.8}"

echo "Installing Nova Agent host dependencies..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git openssl rsync qemu-system-x86 qemu-utils iproute2 nftables novnc websockify systemd-container debootstrap util-linux lxc dnsmasq-base

if [[ -z "${TOKEN}" ]]; then TOKEN="$(openssl rand -hex 32)"; fi

NODE_MAJOR="$(node --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)"
if [[ -z "${NODE_MAJOR}" || "${NODE_MAJOR}" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi
if ! command -v npm >/dev/null 2>&1; then
  echo 'The existing Node.js installation has no npm. Install npm for that Node.js distribution and re-run.'
  exit 1
fi
echo "Using Node.js $(node --version) and npm $(npm --version)."

if [[ -e /dev/kvm ]]; then
  echo "Nova acceleration: KVM hardware acceleration available."
else
  echo "Nova acceleration: /dev/kvm is unavailable; QEMU TCG software acceleration will be used."
fi

mkdir -p "${APP_DIR}" "${STATE_DIR}"/{instances,images,disks}
touch "${STATE_DIR}/novnc.tokens"
chmod 600 "${STATE_DIR}/novnc.tokens"
if [[ "${SOURCE_DIR}" != "${APP_DIR}" ]]; then
  rsync -a --exclude='.env' --exclude='node_modules/' --exclude='dist/' "${SOURCE_DIR}/" "${APP_DIR}/"
fi

cd "${APP_DIR}"
npm ci --include=dev
npm run build

# The agent owns bridge, DHCP and NAT setup and restores them at each start.
# Do not move or reconfigure the host's management uplink.
NETWORK_MODE="bridge"

cat >/etc/novacloud-agent.env <<EOF
NOVA_AGENT_PORT=9443
NOVA_AGENT_BIND=${AGENT_BIND}
NOVA_AGENT_TOKEN=${TOKEN}
NOVA_AGENT_STATE_DIR=${STATE_DIR}
NOVA_AGENT_BRIDGE=${BRIDGE}
NOVA_AGENT_CIDR=${CIDR}
NOVA_AGENT_DNS=${DNS}
EOF
chmod 600 /etc/novacloud-agent.env

cat >/etc/systemd/system/nova-agent.service <<EOF
[Unit]
Description=Cyverax Nova Compute Agent
PartOf=novacloud.service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Delegate=yes
WorkingDirectory=${APP_DIR}
EnvironmentFile=/etc/novacloud-agent.env
ExecStart=/usr/bin/node ${APP_DIR}/dist/nova-agent.cjs
Restart=always
RestartSec=3
NoNewPrivileges=false

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/systemd/system/nova-novnc.service <<EOF
[Unit]
Description=Cyverax Nova noVNC Gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/websockify --web=/usr/share/novnc --token-plugin=TokenFile --token-source=${STATE_DIR}/novnc.tokens 127.0.0.1:6080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nova-agent
systemctl restart nova-agent
systemctl enable nova-novnc
systemctl restart nova-novnc

echo
HEALTH_BIND="${AGENT_BIND}"
if [[ "${HEALTH_BIND}" == 0.0.0.0 ]]; then HEALTH_BIND=127.0.0.1; fi
if [[ "${HEALTH_BIND}" == :: ]]; then HEALTH_BIND='[::1]'; fi
HEALTHY=false
for _ in {1..30}; do
  if curl -fsS -H "Authorization: Bearer ${TOKEN}" "http://${HEALTH_BIND}:9443/v1/health" >/dev/null; then
    HEALTHY=true
    break
  fi
  sleep 1
done
if [[ "${HEALTHY}" != true ]]; then
  journalctl -u nova-agent -n 50 --no-pager
  exit 1
fi
echo "Nova Agent installed and responding."
echo "Host: $(hostname)"
echo "Port: 9443"
echo "Network mode: ${NETWORK_MODE}"
echo "Bridge: ${BRIDGE}"
echo "Acceleration: $([[ -e /dev/kvm ]] && echo KVM || echo QEMU-TCG)"
echo
echo "Controller configuration:"
echo "NOVA_AGENT_URL=http://${HEALTH_BIND}:9443"
echo "NOVA_AGENT_TOKEN=${TOKEN}"
echo
echo "Protect this token. It grants compute-host control."
