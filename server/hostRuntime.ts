import fs from 'node:fs';
import { spawnSync, execFile, type ExecFileOptions } from 'node:child_process';

export function executeResult(command: string, args: string[], timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && (typeof error.code !== 'number' || error.killed)) return reject(error);
      resolve({ stdout, stderr, code: typeof error?.code === 'number' ? error.code : 0 });
    });
  });
}

export function execute(command: string, args: string[], timeout = 30000, options: ExecFileOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(`${command}: ${(stderr || stdout || error.message).trim()}`));
      resolve(String(stdout).trim());
    });
  });
}

export function containerDiagnostics(bridge: string) {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];
  const check = (name: string, command: string, args: string[]) => {
    const result = spawnSync(command, args, { encoding: 'utf8', timeout: 3000 });
    checks[name] = result.status === 0;
    if (!checks[name]) errors.push(`${name}: ${(result.stderr || result.error?.message || 'unavailable').trim()}`);
  };
  for (const tool of ['lxc-start', 'lxc-stop', 'lxc-info', 'lxc-wait', 'lxc-attach', 'debootstrap', 'systemd-run']) {
    check(tool, 'sh', ['-c', 'command -v "$1"', 'nova', tool]);
  }
  check('mount namespace', 'unshare', ['--mount', '--propagation', 'private', 'true']);
  check('network namespace', 'unshare', ['--net', 'true']);
  const cgroup = `/sys/fs/cgroup/nova-probe-${process.pid}`;
  try {
    fs.mkdirSync(cgroup);
    fs.rmdirSync(cgroup);
    checks.cgroup = true;
  } catch (error) {
    checks.cgroup = false;
    errors.push(`cgroup delegation: ${error instanceof Error ? error.message : 'unavailable'}`);
  }
  check('bridge', 'ip', ['link', 'show', 'dev', bridge]);
  const probe = `nvchk${process.pid}`.slice(0, 13);
  check('veth', 'ip', ['link', 'add', probe, 'type', 'veth', 'peer', 'name', `${probe}p`]);
  if (checks.veth) spawnSync('ip', ['link', 'delete', probe], { stdio: 'ignore', timeout: 3000 });
  return { available: Object.values(checks).every(Boolean), runtime: 'lxc', checks, errors, reason: errors[0] || null };
}

export function ipv4Network(cidr: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(cidr);
  if (!match) throw new Error('Invalid IPv4 CIDR');
  const octets = match.slice(1, 5).map(Number);
  const prefix = Number(match[5]);
  if (octets.some(n => n > 255) || prefix < 8 || prefix > 30) throw new Error('Use an IPv4 subnet between /8 and /30');
  const value = octets.reduce((n, octet) => (n * 256 + octet) >>> 0, 0);
  const network = (value & (0xffffffff << (32 - prefix))) >>> 0;
  const broadcast = (network + 2 ** (32 - prefix) - 1) >>> 0;
  const ip = (n: number) => [24, 16, 8, 0].map(shift => (n >>> shift) & 255).join('.');
  return { cidr: `${ip(network)}/${prefix}`, prefix, gateway: ip(network + 1), first: ip(network + 2), last: ip(broadcast - 1), mask: ip((0xffffffff << (32 - prefix)) >>> 0), network, broadcast };
}

export function lxcConfig(container: { rootfs: string; name: string; memoryMb: number; cpuLimit: number }, bridge: string) {
  if (!/^[a-zA-Z0-9_.-]{1,15}$/.test(bridge)) throw new Error('Invalid container bridge');
  if (/[\r\n]/.test(container.rootfs)) throw new Error('Invalid root filesystem path');
  return [
    'lxc.include = /usr/share/lxc/config/common.conf',
    `lxc.rootfs.path = dir:${container.rootfs}`,
    `lxc.uts.name = ${container.name}`,
    `lxc.cgroup2.memory.max = ${container.memoryMb * 1024 * 1024}`,
    `lxc.cgroup2.cpu.max = ${container.cpuLimit * 100000} 100000`,
    'lxc.net.0.type = veth',
    `lxc.net.0.link = ${bridge}`,
    'lxc.net.0.flags = up',
    'lxc.net.0.name = eth0',
    '',
  ].join('\n');
}
