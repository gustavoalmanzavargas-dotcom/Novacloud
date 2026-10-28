import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import http from 'node:http';
import { proxyWebSocket } from './websocketProxy';
import { STORAGE_POLICY, discoveryOnly, assertManagedDisk } from './storagePolicy';
import { receiveImage, downloadImage } from './imageTransfer';
import { execute, executeResult, containerDiagnostics, ipv4Network, lxcConfig } from './hostRuntime';

type NovaNetwork = {
  id: string;
  name: string;
  cidr: string;
  gateway: string;
  bridge: string;
  mode: 'bridge' | 'user';
  nat: boolean;
  createdAt: string;
  updatedAt: string;
};

type NovaApplication = {
  id: string;
  name: string;
  sourceType: 'git';
  repoUrl: string;
  branch: string;
  buildCommand: string;
  startCommand: string;
  outputDir: string;
  env: Record<string, string>;
  port: number;
  domain: string;
  workDir: string;
  unit: string;
  status: 'Running' | 'Stopped' | 'Failed' | 'Deploying';
  createdAt: string;
  updatedAt: string;
};

type NovaContainer = {
  id: string;
  name: string;
  base: 'debian-13';
  rootfs: string;
  machine: string;
  unit: string;
  cpuLimit: number;
  memoryMb: number;
  networkMode: 'private' | 'bridge';
  runtime?: 'lxc' | 'systemd-nspawn';
  bridge?: string;
  status: 'Running' | 'Stopped' | 'Failed' | 'Creating';
  createdAt: string;
  updatedAt: string;
};

type NovaVolume = {
  id: string;
  name: string;
  sizeGb: number;
  path: string;
  format: 'qcow2';
  status: 'Available' | 'In-Use';
  attachedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

type InstanceState = {
  id: string;
  name: string;
  status: 'Running' | 'Stopped' | 'Failed';
  vcpu: number;
  memoryMb: number;
  diskGb: number;
  diskPath: string;
  imagePath?: string;
  bridge: string;
  tap: string;
  mac: string;
  pidFile: string;
  qmpSocket: string;
  networkMode: 'bridge' | 'user';
  acceleration: 'kvm' | 'tcg';
  bootMode: 'image' | 'blank';
  imageId?: string;
  vncDisplay: number;
  vncPort: number;
  createdAt: string;
  updatedAt: string;
};

const app = express();
app.use(express.json({ limit: '4mb' }));

const port = Number(process.env.NOVA_AGENT_PORT || 9443);
const bind = process.env.NOVA_AGENT_BIND || '127.0.0.1';
const token = String(process.env.NOVA_AGENT_TOKEN || '');
const stateDir = process.env.NOVA_AGENT_STATE_DIR || '/var/lib/novacloud-agent';
const instancesDir = path.join(stateDir, 'instances');
const imagesDir = path.join(stateDir, 'images');
const disksDir = path.join(stateDir, 'disks');
const networksDir = path.join(stateDir, 'networks');
const volumesDir = path.join(stateDir, 'volumes');
const appsDir = path.join(stateDir, 'apps');
const appSourcesDir = path.join(stateDir, 'app-sources');
const containersDir = path.join(stateDir, 'containers');
const containerRootsDir = path.join(stateDir, 'container-roots');
const lxcDir = path.join(stateDir, 'lxc');
const runDir = process.env.NOVA_AGENT_RUN_DIR || '/run/novacloud-agent';
const defaultBridge = process.env.NOVA_AGENT_BRIDGE || 'novabr0';

for (const dir of [stateDir, instancesDir, imagesDir, disksDir, networksDir, volumesDir, appsDir, appSourcesDir, containersDir, containerRootsDir, lxcDir, runDir]) fs.mkdirSync(dir, { recursive: true });

function requireToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!token || req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ error: 'Nova Agent authentication failed' });
  }
  next();
}
app.use('/v1', requireToken);

function commandExists(name: string) {
  return spawnSync('sh', ['-lc', `command -v ${name}`], { stdio: 'ignore' }).status === 0;
}

function run(command: string, args: string[], timeout = 30000) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  return (result.stdout || '').trim();
}

function safeId(value: string) {
  if (!/^[a-f0-9-]{36}$/.test(value)) throw new Error('Invalid instance identifier');
  return value;
}

function safeFilename(value: string) {
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(value)) throw new Error('Invalid filename');
  return value;
}

function jsonFile(dir: string, id: string) {
  return path.join(dir, `${safeId(id)}.json`);
}

function saveJson(target: string, value: unknown) {
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temp, target);
}

function readJson<T>(target: string): T {
  return JSON.parse(fs.readFileSync(target, 'utf8')) as T;
}

function listJson<T>(dir: string): T[] {
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      try { return readJson<T>(path.join(dir, name)); } catch { return null; }
    })
    .filter(Boolean) as T[];
}

function parseIpv4Cidr(cidr: string) {
  return ipv4Network(cidr);
}

function ensureNatRule(cidr: string) {
  if (!commandExists('nft')) throw new Error('nftables is required for Nova NAT networks');
  const route = JSON.parse(run('ip', ['-j', 'route', 'show', 'default']));
  const uplink = route[0]?.dev;
  if (!uplink) throw new Error('No default uplink is available for NAT');
  run('sysctl', ['-w', 'net.ipv4.ip_forward=1']);
  if (spawnSync('nft', ['list', 'table', 'ip', 'nova_nat'], { stdio: 'ignore' }).status !== 0) {
    run('nft', ['add', 'table', 'ip', 'nova_nat']);
  }
  if (spawnSync('nft', ['list', 'chain', 'ip', 'nova_nat', 'postrouting'], { stdio: 'ignore' }).status !== 0) {
    run('nft', ['add', 'chain', 'ip', 'nova_nat', 'postrouting', '{', 'type', 'nat', 'hook', 'postrouting', 'priority', '100', ';', 'policy', 'accept', ';', '}']);
  }
  const comment = `nova:${cidr}`;
  const rules = run('nft', ['list', 'chain', 'ip', 'nova_nat', 'postrouting']);
  if (!rules.includes(`"${comment}"`)) {
    run('nft', ['add', 'rule', 'ip', 'nova_nat', 'postrouting', 'ip', 'saddr', cidr, 'oifname', uplink, 'masquerade', 'comment', JSON.stringify(comment)]);
  }
}

function networkUnit(bridge: string) { return `nova-dhcp-${bridge}.service`; }

