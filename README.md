# Cyverax Nova

> **Proprietary software — active development.** Cyverax Nova is not open source. Development/evaluation access does not grant production-use rights. A valid Cyverax Nova license is required for authorized production, commercial, or continued licensed use. See [LICENSE](LICENSE).

Cyverax Nova is a self-hosted cloud platform with its own control plane, resource model, jobs, host protocol, and management UI.

## Architecture

NovaCloud is **not a Proxmox, VMware, Hyper-V, or public-cloud frontend**. The Nova UI communicates only with the Nova control API.

```text
NovaCloud UI
    |
Nova Control API + PostgreSQL
    |
Nova Scheduler / Jobs
    |
Nova Agent
    |
Linux host primitives
KVM/QEMU | qcow2 | Linux bridge/TAP | nftables | filesystems
```

Nova owns the API contract, host registration, resource state, lifecycle operations, job tracking, audit records, image catalog, network model, storage model, permissions, and licensing. Linux/KVM/QEMU are execution primitives underneath Nova; no third-party cloud-management API is required by the control plane.

## Current native compute foundation

The Nova Agent currently provides:

- real host capability and telemetry discovery
- authenticated controller-to-agent communication
- local KVM/QEMU VM creation
- qcow2 disk creation
- start, stop, shutdown, reboot, and delete
- Nova-managed TAP interfaces attached to a Nova bridge
- local image inventory and HTTP/HTTPS image import
- qcow2 snapshot creation/list/rollback for stopped VMs
- Nova host registration and last-seen telemetry in PostgreSQL
- Nova job records for long-running/control operations
- audit events for compute lifecycle actions

The controller can run separately from compute hosts. A compute host needs `/dev/kvm` for hardware-accelerated VM execution.

## Licensing

NovaCloud is privately developed proprietary software. Source availability in this repository does **not** grant permission to copy, redistribute, modify, sublicense, resell, host for third parties, or deploy the software outside expressly authorized development/evaluation use.

The current builds are for authorized development and testing. Production, commercial, enterprise, hosted-service, redistribution, and other operational use require a valid license or separate written authorization from the software owner.

## Install the Nova controller

Use Debian 12 or Debian 13 with at least 2 CPU cores, 4 GB RAM, 20 GB storage, systemd, working DNS, and Internet access.

```bash
curl -fsSL https://raw.githubusercontent.com/gustavoalmanzavargas-dotcom/Novacloud/main/bootstrap.sh | sudo bash
```

The controller installer configures PostgreSQL, the Nova API/UI service, authentication, Nginx, and optionally a Nova Agent endpoint.

### Manual controller installation

```bash
apt update && apt install -y git
git clone https://github.com/gustavoalmanzavargas-dotcom/Novacloud.git
cd Novacloud
sudo bash install.sh
```

## Install a Nova compute agent

Run this on a Debian-based Linux compute host where KVM is available:

```bash
cd /opt/novacloud
sudo bash scripts/install-nova-agent.sh
```

The script installs the Nova-owned agent service and the low-level Linux virtualization dependencies, creates the default `novabr0` network, enables forwarding/NAT for the development network, and prints the controller URL/token settings.

Configure the controller with:

```bash
NOVA_AGENT_URL=http://COMPUTE-HOST-IP:9443
NOVA_AGENT_TOKEN=THE-TOKEN-PRINTED-BY-THE-AGENT-INSTALLER
```

Keep the agent token secret. It grants host-control authority.


## Update an installed controller

```bash
cd /opt/novacloud
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

For a compute host:

```bash
systemctl status nova-agent --no-pager
journalctl -u nova-agent -n 100 --no-pager
```
