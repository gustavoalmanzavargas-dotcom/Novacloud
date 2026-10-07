#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash scripts/enable-single-node.sh"
  exit 1
fi

APP_DIR="/opt/novacloud"
ENV_FILE="${APP_DIR}/.env"

if [[ ! -f "${APP_DIR}/package.json" || ! -f "${ENV_FILE}" ]]; then
  echo "Nova controller is not installed in ${APP_DIR}."
  exit 1
fi

cd "${APP_DIR}"
TOKEN="$(openssl rand -hex 32)"

echo "Enabling Nova single-node mode..."
echo "This host will run the controller and Nova Agent."
if [[ -e /dev/kvm ]]; then
  echo "Acceleration: KVM"
else
  echo "Acceleration: QEMU TCG software mode"
fi

NOVA_AGENT_TOKEN="${TOKEN}" NOVA_AGENT_BIND="127.0.0.1" bash scripts/install-nova-agent.sh

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "${ENV_FILE}"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "${ENV_FILE}"
  else
    printf '%s=%s\n' "${key}" "${value}" >>"${ENV_FILE}"
  fi
}

set_env "NOVA_AGENT_URL" "http://127.0.0.1:9443"
set_env "NOVA_AGENT_TOKEN" "${TOKEN}"
set_env "NOVA_AGENT_VERIFY_TLS" "false"

systemctl restart nova-agent
systemctl restart novacloud

echo
echo "Checking Nova Agent..."
for _ in {1..30}; do
  if curl -fsS -H "Authorization: Bearer ${TOKEN}" http://127.0.0.1:9443/v1/health >/dev/null; then
    break
  fi
  sleep 1
done

AGENT_HEALTH="$(curl -fsS -H "Authorization: Bearer ${TOKEN}" http://127.0.0.1:9443/v1/health)"
HOST_STATE="$(curl -fsS -H "Authorization: Bearer ${TOKEN}" http://127.0.0.1:9443/v1/host)"
CONTROLLER_HEALTH="$(curl -fsS http://127.0.0.1:3000/api/health)"

echo "Agent: ${AGENT_HEALTH}"
echo "Controller: ${CONTROLLER_HEALTH}"
echo "Host capabilities: ${HOST_STATE}"
echo
echo "Nova single-node mode is enabled."
echo "Nova Agent is bound to 127.0.0.1 and is not exposed directly to the LAN."
