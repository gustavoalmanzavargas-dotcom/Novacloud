# NovaCloud console capability map

The console ships no demonstration infrastructure, invented organizations,
regional capacity, preset AI conversations, fake invoices or simulated success.
Every executable control calls a Nova API. Errors remain visible. Viewers cannot
mutate resources; administrator and operator permissions are checked by the
server, including for accounts disabled after login.

| Workspace | Implemented behavior | Boundary |
| --- | --- | --- |
| Overview | Actual resource inventory and persisted job status | Last successful inventory sample, not guest telemetry |
| Compute | VM create/start/force-stop/graceful shutdown/reboot/delete; stopped-VM CPU/memory/root-disk editing; images upload/import/delete; volume attachment and detachment; public-key inventory | x86 QEMU/KVM; software emulation remains available without KVM; SSH keys are not automatically injected |
| Containers | Native LXC creation, lifecycle, delete, terminal | Requires validated namespaces, cgroups, veth and bridge; no Docker or Kubernetes claims |
| Applications | Git clone/build/start/stop/restart/redeploy/delete, journal logs | Administrator-managed code on the compute host; no domain provisioning or container-image engine |
| Databases | Create, rename, query, delete PostgreSQL schemas; SQL dump, download, restore | Logical schemas share the controller PostgreSQL instance; SQL is an administrator console, not a tenant sandbox; no HA or server-size quotas claimed |
| Storage | Actual discovery; file-backed qcow2 volume create/expand/delete | Raw device provisioning and formatting are prohibited; mounted and unmounted devices remain unassigned |
| Networking | Linux bridge/DHCP/NAT create/delete; actual host interface inventory | TAP options require device/privilege checks; no verified tenant firewall isolation, public IP allocation, DNS hosting or load balancing |
| Backups | Actual internal qcow2 snapshot restore/delete; independent database backup inventory, download, restore, recreate deleted database, delete | VM snapshots require stopped VMs and are not independent copies; database restore requires matching PostgreSQL client tools |
| Client workloads | Image-backed client VM/network creation and lifecycle/deletion | Operator-managed workloads; independent tenant login, quotas and isolated billing are not implemented |
| Users & access | Create/edit/disable/delete accounts; roles, password reset; self-password change | Last active administrator is protected; generated initial passwords are displayed once |
| Security | Observed capability and access posture | No fabricated scans, compliance certification or automatic remediation |
| Monitoring | Live controller telemetry, resource/user/event counts | Host/container counters, not invented per-guest CPU or RAM percentages |
| Service logs | Actual controller or agent journal | Administrator access; requires journal permission on controller |
| Activity & audit | Actual recorded events, search, JSON export | No compliance or immutable-ledger claim |
| Nova AI | Real configured model requests with empty initial conversation | Advice only; cannot execute or claim completed infrastructure actions |
| Developer tools | Real authenticated read-only API explorer and JSON export | No invented CLI installer or Terraform provider |
| Billing | Persistent manual invoices; draft/issued/void status and export | No metered usage charges or payment collection; issued status does not send a message |
| Marketplace | Administrator-authored Git deployment recipes; deploy and delete recipes | Private catalog; no fabricated app listings, versions, image availability or prices |
| Settings | Persistent organization/session duration, self-password change | Theme follows the OS; no fake notification/webhook delivery preferences |

## Storage and database ownership

Nova never infers ownership from a disk being visible or unmounted. Disk writes
are restricted to recognized regular qcow2 files directly inside its managed
disk directory. Symlinks, block devices and external paths are rejected.

Database destructive operations verify the resource's schema against its Nova
UUID. Database deletion requires its exact current name. SQL restore replaces
the owned schema in one PostgreSQL transaction. A backup can recreate its deleted
source only when that source schema is absent, with explicit confirmation.

## Services

`nova-agent.service` is `PartOf=novacloud.service`: a controller restart propagates
to an installed local agent. Updating a remote compute host remains a separate
operation on that host. The updater preserves credentials and bind settings and
updates journal permissions and Nginx before its final health check.

## Validation scope

The test suite exercises real HTTP sessions and SQL operations using PostgreSQL
(native PostgreSQL 16 in CI; embedded PostgreSQL locally), plus actual qcow2
operations in CI. Browser checks cover all 19 workspaces, user creation, SQL,
database rename/delete, settings persistence, restricted networking and mobile
navigation. The browser's infrastructure responses are test fixtures; management
writes use the actual PostgreSQL-backed handlers.

KVM guest boot, native LXC guest boot, guest DHCP/DNS and reboot recovery still
need acceptance testing on the deployment host. These tests do not establish
multi-tenant production isolation or AWS/GCP/Azure/Oracle feature parity.

## Existing visual design

The console retains the established Cyverax Nova brand header, expandable icon navigation, slate/cyan palette, system appearance, resource launcher, command palette, shell drawer, and original dashboard layout. Functional work must preserve this design. Real workspace settings and signed-in identity replace the old demonstration organization and profile. Navigation labels do not include fabricated counts or service guarantees.