function ensureNetwork(bridge: string, cidr: string, nat: boolean) {
  if (!/^[A-Za-z0-9_.-]{1,15}$/.test(bridge)) throw new Error('Invalid bridge name');
  const parsed = ipv4Network(cidr);
  if (spawnSync('ip', ['link', 'show', 'dev', bridge], { stdio: 'ignore' }).status !== 0) {
    run('ip', ['link', 'add', 'name', bridge, 'type', 'bridge']);
  }
  const link = JSON.parse(run('ip', ['-j', '-d', 'link', 'show', 'dev', bridge]));
  if (link[0]?.linkinfo?.info_kind !== 'bridge') throw new Error(`${bridge} is not a Linux bridge; refusing to change its address`);
  run('ip', ['address', 'replace', `${parsed.gateway}/${parsed.prefix}`, 'dev', bridge]);
  run('ip', ['link', 'set', 'dev', bridge, 'up']);
  if (nat) ensureNatRule(parsed.cidr);
  if (spawnSync('systemctl', ['is-active', '--quiet', networkUnit(bridge)], { stdio: 'ignore' }).status !== 0) {
    spawnSync('systemctl', ['reset-failed', networkUnit(bridge)], { stdio: 'ignore' });
    const dns = process.env.NOVA_AGENT_DNS || '1.1.1.1,8.8.8.8';
    run('systemd-run', ['--unit', networkUnit(bridge), '--collect', '--property=Type=exec',
      'dnsmasq', '--keep-in-foreground', '--conf-file=/dev/null', '--port=0', '--bind-dynamic',
      `--interface=${bridge}`, '--except-interface=lo',
      `--dhcp-range=${parsed.first},${parsed.last},${parsed.mask},12h`,
      `--dhcp-option=option:router,${parsed.gateway}`, `--dhcp-option=option:dns-server,${dns}`,
      `--dhcp-leasefile=${path.join(stateDir, `${bridge}.leases`)}`, '--dhcp-authoritative']);
  }
}

let networkError: string | null = null;
let diagnosticsCache: { at: number; value: ReturnType<typeof containerDiagnostics> } | null = null;
function runtimeDiagnostics() {
  if (!diagnosticsCache || Date.now() - diagnosticsCache.at > 30000) {
    diagnosticsCache = { at: Date.now(), value: containerDiagnostics(defaultBridge) };
  }
  const value = diagnosticsCache.value;
  return networkError ? { ...value, available: false, reason: networkError, errors: [...value.errors, networkError] } : value;
}

