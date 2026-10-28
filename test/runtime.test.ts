import { test } from 'node:test';
import { once as onceEvent } from 'node:events';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { Readable } from 'node:stream';
import { execute, executeResult, ipv4Network, lxcConfig } from '../server/hostRuntime.ts';
import { receiveImage, downloadImage } from '../server/imageTransfer.ts';

test('DHCP subnet calculations normalize host addresses and signed IPv4 values', () => {
  const network = ipv4Network('192.168.52.99/24');
  assert.equal(network.cidr, '192.168.52.0/24');
  assert.equal(network.gateway, '192.168.52.1');
  assert.equal(network.first, '192.168.52.2');
  assert.equal(network.last, '192.168.52.254');
  assert.equal(network.mask, '255.255.255.0');
  assert.equal(ipv4Network('10.0.0.0/30').first, '10.0.0.2');
});

test('invalid subnets cannot create broken DHCP networks', () => {
  for (const cidr of ['10.0.0.0/31', '10.0.0.0/32', '10.0.0.0/0', '10.256.0.0/24', 'evil', '10.0.0.0/33']) {
    assert.throws(() => ipv4Network(cidr));
  }
});

test('Nova config supplies LXC guest identity, resource limits and connected veth', () => {
  const config = lxcConfig({ rootfs: '/var/lib/nova/guest', name: 'guest', memoryMb: 1024, cpuLimit: 2 }, 'novabr0');
  assert.match(config, /lxc.cgroup2.memory.max = 1073741824/);
  assert.match(config, /lxc.cgroup2.cpu.max = 200000 100000/);
  assert.match(config, /lxc.net.0.link = novabr0/);
  assert.match(config, /lxc.net.0.name = eth0/);
  assert.throws(() => lxcConfig({ rootfs: '/tmp/guest\nlxc.bad = yes', name: 'guest', memoryMb: 1024, cpuLimit: 1 }, 'novabr0'));
});

test('terminal preserves exit status, stdout and stderr', async () => {
  const result = await executeResult(process.execPath, ['-e', 'process.stdout.write("out"); process.stderr.write("err"); process.exit(7)']);
  assert.deepEqual(result, { stdout: 'out', stderr: 'err', code: 7 });
  await assert.rejects(executeResult('nova-command-that-does-not-exist', []));
  await assert.rejects(executeResult(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], 50));
});

test('build command runs in application directory while event loop stays responsive', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-build-'));
  try {
    let responsive = false;
    const pending = execute(process.execPath, ['-e', 'setTimeout(() => console.log(process.cwd()), 150)'], 2000, { cwd: dir });
    await new Promise(resolve => setTimeout(() => { responsive = true; resolve(null); }, 10));
    assert.equal(responsive, true);
    assert.equal(await pending, dir);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('images publish atomically and reject broken or duplicate transfers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-images-'));
  try {
    const dest = path.join(dir, 'disk.qcow2');
    await receiveImage(Readable.from(['complete']), dest);
    await assert.rejects(receiveImage(Readable.from(['replacement']), dest));
    assert.equal(fs.readFileSync(dest, 'utf8'), 'complete');
    await assert.rejects(receiveImage(Readable.from([]), path.join(dir, 'empty.iso')));
    const broken = new Readable({ read() { this.push('partial'); this.destroy(new Error('connection lost')); } });
    await assert.rejects(receiveImage(broken, path.join(dir, 'broken.iso')));
    assert.deepEqual(fs.readdirSync(dir), ['disk.qcow2']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('image import follows relative redirects and bounds redirect loops', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/disk') return res.end('image');
    res.writeHead(302, { Location: req.url === '/start' ? '/disk' : '/loop' });
    res.end();
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const base = `http://127.0.0.1:${addr.port}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-import-'));
  try {
    await downloadImage(`${base}/start`, path.join(dir, 'disk.iso'));
    assert.equal(fs.readFileSync(path.join(dir, 'disk.iso'), 'utf8'), 'image');
    await assert.rejects(downloadImage(`${base}/loop`, path.join(dir, 'loop.iso')), /redirect limit/);
    assert.deepEqual(fs.readdirSync(dir), ['disk.iso']);
  } finally { server.closeAllConnections(); server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('detected disks and partitions remain unassigned, regardless of mount status', async () => {
  const { discoveryOnly, STORAGE_POLICY } = await import('../server/storagePolicy.ts');
  const devices = discoveryOnly([{ path: '/dev/sda', children: [{ path: '/dev/sda1', mountpoints: ['/lightnas'] }] }]);
  assert.equal(devices[0].provisioningAllowed, false);
  assert.equal(devices[0].ownership, 'unknown');
  assert.equal(devices[0].children[0].assignment, 'unassigned');
  assert.equal(STORAGE_POLICY.rawDeviceProvisioning, false);
  assert.equal(STORAGE_POLICY.poolCreation, false);
});

test('Nova disk guards reject external files, raw devices and symlinks', async () => {
  const { assertManagedDisk } = await import('../server/storagePolicy.ts');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-storage-'));
  const id = '00000000-0000-0000-0000-000000000000';
  const disk = path.join(dir, `${id}.qcow2`);
  try {
    assert.equal(assertManagedDisk(dir, disk, true), disk);
    assert.throws(() => assertManagedDisk(dir, '/dev/sda', true));
    assert.throws(() => assertManagedDisk(dir, path.join(dir, '../outside.qcow2'), true));
    fs.writeFileSync(disk, 'nova');
    assert.equal(assertManagedDisk(dir, disk), disk);
    fs.unlinkSync(disk);
    fs.symlinkSync('/dev/null', disk);
    assert.throws(() => assertManagedDisk(dir, disk), /symbolic link/);
    fs.unlinkSync(disk);
    fs.mkdirSync(disk);
    assert.throws(() => assertManagedDisk(dir, disk), /regular file/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('VM power actions negotiate QMP and await the real monitor acknowledgement', async () => {
  const net = await import('node:net');
  const { qmpCommand } = await import('../server/qmp.ts');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'nova-qmp-'));
  const socketPath = path.join(dir,'qmp.sock'), received: string[] = [];
  const server = net.createServer(socket => {
    socket.write(JSON.stringify({ QMP:{ version:{} } })+'\n');
    socket.on('data',chunk => { for (const line of chunk.toString().trim().split('\n')) { const message = JSON.parse(line); received.push(message.execute); socket.write(JSON.stringify({ return:{},id:message.id })+'\n'); } });
  });
  server.listen(0,'127.0.0.1'); await onceEvent(server,'listening');
  try { await qmpCommand({ host:'127.0.0.1',port:(server.address() as any).port },'system_powerdown'); assert.deepEqual(received,['qmp_capabilities','system_powerdown']); }
  finally { server.close(); fs.rmSync(dir,{ recursive:true,force:true }); }
});

test('job and inventory responses redact credentials and deployment environment values', async () => {
  const { redact } = await import('../server/redact.ts');
  const data = redact({ createdAt:new Date('2026-10-28T12:00:00Z'), input:{ envVars:'API_KEY=private',repoUrl:'https://secret@example.test/app.git?token=secret',name:'App' },output:{ env:{ DATABASE_PASSWORD:'private' },status:'Running' } });
  assert.equal(data.createdAt,'2026-10-28T12:00:00.000Z'); assert.equal(data.input.envVars,'[redacted]'); assert.equal(data.output.env,'[redacted]'); assert.equal(data.input.name,'App'); assert.ok(!JSON.stringify(data).includes('private')); assert.ok(!data.input.repoUrl.includes('secret'));
});
