# Cyverax Nova

> **Proprietary software — active development.** Cyverax Nova is not open source. Development/evaluation access does not grant production-use rights. A valid Cyverax Nova license is required for authorized production, commercial, or continued licensed use. See [LICENSE](LICENSE).

Cyverax Nova is a self-hosted cloud platform with its own control plane, resource model, jobs, host protocol, and management UI.

## Architecture

NovaCloud is its own cloud control plane. The Nova UI communicates only with the Nova control API.

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


## Update an installed controller and local agent

After checking out the reviewed release in `/opt/novacloud`, run:

```bash
sudo bash scripts/update.sh
```

The updater builds the controller and agent, applies the schema, updates an installed
local agent, preserves its credential and bind address, and upgrades the existing
Nova Nginx configuration for large uploads, long operations, SSE and WebSockets.
It preserves the configured hostname and TLS certificate paths. A failed Nginx
validation restores the previous configuration.

## Native container runtime and host requirements

Nova's controller, agent protocol, state files, resource configuration, lifecycle
handlers, image transfer logic and console routing are Nova code. LXC and QEMU
execute Linux container and VM operations underneath that code; Nova does not
call another cloud control plane. This implementation was written for Nova.

New containers use Nova-generated native LXC configurations and Debian 13 root
filesystems. Existing nspawn containers retain their runtime. New LXC guests get
an `eth0` veth, DHCP, DNS and resource limits. The agent restores its managed
bridges, DHCP processes and NAT rules when it starts.

The default private subnet is `10.88.0.0/24`. Set `NOVA_AGENT_CIDR` and
`NOVA_AGENT_DNS` in `/etc/novacloud-agent.env` to use another subnet or DNS servers.
Choose a subnet that does not overlap the host LAN or another routed network.
Nova does not move the host management uplink onto a bridge.

Inside an outer LXC, installing commands alone does not grant permission to run
nested containers. Nova probes mount/network namespaces, cgroup delegation,
veth creation and the configured bridge. The container UI displays the failed
check. The outer host must grant the required nesting and network permissions.
Nova never changes the outer host's configuration through a management API.

KVM and container support are independent. VMs can use QEMU software acceleration
without `/dev/kvm`. Where bridge/TAP permissions are unavailable, explicitly select
`user` networking for a VM. Nova does not silently substitute networking modes.
A cloud disk image may still require its own guest login and OS configuration.

For a remote controller, set `NOVA_AGENT_BIND` to a reachable management address
on the compute host, and configure the controller's agent URL/token. Console
traffic travels through the authenticated agent connection; the noVNC gateway
stays on the compute host's loopback interface. New agents default to loopback.

## Validation

```bash
npm ci
npm run lint
npm run build
npm test
```

Tests cover transfer failures and atomic image publication, resource validation,
terminal exit codes, application working directories, authenticated agent API
requests, controller database errors, console proxying and Nginx upgrades.
Tests do not certify KVM or nested LXC on a deployment host. Verify guest boot,
DHCP/DNS, console access, stop/start and host reboot recovery on that host before
relying on it for workloads.

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

## Storage ownership boundary

Host-visible disks and partitions are discovery records only. Their ownership is
unknown and they are not automatically assigned to Nova, including unmounted
hardware visible from an LXC. Nova has no raw-disk formatting or pool-creation
endpoint. It does not inspect a mount label and assume that a disk is unused.

Nova volumes are qcow2 files in the configured agent disk directory. Creation
rejects raw-device/path/pool requests; resize and delete reject external paths,
symlinks and non-regular files. Shared filesystem capacity is not dedicated Nova
capacity. Keep LightNAS datasets and devices outside Nova's assigned directory.

A missing `virsh` binary is not a fault: Nova invokes QEMU directly and does not
require libvirt. The controller can remain in LXC while a separate authenticated
Nova Agent runs on a KVM host. Without usable KVM, the connected QEMU host offers
software emulation only; running services do not prove accelerated guest execution.

## Functional cloud console

The console uses a single capability-aware navigation model. Each executable
control calls a real Nova handler; unsupported engines are identified before
an operation can be submitted. See [the capability map](docs/CONSOLE-CAPABILITIES.md)
for all 19 workspaces, implemented actions and deployment requirements.

Users & access supports account creation, editing, role changes, disabling,
password reset and deletion. Disabling or deleting an account revokes subsequent
API requests from its existing sessions. At least one active administrator must
remain. Viewers are read-only, including for interactive VM consoles.

Databases supports create, rename, administrator SQL, confirmed deletion,
snapshot download and transaction-protected restore. These resources are named
PostgreSQL schemas in the existing PostgreSQL service; they are not standalone
managed PostgreSQL clusters. Database backups remain accessible after source
deletion, and can recreate their absent source with explicit confirmation.

Billing stores operator-entered invoice records; no payments or metered charges
are fabricated. Marketplace is a private catalog of your administrators' Git
application recipes. Nova AI starts empty and sends actual requests only when
its model key is configured. It provides advice rather than executing changes.

After installing this update, restarting `novacloud` also restarts the installed
local compute agent through a systemd dependency. Apply the updater at least
once so existing installations receive that unit configuration.

For browser verification after a build:

```bash
npx playwright install chromium
npm run test:browser
```

The browser suite uses an isolated test database and explicit infrastructure
fixtures. Set `TEST_DATABASE_URL` to an isolated PostgreSQL test instance to run
the native SQL dump/restore checks; CI uses PostgreSQL 16 and matching client
utilities. Do not point test runs at a production control-plane database.