function configureGuestNetwork(rootfs: string) {
  const networkDir = path.join(rootfs, 'etc/systemd/network');
  fs.mkdirSync(networkDir, { recursive: true });
  fs.writeFileSync(path.join(networkDir, '10-nova.network'), '[Match]\nName=eth0 host0\n[Network]\nDHCP=ipv4\n[DHCPv4]\nUseDNS=true\n');
  const wants = path.join(rootfs, 'etc/systemd/system/multi-user.target.wants');
  fs.mkdirSync(wants, { recursive: true });
  const link = path.join(wants, 'systemd-networkd.service');
  try { fs.symlinkSync('/usr/lib/systemd/system/systemd-networkd.service', link); } catch (error: any) { if (error.code !== 'EEXIST') throw error; }
  // A host's loopback stub resolver is unreachable from a guest network namespace.
  const resolver = path.join(rootfs, 'etc/resolv.conf');
  try { fs.unlinkSync(resolver); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  fs.writeFileSync(resolver, (process.env.NOVA_AGENT_DNS || '1.1.1.1,8.8.8.8').split(',').map(ip => `nameserver ${ip.trim()}\n`).join(''));
}

function instanceFile(id: string) {
  return path.join(instancesDir, `${safeId(id)}.json`);
}

function readInstance(id: string): InstanceState {
  const instance = JSON.parse(fs.readFileSync(instanceFile(id), 'utf8')) as InstanceState;
  assertManagedDisk(disksDir, instance.diskPath, true);
  return instance;
}

function saveInstance(instance: InstanceState) {
  instance.updatedAt = new Date().toISOString();
  const target = instanceFile(instance.id);
  const temp = `${target}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(instance, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temp, target);
}

function pidFor(instance: InstanceState) {
  try {
    const pid = Number(fs.readFileSync(instance.pidFile, 'utf8').trim());
    if (pid > 1) {
      process.kill(pid, 0);
      const command = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
      if (!path.basename(command[0] || '').startsWith('qemu-system-') || !command.some(arg => arg.includes(`file=${instance.diskPath},`))) return null;
      return pid;
    }
  } catch {}
  return null;
}

function currentState(instance: InstanceState): InstanceState {
  const running = Boolean(pidFor(instance));
  return { ...instance, status: running ? 'Running' : (instance.status === 'Failed' ? 'Failed' : 'Stopped') };
}

function listInstances() {
  return fs.readdirSync(instancesDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      try { return currentState(JSON.parse(fs.readFileSync(path.join(instancesDir, name), 'utf8'))); }
      catch { return null; }
    })
    .filter(Boolean) as InstanceState[];
}

function ensureTap(instance: InstanceState) {
  const existing = spawnSync('ip', ['link', 'show', instance.tap], { stdio: 'ignore' }).status === 0;
  if (!existing) run('ip', ['tuntap', 'add', 'dev', instance.tap, 'mode', 'tap']);
  run('ip', ['link', 'set', instance.tap, 'master', instance.bridge]);
  run('ip', ['link', 'set', instance.tap, 'up']);
}

function destroyTap(instance: InstanceState) {
  spawnSync('ip', ['link', 'del', instance.tap], { stdio: 'ignore' });
}

function canUseKvm() {
  try {
    const fd = fs.openSync('/dev/kvm', 'r+');
    fs.closeSync(fd);
    return commandExists('qemu-system-x86_64');
  } catch { return false; }
}

function canUseTapBridge(bridge: string) {
  if (!commandExists('ip') || bridge === 'user') return false;
  if (spawnSync('ip', ['link', 'show', bridge], { stdio: 'ignore' }).status !== 0) return false;
  if (!fs.existsSync('/dev/net/tun')) return false;
  const probe = `nvprobe${process.pid}`;
  const result = spawnSync('ip', ['tuntap', 'add', 'dev', probe, 'mode', 'tap'], { stdio: 'ignore' });
  if (result.status !== 0) return false;
  spawnSync('ip', ['link', 'del', probe], { stdio: 'ignore' });
  return true;
}

function nextVncDisplay() {
  const used = new Set(listInstances().map((item) => Number(item.vncDisplay || 0)).filter(Boolean));
  for (let display = 1; display <= 99; display += 1) {
    if (!used.has(display)) return display;
  }
  throw new Error('No Nova VNC console displays are available');
}

function writeNoVncTokens() {
  const tokenFile = path.join(stateDir, 'novnc.tokens');
  const lines = listInstances()
    .filter((item) => Number(item.vncPort || 0) > 0)
    .map((item) => `${item.id}: 127.0.0.1:${item.vncPort}`);
  fs.writeFileSync(tokenFile, lines.length ? lines.join('\n') + '\n' : '', { mode: 0o600 });
}

function startInstance(instance: InstanceState) {
  if (pidFor(instance)) return currentState(instance);
  if (!instance.vncDisplay || !instance.vncPort) {
    instance.vncDisplay = nextVncDisplay();
    instance.vncPort = 5900 + instance.vncDisplay;
    saveInstance(instance);
    writeNoVncTokens();
  }
  if (!commandExists('qemu-system-x86_64')) throw new Error('QEMU is not installed on this Nova host');

  const acceleration: 'kvm' | 'tcg' = canUseKvm() ? 'kvm' : 'tcg';
  const requestedBridge = instance.bridge || defaultBridge;
  const useBridge = canUseTapBridge(requestedBridge);
  if (requestedBridge !== 'user' && !useBridge) throw new Error(`Bridge/TAP networking is unavailable for ${requestedBridge}; select user networking explicitly or fix host permissions`);
  const networkMode: 'bridge' | 'user' = useBridge ? 'bridge' : 'user';

  if (useBridge) ensureTap(instance);

  const args = [
    '-daemonize',
    '-pidfile', instance.pidFile,
    '-qmp', `unix:${instance.qmpSocket},server=on,wait=off`,
    '-name', instance.name,
    '-machine', acceleration === 'kvm' ? 'q35,accel=kvm' : 'q35,accel=tcg',
    '-cpu', acceleration === 'kvm' ? 'host' : 'max',
    '-smp', String(instance.vcpu),
    '-m', String(instance.memoryMb),
    '-drive', `file=${instance.diskPath},if=virtio,format=qcow2,cache=none`,
    '-display', 'none',
    '-serial', 'none',
    '-nodefaults',
    '-device', 'virtio-vga',
    '-device', 'qemu-xhci',
    '-device', 'usb-kbd',
    '-device', 'usb-tablet',
    '-vnc', `127.0.0.1:${instance.vncDisplay}`,
  ];

  if (networkMode === 'bridge') {
    args.push(
      '-netdev', `tap,id=net0,ifname=${instance.tap},script=no,downscript=no`,
      '-device', `virtio-net-pci,netdev=net0,mac=${instance.mac}`,
    );
  } else {
    args.push(
      '-netdev', 'user,id=net0,ipv6=off',
      '-device', `virtio-net-pci,netdev=net0,mac=${instance.mac}`,
    );
  }

  if (instance.imagePath && fs.existsSync(instance.imagePath) && /\.iso$/i.test(instance.imagePath)) {
    args.push('-drive', `file=${instance.imagePath},media=cdrom,readonly=on`, '-boot', 'order=d');
  }

  try {
    run('qemu-system-x86_64', args, 30000);
  } catch (error) {
    if (useBridge) destroyTap(instance);
    instance.status = 'Failed';
    saveInstance(instance);
    throw error;
  }

  spawnSync('sleep', ['0.25']);
  const startedPid = pidFor(instance);
  if (!startedPid) {
    instance.status = 'Failed';
    instance.networkMode = networkMode;
    instance.acceleration = acceleration;
    saveInstance(instance);
    if (useBridge) destroyTap(instance);
    throw new Error('QEMU exited before the VM reached running state. Check the selected boot image and VM configuration.');
  }

  instance.status = 'Running';
  instance.networkMode = networkMode;
  instance.acceleration = acceleration;
  saveInstance(instance);
  writeNoVncTokens();
  return currentState(instance);
}

function stopInstance(instance: InstanceState) {
  const pid = pidFor(instance);
  if (pid) {
    try { process.kill(pid, 'SIGTERM'); } catch {}
    const until = Date.now() + 15000;
    while (Date.now() < until) {
      try { process.kill(pid, 0); } catch { break; }
      spawnSync('sleep', ['0.2']);
    }
    try { process.kill(pid, 'SIGKILL'); } catch {}
  }
  if (instance.networkMode === 'bridge') destroyTap(instance);
  try { fs.unlinkSync(instance.pidFile); } catch {}
  try { fs.unlinkSync(instance.qmpSocket); } catch {}
  instance.status = 'Stopped';
  saveInstance(instance);
  return currentState(instance);
}

type NovaBlockDevice = {
  name: string;
  path: string;
  type: string;
  sizeBytes: number;
  model: string;
  serial: string;
  transport: string;
  rotational: boolean | null;
  filesystem: string;
  fsLabel: string;
  mountpoints: string[];
  readOnly: boolean;
  parent: string;
  children: NovaBlockDevice[];
};

function discoverBlockDevices(): NovaBlockDevice[] {
  if (!commandExists('lsblk')) return [];
  const output = spawnSync('lsblk', [
    '--json',
    '--bytes',
    '--output', 'NAME,PATH,TYPE,SIZE,MODEL,SERIAL,TRAN,ROTA,FSTYPE,LABEL,MOUNTPOINTS,RO,PKNAME',
  ], { encoding: 'utf8', timeout: 10000 });
  if (output.error || output.status !== 0) return [];
  try {
    const parsed = JSON.parse(output.stdout || '{"blockdevices":[]}');
    const normalize = (item: any): NovaBlockDevice => ({
      name: String(item.name || ''),
      path: String(item.path || ''),
      type: String(item.type || ''),
      sizeBytes: Number(item.size || 0),
      model: String(item.model || '').trim(),
      serial: String(item.serial || '').trim(),
      transport: String(item.tran || '').trim(),
      rotational: item.rota === null || item.rota === undefined ? null : Boolean(Number(item.rota)),
      filesystem: String(item.fstype || ''),
      fsLabel: String(item.label || ''),
      mountpoints: Array.isArray(item.mountpoints) ? item.mountpoints.filter(Boolean).map(String) : [],
      readOnly: Boolean(Number(item.ro || 0)),
      parent: String(item.pkname || ''),
      children: Array.isArray(item.children) ? item.children.map(normalize) : [],
    });
    return Array.isArray(parsed.blockdevices) ? parsed.blockdevices.map(normalize) : [];
  } catch {
    return [];
  }
}

function storageMounts() {
  const output = spawnSync('findmnt', ['--json', '--bytes', '--output', 'SOURCE,TARGET,FSTYPE,SIZE,USED,AVAIL,USE%'], {
    encoding: 'utf8',
    timeout: 10000,
  });
  if (output.error || output.status !== 0) return [];
  try {
    const parsed = JSON.parse(output.stdout || '{"filesystems":[]}');
    return Array.isArray(parsed.filesystems) ? parsed.filesystems : [];
  } catch {
    return [];
  }
}

function hostFacts() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const stat = fs.statfsSync(stateDir);
  const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, values]) =>
    (values || []).filter((entry) => entry.family === 'IPv4').map((entry) => ({
      name, address: entry.address, cidr: entry.cidr, internal: entry.internal,
    }))
  );
  return {
    id: crypto.createHash('sha256').update(os.hostname()).digest('hex').slice(0, 24),
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuCount: cpus.length,
    loadAverage: os.loadavg(),
    uptimeSeconds: os.uptime(),
    memory: {
      totalBytes: totalMemory,
      freeBytes: freeMemory,
      usedBytes: totalMemory - freeMemory,
    },
    storage: {
      path: stateDir,
      totalBytes: stat.blocks * stat.bsize,
      freeBytes: stat.bavail * stat.bsize,
      usedBytes: (stat.blocks - stat.bfree) * stat.bsize,
      devices: discoveryOnly(discoverBlockDevices()),
      policy: STORAGE_POLICY,
      managedDiskDirectory: disksDir,
      mounts: storageMounts(),
    },
    capabilities: {
      kvm: canUseKvm(),
      kvmPresent: fs.existsSync('/dev/kvm'),
      qemu: commandExists('qemu-system-x86_64'),
      qemuImg: commandExists('qemu-img'),
      acceleration: canUseKvm() ? 'kvm' : (commandExists('qemu-system-x86_64') ? 'tcg' : 'none'),
      userNetworking: commandExists('qemu-system-x86_64'),
      tapNetworking: canUseTapBridge(defaultBridge),
      nftables: commandExists('nft'),
      iproute2: commandExists('ip'),
      bridge: defaultBridge,
      containers: runtimeDiagnostics().available,
      containerRuntime: 'lxc',
      containerDiagnostics: runtimeDiagnostics(),
      networkError,
    },
    interfaces,
    timestamp: new Date().toISOString(),
  };
}

app.get('/v1/health', (_req, res) => res.json({ status: 'ok', service: 'nova-agent', version: '0.1.0' }));
app.get('/v1/host', (_req, res) => res.json(hostFacts()));

app.get('/v1/storage/devices', (_req, res) => {
  const stat = fs.statfsSync(stateDir);
  res.json({
    statePath: stateDir,
    stateFilesystem: {
      totalBytes: stat.blocks * stat.bsize,
      freeBytes: stat.bavail * stat.bsize,
      usedBytes: (stat.blocks - stat.bfree) * stat.bsize,
    },
    policy: STORAGE_POLICY,
    managedStorage: { kind: 'directory', path: disksDir, backend: 'qcow2-files' },
    devices: discoveryOnly(discoverBlockDevices()),
    mounts: storageMounts(),
  });
});
app.get('/v1/instances', (_req, res) => res.json(listInstances()));

app.post('/v1/instances', (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const vcpu = Number(req.body?.vcpu || 2);
    const memoryMb = Number(req.body?.memoryMb || 4096);
    const diskGb = Number(req.body?.diskGb || 32);
    const bridge = String(req.body?.bridge || defaultBridge).trim();
    const imageId = String(req.body?.imageId || '').trim();
    const bootMode = String(req.body?.bootMode || 'image') === 'blank' ? 'blank' : 'image';
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) return res.status(400).json({ error: 'A valid instance name is required' });
    if (!Number.isInteger(vcpu) || vcpu < 1 || vcpu > 256 || (!Number.isInteger(memoryMb) || memoryMb < 512 || memoryMb > 1048576) || (!Number.isInteger(diskGb) || diskGb < 4 || diskGb > 65536)) {
      return res.status(400).json({ error: 'Instance resources are outside allowed limits' });
    }
    if (!/^[A-Za-z0-9_.:-]{1,32}$/.test(bridge)) return res.status(400).json({ error: 'Invalid bridge name' });
    const resolvedBridge = bridge;

    if (bootMode === 'image' && !imageId) {
      return res.status(400).json({ error: 'Select a Nova image before creating this VM' });
    }

    const id = crypto.randomUUID();
    const diskPath = assertManagedDisk(disksDir, path.join(disksDir, `${id}.qcow2`), true);
    const imagePath = imageId ? path.join(imagesDir, safeFilename(imageId)) : undefined;
    if (imagePath && !fs.existsSync(imagePath)) return res.status(400).json({ error: 'Selected image does not exist on this Nova host' });
    const vncDisplay = nextVncDisplay();
    const vncPort = 5900 + vncDisplay;

    if (imagePath && !/\.iso$/i.test(imagePath)) {
      const info = JSON.parse(run('qemu-img', ['info', '--output=json', imagePath]));
      if (!['qcow2', 'raw'].includes(info.format)) return res.status(400).json({ error: 'Use an ISO, qcow2 or raw disk image' });
      if (Number(info['virtual-size']) > diskGb * 1024 ** 3) return res.status(400).json({ error: 'VM disk must be at least as large as the image virtual size' });
      run('qemu-img', ['create', '-f', 'qcow2', '-F', info.format, '-b', imagePath, diskPath, `${diskGb}G`]);
    } else {
      run('qemu-img', ['create', '-f', 'qcow2', diskPath, `${diskGb}G`]);
    }

    const instance: InstanceState = {
      id,
      name,
      status: 'Stopped',
      vcpu,
      memoryMb,
      diskGb,
      diskPath,
      imagePath,
      imageId: imageId || undefined,
      bootMode,
      vncDisplay,
      vncPort,
      bridge: resolvedBridge,
      tap: `nv${id.replace(/-/g, '').slice(0, 10)}`,
      mac: '52:54:00:' + crypto.randomBytes(3).toString('hex').match(/.{2}/g)!.join(':'),
      pidFile: path.join(runDir, `${id}.pid`),
      qmpSocket: path.join(runDir, `${id}.qmp`),
      networkMode: resolvedBridge === 'user' ? 'user' : 'bridge',
      acceleration: canUseKvm() ? 'kvm' : 'tcg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveInstance(instance);
    writeNoVncTokens();
    const shouldStart = bootMode === 'image' && req.body?.start !== false;
    res.status(201).json(shouldStart ? startInstance(instance) : currentState(instance));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Instance creation failed' });
  }
});

app.get('/v1/instances/:id/console', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    if (!instance.vncPort) return res.status(409).json({ error: 'This VM does not have a graphical console configured' });
    res.json({
      id: instance.id,
      name: instance.name,
      type: 'vnc',
      token: instance.id,
      display: instance.vncDisplay,
      port: instance.vncPort,
      running: Boolean(pidFor(instance)),
    });
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : 'VM not found' });
  }
});

app.post('/v1/instances/:id/action', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    const action = String(req.body?.action || '');
    if (action === 'start') return res.json(startInstance(instance));
    if (action === 'stop' || action === 'shutdown') return res.json(stopInstance(instance));
    if (action === 'reboot') {
      stopInstance(instance);
      return res.json(startInstance(instance));
    }
    return res.status(400).json({ error: 'Unsupported instance action' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Instance action failed' });
  }
});

app.delete('/v1/instances/:id', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    stopInstance(instance);
    if (req.query.keepDisk !== 'true') {
      try { fs.unlinkSync(instance.diskPath); } catch {}
    }
    fs.unlinkSync(instanceFile(instance.id));
    writeNoVncTokens();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Instance deletion failed' });
  }
});

function containerFile(id: string) {
  return jsonFile(containersDir, id);
}

function containerState(container: NovaContainer): NovaContainer {
  let active: boolean;
  if (container.runtime === 'lxc') {
    const result = spawnSync('lxc-info', ['-P', lxcDir, '-n', container.machine, '-sH'], { encoding: 'utf8', timeout: 3000 });
    const state = result.stdout?.trim();
    if (result.status !== 0 || !['RUNNING', 'STOPPED', 'FROZEN'].includes(state)) {
      throw new Error(`Cannot determine container state; refusing an unsafe operation: ${result.stderr || state || 'LXC unavailable'}`);
    }
    active = state !== 'STOPPED';
  } else {
    active = spawnSync('systemctl', ['is-active', '--quiet', container.unit], { stdio: 'ignore', timeout: 3000 }).status === 0;
  }
  return { ...container, status: active ? 'Running' : (container.status === 'Failed' ? 'Failed' : 'Stopped') };
}

function startContainer(container: NovaContainer) {
  if (container.runtime === 'lxc') {
    if (containerState(container).status === 'Running') return containerState(container);
    const diagnostics = runtimeDiagnostics();
    if (!diagnostics.available) throw new Error(diagnostics.reason || 'Native LXC is unavailable');
    run('lxc-start', ['-P', lxcDir, '-n', container.machine, '-d']);
    run('lxc-wait', ['-P', lxcDir, '-n', container.machine, '-s', 'RUNNING', '-t', '15'], 20000);
    container.status = 'Running';
    container.updatedAt = new Date().toISOString();
    saveJson(containerFile(container.id), container);
    return containerState(container);
  }
  // Existing nspawn containers keep their runtime and root filesystem.
  if (networkError) throw new Error(networkError);
  configureGuestNetwork(container.rootfs);
  if (!commandExists('systemd-nspawn')) throw new Error('systemd-nspawn is not installed on this Nova host');
  if (spawnSync('systemctl', ['is-active', '--quiet', container.unit], { stdio: 'ignore' }).status === 0) {
    return containerState(container);
  }
  const result = spawnSync('systemd-run', [
    '--unit', container.unit.replace(/\.service$/, ''),
    '--property', 'Delegate=yes',
    '--property', `MemoryMax=${container.memoryMb}M`,
    '--property', `CPUQuota=${Math.max(1, container.cpuLimit) * 100}%`,
    '--collect',
    'systemd-nspawn',
    '--quiet',
    '--machine', container.machine,
    '--directory', container.rootfs,
    '--network-veth',
    '--network-bridge', defaultBridge,
    '--boot',
    '--register=yes',
  ], { encoding: 'utf8', timeout: 30000 });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'Container start failed').trim());
  spawnSync('sleep', ['1']);
  if (spawnSync('systemctl', ['is-active', '--quiet', container.unit], { stdio: 'ignore' }).status !== 0) {
    container.status = 'Failed';
    container.updatedAt = new Date().toISOString();
    saveJson(containerFile(container.id), container);
    const log = spawnSync('journalctl', ['-u', container.unit, '-n', '40', '--no-pager', '-o', 'cat'], { encoding: 'utf8' });
    throw new Error((log.stdout || log.stderr || 'Container process exited during startup').trim());
  }
  container.status = 'Running';
  container.updatedAt = new Date().toISOString();
  saveJson(containerFile(container.id), container);
  return containerState(container);
}

function stopContainer(container: NovaContainer) {
  if (container.runtime === 'lxc') {
    if (containerState(container).status === 'Running') {
      run('lxc-stop', ['-P', lxcDir, '-n', container.machine, '-t', '15'], 20000);
    }
    if (containerState(container).status === 'Running') throw new Error('Container is still running; refusing to remove its filesystem');
    container.status = 'Stopped';
    container.updatedAt = new Date().toISOString();
    saveJson(containerFile(container.id), container);
    return containerState(container);
  }
  spawnSync('machinectl', ['poweroff', container.machine], { stdio: 'ignore', timeout: 15000 });
  spawnSync('systemctl', ['stop', container.unit], { stdio: 'ignore', timeout: 15000 });
  if (containerState(container).status === 'Running') throw new Error('Container did not stop; refusing to remove its filesystem');
  container.status = 'Stopped';
  container.updatedAt = new Date().toISOString();
  saveJson(containerFile(container.id), container);
  return containerState(container);
}

app.get('/v1/containers', (_req, res) => {
  res.json(listJson<NovaContainer>(containersDir).map(containerState));
});

const creatingContainerNames = new Set<string>();
app.post('/v1/containers', async (req, res) => {
  const id = crypto.randomUUID();
  let rootfs = '';
  let creatingName = '';
  try {
    const name = String(req.body?.name || '').trim();
    const cpuLimit = Number(req.body?.cpuLimit || 1);
    const memoryMb = Number(req.body?.memoryMb || 1024);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) return res.status(400).json({ error: 'A valid container name is required' });
    if (!Number.isInteger(cpuLimit) || cpuLimit < 1 || cpuLimit > 64) return res.status(400).json({ error: 'Container CPU limit must be between 1 and 64' });
    if (!Number.isInteger(memoryMb) || memoryMb < 256 || memoryMb > 262144) return res.status(400).json({ error: 'Container memory must be between 256 and 262144 MiB' });
    const diagnostics = runtimeDiagnostics();
    if (!diagnostics.available) return res.status(409).json({ error: diagnostics.reason, diagnostics });
    if (req.body?.base && req.body.base !== 'debian-13') return res.status(400).json({ error: 'Unsupported container base' });
    if (creatingContainerNames.has(name) || listJson<NovaContainer>(containersDir).some((item) => item.name === name)) {
      return res.status(409).json({ error: 'A container with that name already exists' });
    }

    creatingName = name;
    creatingContainerNames.add(name);
    rootfs = path.join(containerRootsDir, id);
    fs.mkdirSync(rootfs, { recursive: true });
    await execute('unshare', ['--mount', '--propagation', 'private', '--', 'debootstrap',
      '--variant=minbase',
      '--include=systemd-sysv,ca-certificates,iproute2,procps,bash',
      'trixie',
      rootfs,
      'http://deb.debian.org/debian',
    ], 300000);

    fs.writeFileSync(path.join(rootfs, 'etc', 'hostname'), `${name}\n`);
    configureGuestNetwork(rootfs);

    const container: NovaContainer = {
      id,
      name,
      base: 'debian-13',
      rootfs,
      machine: `nova-${id.replace(/-/g, '').slice(0, 16)}`,
      unit: `nova-ct-${id.replace(/-/g, '').slice(0, 16)}.service`,
      cpuLimit,
      memoryMb,
      networkMode: 'bridge',
      runtime: 'lxc',
      bridge: defaultBridge,
      status: 'Stopped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const configDir = path.join(lxcDir, container.machine);
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config'), lxcConfig(container, defaultBridge));
    saveJson(containerFile(id), container);
    const shouldStart = req.body?.start !== false;
    res.status(201).json(shouldStart ? startContainer(container) : containerState(container));
  } catch (error) {
    if (rootfs && !fs.existsSync(containerFile(id))) {
      try { fs.rmSync(rootfs, { recursive: true, force: true }); } catch {}
    }
    if (fs.existsSync(containerFile(id))) {
      const failed = readJson<NovaContainer>(containerFile(id));
      failed.status = 'Failed';
      saveJson(containerFile(id), failed);
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Container creation failed', id });
  } finally {
    creatingContainerNames.delete(creatingName);
  }
});

app.post('/v1/containers/:id/action', (req, res) => {
  try {
    const container = readJson<NovaContainer>(containerFile(req.params.id));
    const action = String(req.body?.action || '');
    if (action === 'start') return res.json(startContainer(container));
    if (action === 'stop' || action === 'shutdown') return res.json(stopContainer(container));
    if (action === 'restart') {
      stopContainer(container);
      return res.json(startContainer(container));
    }
    return res.status(400).json({ error: 'Unsupported container action' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Container action failed' });
  }
});

app.post('/v1/containers/:id/exec', async (req, res) => {
  try {
    const container = readJson<NovaContainer>(containerFile(req.params.id));
    const state = containerState(container);
    if (state.status !== 'Running') return res.status(409).json({ error: 'Start the container before opening its terminal' });
    const command = String(req.body?.command || '').trim();
    if (!command) return res.status(400).json({ error: 'Command is required' });
    if (command.length > 4096) return res.status(400).json({ error: 'Command is too long' });

    if (container.runtime === 'lxc') {
      const result = await executeResult('lxc-attach', ['-P', lxcDir, '-n', container.machine, '--clear-env', '--', '/bin/bash', '-lc', command]);
      return res.json(result);
    }
    const leader = run('machinectl', ['show', container.machine, '--property=Leader', '--value']);
    if (!/^\d+$/.test(leader)) throw new Error('Unable to resolve the container process namespace');
    const result = await executeResult('nsenter', [
      '-t', leader, '-m', '-u', '-i', '-n', '-p', '--',
      '/bin/bash', '-lc', command,
    ], 30000);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Container command failed' });
  }
});

app.delete('/v1/containers/:id', (req, res) => {
  try {
    const container = readJson<NovaContainer>(containerFile(req.params.id));
    stopContainer(container);
    fs.rmSync(container.rootfs, { recursive: true, force: true });
    if (container.runtime === 'lxc') fs.rmSync(path.join(lxcDir, container.machine), { recursive: true, force: true });
    fs.unlinkSync(containerFile(container.id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Container deletion failed' });
  }
});

app.get('/v1/images', (_req, res) => {
  const items = fs.readdirSync(imagesDir).filter((name) => !name.endsWith('.part')).map((name) => {
    const stat = fs.statSync(path.join(imagesDir, name));
    return {
      id: name,
      name,
      sizeBytes: stat.size,
      format: path.extname(name).slice(1).toLowerCase() || 'unknown',
      createdAt: stat.birthtime.toISOString(),
      updatedAt: stat.mtime.toISOString(),
    };
  });
  res.json(items);
});

app.post('/v1/images/upload', async (req, res) => {
  try {
    const filename = safeFilename(String(req.query?.filename || '').trim());
    const destination = path.join(imagesDir, filename);
    if (fs.existsSync(destination)) return res.status(409).json({ error: 'An image with that filename already exists' });
    const received = await receiveImage(req, destination);
    res.status(201).json({ id: filename, name: filename, sizeBytes: received, format: path.extname(filename).slice(1).toLowerCase() });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Image upload failed' });
  }
});

app.post('/v1/images/import-url', async (req, res) => {
  try {
    const url = String(req.body?.url || '').trim();
    const filename = safeFilename(String(req.body?.filename || '').trim());
    const destination = path.join(imagesDir, filename);
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'A valid HTTP/HTTPS URL is required' });
    if (fs.existsSync(destination)) return res.status(409).json({ error: 'An image with that filename already exists' });
    await downloadImage(url, destination);
    res.status(201).json({ id: filename, name: filename, sizeBytes: fs.statSync(destination).size });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Image import failed' });
  }
});

app.get('/v1/instances/:id/snapshots', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    const output = run('qemu-img', ['snapshot', '-l', '--output=json', instance.diskPath]);
    const snapshots = JSON.parse(output || '[]').map((item: any) => ({
      id: `${instance.id}:${item.name}`,
      name: item.name,
      sourceVm: instance.name,
      sizeGb: instance.diskGb,
      created: item['date-sec'] ? new Date(Number(item['date-sec']) * 1000).toISOString() : '—',
      encryption: 'Host filesystem',
      status: 'Available',
    }));
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Snapshot listing failed' });
  }
});

app.post('/v1/instances/:id/snapshots', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    if (pidFor(instance)) return res.status(409).json({ error: 'Stop the instance before creating an internal qcow2 snapshot' });
    const name = String(req.body?.name || '').trim();
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(name)) return res.status(400).json({ error: 'Invalid snapshot name' });
    run('qemu-img', ['snapshot', '-c', name, instance.diskPath]);
    res.status(201).json({ success: true, id: `${instance.id}:${name}` });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Snapshot creation failed' });
  }
});

app.post('/v1/instances/:id/snapshots/:name/rollback', (req, res) => {
  try {
    const instance = readInstance(req.params.id);
    if (pidFor(instance)) return res.status(409).json({ error: 'Stop the instance before rolling back a snapshot' });
    const name = String(req.params.name || '');
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(name)) return res.status(400).json({ error: 'Invalid snapshot name' });
    run('qemu-img', ['snapshot', '-a', name, instance.diskPath]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Snapshot rollback failed' });
  }
});

app.get('/v1/networks', (_req, res) => {
  res.json(listJson<NovaNetwork>(networksDir));
});

app.post('/v1/networks', (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const cidr = String(req.body?.cidr || '').trim();
    const nat = req.body?.nat !== false;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) return res.status(400).json({ error: 'A valid network name is required' });
    const parsed = parseIpv4Cidr(cidr);
    const configured = listJson<NovaNetwork>(networksDir);
    const defaultSubnet = defaultBridge !== 'user' ? ipv4Network(process.env.NOVA_AGENT_CIDR || '10.88.0.0/24') : null;
    if (configured.some(item => item.name === name || (() => {
      const other = ipv4Network(item.cidr);
      return parsed.network <= other.broadcast && other.network <= parsed.broadcast;
    })()) || (defaultSubnet && parsed.network <= defaultSubnet.broadcast && defaultSubnet.network <= parsed.broadcast)) {
      return res.status(409).json({ error: 'Network name or subnet overlaps an existing Nova network' });
    }
    const id = crypto.randomUUID();
    const bridge = `nvb${id.replace(/-/g, '').slice(0, 10)}`;
    const mode = 'bridge' as const;
    try { ensureNetwork(bridge, parsed.cidr, nat); }
    catch (error) {
      spawnSync('systemctl', ['stop', networkUnit(bridge)], { stdio: 'ignore' });
      spawnSync('ip', ['link', 'del', bridge], { stdio: 'ignore' });
      throw error;
    }
    const network: NovaNetwork = {
      id, name, cidr: parsed.cidr, gateway: parsed.gateway, bridge, mode, nat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveJson(jsonFile(networksDir, id), network);
    res.status(201).json(network);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Network creation failed' });
  }
});

app.delete('/v1/networks/:id', (req, res) => {
  try {
    const target = jsonFile(networksDir, req.params.id);
    const network = readJson<NovaNetwork>(target);
    const inUse = listInstances().some((instance) => instance.bridge === network.bridge);
    if (inUse) return res.status(409).json({ error: 'Network is attached to one or more running or configured instances' });
    if (network.mode === 'bridge' && network.bridge !== 'user') {
      run('systemctl', ['stop', networkUnit(network.bridge)]);
      run('ip', ['link', 'del', network.bridge]);
    }
    fs.unlinkSync(target);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Network deletion failed' });
  }
});

app.get('/v1/volumes', (_req, res) => {
  res.json(listJson<NovaVolume>(volumesDir).map((volume) => ({
    ...volume,
    exists: fs.existsSync(volume.path),
  })));
});

app.post('/v1/volumes', (req, res) => {
  try {
    if (['device', 'devices', 'path', 'pool', 'format'].some(key => Object.hasOwn(req.body || {}, key))) {
      return res.status(400).json({ error: 'Raw-device provisioning is disabled. Nova volumes use only managed qcow2 files.' });
    }
    const name = String(req.body?.name || '').trim();
    const sizeGb = Number(req.body?.sizeGb || 20);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) return res.status(400).json({ error: 'A valid volume name is required' });
    if (!Number.isFinite(sizeGb) || sizeGb < 1 || sizeGb > 65536) return res.status(400).json({ error: 'Volume size must be between 1 and 65536 GiB' });
    if (listJson<NovaVolume>(volumesDir).some((item) => item.name === name)) return res.status(409).json({ error: 'A volume with that name already exists' });
    const id = crypto.randomUUID();
    const volumePath = assertManagedDisk(disksDir, path.join(disksDir, `volume-${id}.qcow2`), true);
    run('qemu-img', ['create', '-f', 'qcow2', volumePath, `${sizeGb}G`]);
    const volume: NovaVolume = {
      id, name, sizeGb, path: volumePath, format: 'qcow2', status: 'Available', attachedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveJson(jsonFile(volumesDir, id), volume);
    res.status(201).json(volume);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Volume creation failed' });
  }
});

app.patch('/v1/volumes/:id', (req, res) => {
  try {
    const target = jsonFile(volumesDir, req.params.id);
    const volume = readJson<NovaVolume>(target);
    assertManagedDisk(disksDir, volume.path, true);
    const sizeGb = Number(req.body?.sizeGb || volume.sizeGb);
    if (!Number.isFinite(sizeGb) || sizeGb < volume.sizeGb) return res.status(400).json({ error: 'Volumes can only be expanded' });
    if (sizeGb > volume.sizeGb) {
      run('qemu-img', ['resize', volume.path, `${sizeGb}G`]);
      volume.sizeGb = sizeGb;
      volume.updatedAt = new Date().toISOString();
      saveJson(target, volume);
    }
    res.json(volume);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Volume resize failed' });
  }
});

app.delete('/v1/volumes/:id', (req, res) => {
  try {
    const target = jsonFile(volumesDir, req.params.id);
    const volume = readJson<NovaVolume>(target);
    assertManagedDisk(disksDir, volume.path, true);
    if (volume.attachedTo) return res.status(409).json({ error: 'Detach the volume before deleting it' });
    try { fs.unlinkSync(volume.path); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    fs.unlinkSync(target);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Volume deletion failed' });
  }
});

function applicationFile(id: string) {
  return jsonFile(appsDir, id);
}

function applicationStatus(appState: NovaApplication): NovaApplication {
  const status = spawnSync('systemctl', ['is-active', '--quiet', appState.unit], { stdio: 'ignore' }).status === 0
    ? 'Running'
    : spawnSync('systemctl', ['is-failed', '--quiet', appState.unit], { stdio: 'ignore' }).status === 0
      ? 'Failed'
      : 'Stopped';
  return { ...appState, status };
}

function parseEnvText(value: unknown) {
  const result: Record<string, string> = {};
  for (const line of String(value || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const split = trimmed.indexOf('=');
    if (split < 1) continue;
    const key = trimmed.slice(0, split).trim();
    const val = trimmed.slice(split + 1);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) result[key] = val;
  }
  return result;
}

const deployingPorts = new Set<number>();
function nextApplicationPort() {
  const used = new Set(listJson<NovaApplication>(appsDir).map((item) => Number(item.port)));
  for (let port = 31000; port <= 31999; port += 1) if (!used.has(port) && !deployingPorts.has(port)) return port;
  throw new Error('No Nova application ports are available');
}

async function deployApplication(input: any, existing?: NovaApplication) {
  const name = String(input?.name || existing?.name || '').trim();
  const repoUrl = String(input?.repoUrl || existing?.repoUrl || '').trim();
  const branch = String(input?.branch || existing?.branch || 'main').trim();
  const buildCommand = String(input?.buildCommand || existing?.buildCommand || 'npm run build').trim();
  const startCommand = String(input?.startCommand || existing?.startCommand || 'npm start').trim();
  const outputDir = String(input?.outputDir || existing?.outputDir || 'dist').trim();
  const domain = String(input?.domain || existing?.domain || '').trim();
  const env = input?.env && typeof input.env === 'object' ? input.env : (existing?.env || parseEnvText(input?.envVars));

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) throw new Error('A valid application name is required');
  if (!/^https?:\/\//i.test(repoUrl) && !/^git@/i.test(repoUrl)) throw new Error('A valid Git repository URL is required');
  if (!commandExists('git')) throw new Error('Git is not installed on this Nova host');

  const id = existing?.id || crypto.randomUUID();
  const workDir = existing?.workDir || path.join(appSourcesDir, id);
  const unit = existing?.unit || `nova-app-${id.replace(/-/g, '').slice(0, 16)}.service`;
  const appPort = existing?.port || nextApplicationPort();

  if (deployingPorts.has(appPort)) throw new Error('This application is already deploying');
  deployingPorts.add(appPort);
  try {
    if (!existing) {
      await execute('git', ['clone', '--depth', '1', '--branch', branch, repoUrl, workDir], 120000);
    } else {
      await execute('git', ['-C', workDir, 'fetch', '--depth', '1', 'origin', branch], 120000);
      run('git', ['-C', workDir, 'reset', '--hard', `origin/${branch}`], 30000);
    }

    if (fs.existsSync(path.join(workDir, 'package.json'))) {
      if (commandExists('npm')) await execute('npm', ['install'], 180000, { cwd: workDir, env: { ...process.env, ...env } });
      else throw new Error('npm is required for this application');
    }

    if (buildCommand && buildCommand !== 'none') {
      await execute('/bin/bash', ['-lc', buildCommand], 300000, {
        cwd: workDir,
        env: { ...process.env, ...env, PORT: String(appPort) },
      });
    }

    spawnSync('systemctl', ['stop', unit], { stdio: 'ignore' });
    spawnSync('systemctl', ['reset-failed', unit], { stdio: 'ignore' });

    const envArgs = Object.entries({ ...env, PORT: String(appPort) })
      .flatMap(([key, value]) => ['--setenv', `${key}=${value}`]);
    const result = spawnSync('systemd-run', [
      '--unit', unit.replace(/\.service$/, ''),
      '--property', `WorkingDirectory=${workDir}`,
      '--property', 'Restart=always',
      '--property', 'RestartSec=3',
      ...envArgs,
      '/bin/bash', '-lc', startCommand,
    ], { encoding: 'utf8', timeout: 30000 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'Unable to start application').trim());

    const state: NovaApplication = {
      id, name, sourceType: 'git', repoUrl, branch, buildCommand, startCommand, outputDir,
      env, port: appPort, domain, workDir, unit, status: 'Running',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveJson(applicationFile(id), state);
    return applicationStatus(state);
  } finally { deployingPorts.delete(appPort); }
}

app.get('/v1/apps', (_req, res) => {
  res.json(listJson<NovaApplication>(appsDir).map(applicationStatus));
});

app.post('/v1/apps', async (req, res) => {
  try {
    if (String(req.body?.sourceType || 'git') !== 'git') {
      return res.status(400).json({ error: 'Nova application runtime currently supports Git deployments on this host' });
    }
    const appState = await deployApplication(req.body);
    res.status(201).json(appState);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Application deployment failed' });
  }
});

app.post('/v1/apps/:id/redeploy', async (req, res) => {
  try {
    const current = readJson<NovaApplication>(applicationFile(req.params.id));
    res.json(await deployApplication(req.body || {}, current));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Application redeploy failed' });
  }
});

app.post('/v1/apps/:id/action', (req, res) => {
  try {
    const current = readJson<NovaApplication>(applicationFile(req.params.id));
    const action = String(req.body?.action || '');
    if (!['start', 'stop', 'restart'].includes(action)) return res.status(400).json({ error: 'Unsupported application action' });
    run('systemctl', [action, current.unit], 30000);
    res.json(applicationStatus(current));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Application action failed' });
  }
});

app.get('/v1/apps/:id/logs', (req, res) => {
  try {
    const current = readJson<NovaApplication>(applicationFile(req.params.id));
    const output = spawnSync('journalctl', ['-u', current.unit, '-n', '200', '--no-pager', '-o', 'cat'], { encoding: 'utf8', timeout: 30000 });
    res.json({ logs: (output.stdout || output.stderr || '').split(/\r?\n/).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to read application logs' });
  }
});

// Recreate Nova-owned bridges, NAT and DHCP after host reboot or agent update.
if (defaultBridge !== 'user') {
  try { ensureNetwork(defaultBridge, process.env.NOVA_AGENT_CIDR || '10.88.0.0/24', true); }
  catch (error) { networkError = error instanceof Error ? error.message : 'Nova network setup failed'; console.error(networkError); }
}
for (const network of listJson<NovaNetwork>(networksDir)) {
  if (network.mode === 'bridge') {
    try { ensureNetwork(network.bridge, network.cidr, network.nat); }
    catch (error) { console.error(`Unable to restore network ${network.name}`, error); }
  }
}
writeNoVncTokens();

const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => {
  try {
    if (!token || req.headers.authorization !== `Bearer ${token}`) return socket.destroy();
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/v1/console') return socket.destroy();
    const instance = readInstance(safeId(url.searchParams.get('vm') || ''));
    if (!pidFor(instance)) return socket.destroy();
    proxyWebSocket(req, socket, head, new URL(`http://127.0.0.1:6080/websockify?token=${encodeURIComponent(instance.id)}`), { authorization: '' });
  } catch { socket.destroy(); }
});
server.listen(port, bind, () => {
  console.log(`Nova Agent listening on ${bind}:${port}`);
});
