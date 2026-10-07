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
BRIDGE="${NOVA_AGENT_BRIDGE:-novabr0}"
BRIDGE_ADDR="${NOVA_AGENT_BRIDGE_ADDRESS:-10.88.0.1/24}"
UPLINK="${NOVA_AGENT_UPLINK:-$(ip route | awk '/default/ {print $5; exit}')}"
TOKEN="${NOVA_AGENT_TOKEN:-$(openssl rand -hex 32)}"

echo "Installing Nova Agent host dependencies..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git openssl rsync nodejs npm qemu-system-x86 qemu-utils iproute2 nftables

if [[ ! -e /dev/kvm ]]; then
  echo "WARNING: /dev/kvm is not available. Nova Agent will install, but VM start will remain unavailable."
fi

mkdir -p "${APP_DIR}" "${STATE_DIR}"/{instances,images,disks}
if [[ "${SOURCE_DIR}" != "${APP_DIR}" ]]; then
  rsync -a --exclude='.env' --exclude='node_modules/' --exclude='dist/' "${SOURCE_DIR}/" "${APP_DIR}/"
fi

cd "${APP_DIR}"
npm install
npm run build

if ! ip link show "${BRIDGE}" >/dev/null 2>&1; then
  ip link add name "${BRIDGE}" type bridge
fi
if ! ip -4 addr show dev "${BRIDGE}" | grep -q "${BRIDGE_ADDR%/*}"; then
  ip addr add "${BRIDGE_ADDR}" dev "${BRIDGE}" 2>/dev/null || true
fi
ip link set "${BRIDGE}" up

cat >/etc/sysctl.d/99-nova-agent.conf <<EOF
net.ipv4.ip_forward=1
EOF
sysctl --system >/dev/null

if [[ -n "${UPLINK}" ]]; then
  nft list table inet nova_agent >/dev/null 2>&1 || nft add table inet nova_agent
  nft list chain inet nova_agent forward >/dev/null 2>&1 || nft 'add chain inet nova_agent forward { type filter hook forward priority 0; policy accept; }'
  nft list table ip nova_agent_nat >/dev/null 2>&1 || nft add table ip nova_agent_nat
  nft list chain ip nova_agent_nat postrouting >/dev/null 2>&1 || nft 'add chain ip nova_agent_nat postrouting { type nat hook postrouting priority 100; policy accept; }'
  if ! nft list chain ip nova_agent_nat postrouting | grep -q "10.88.0.0/24.*masquerade"; then
    nft add rule ip nova_agent_nat postrouting ip saddr 10.88.0.0/24 oifname "${UPLINK}" masquerade
  fi
fi

cat >/etc/novacloud-agent.env <<EOF
NOVA_AGENT_PORT=9443
NOVA_AGENT_BIND=0.0.0.0
NOVA_AGENT_TOKEN=${TOKEN}
NOVA_AGENT_STATE_DIR=${STATE_DIR}
NOVA_AGENT_BRIDGE=${BRIDGE}
EOF
chmod 600 /etc/novacloud-agent.env

cat >/etc/systemd/system/nova-agent.service <<EOF
[Unit]
Description=Cyverax Nova Compute Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=/etc/novacloud-agent.env
ExecStart=/usr/bin/node ${APP_DIR}/dist/nova-agent.cjs
Restart=always
RestartSec=3
NoNewPrivileges=false

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nova-agent

echo
echo "Nova Agent installed."
echo "Host: $(hostname)"
echo "Port: 9443"
echo "Bridge: ${BRIDGE}"
echo "KVM: $([[ -e /dev/kvm ]] && echo available || echo unavailable)"
echo
echo "Controller configuration:"
echo "NOVA_AGENT_URL=http://$(hostname -I | awk '{print $1}'):9443"
echo "NOVA_AGENT_TOKEN=${TOKEN}"
echo
echo "Protect this token. It grants compute-host control."
