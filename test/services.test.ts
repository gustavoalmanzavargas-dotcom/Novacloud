import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { upgradeNginxConfig } from '../scripts/upgrade-nginx.mjs';

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = (server.address() as net.AddressInfo).port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}
async function start(file: string, env: Record<string, string>, ready: string) {
  const processHandle = spawn(process.execPath, [file], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  processHandle.stdout.on('data', data => { log += data; });
  processHandle.stderr.on('data', data => { log += data; });
  for (let i = 0; i < 100; i++) {
    if (log.includes(ready)) return processHandle;
    if (processHandle.exitCode !== null) throw new Error(log);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  processHandle.kill();
  throw new Error(`Service startup timed out: ${log}`);
}
async function stop(child: ReturnType<typeof spawn>) {
  if (child.exitCode !== null) return;
  const done = once(child, 'exit'); child.kill(); await done;
}

test('agent API authenticates, validates resources and transfers real image bytes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-agent-test-'));
  const port = await freePort();
  const child = await start('dist/nova-agent.cjs', {
    NOVA_AGENT_PORT: String(port), NOVA_AGENT_TOKEN: 'test-secret', NOVA_AGENT_BRIDGE: 'user',
    NOVA_AGENT_STATE_DIR: path.join(dir, 'state'), NOVA_AGENT_RUN_DIR: path.join(dir, 'run'),
  }, 'Nova Agent listening');
  const base = `http://127.0.0.1:${port}`;
  const headers = { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(`${base}/v1/host`)).status, 401);
    assert.equal((await fetch(`${base}/v1/health`, { headers })).status, 200);
    const deviceResponse = await fetch(`${base}/v1/storage/devices`, { headers });
    const deviceText = await deviceResponse.text();
    assert.equal(deviceResponse.status, 200, deviceText);
    const discovered = JSON.parse(deviceText);
    assert.equal(discovered.policy.rawDeviceProvisioning, false);
    assert.equal(discovered.managedStorage.kind, 'directory');
    const rawRequest = await fetch(`${base}/v1/volumes`, { method: 'POST', headers, body: JSON.stringify({ name: 'unsafe', sizeGb: 10, device: '/dev/sda' }) });
    assert.equal(rawRequest.status, 400);
    const volumeId = '00000000-0000-0000-0000-000000000000';
    const foreignFile = path.join(dir, 'lightnas-data');
    fs.writeFileSync(foreignFile, 'preserve');
    fs.writeFileSync(path.join(dir, `state/volumes/${volumeId}.json`), JSON.stringify({ id: volumeId, path: foreignFile, sizeGb: 10 }));
    assert.equal((await fetch(`${base}/v1/volumes/${volumeId}`, { method: 'DELETE', headers })).status, 500);
    assert.equal(fs.readFileSync(foreignFile, 'utf8'), 'preserve');

    const invalid = await fetch(`${base}/v1/instances`, { method: 'POST', headers, body: JSON.stringify({ name: 'test', vcpu: 1, memoryMb: 'not-a-number', diskGb: 20 }) });
    assert.equal(invalid.status, 400);
    assert.deepEqual(fs.readdirSync(path.join(dir, 'state/instances')), []);
    const upload = await fetch(`${base}/v1/images/upload?filename=boot.iso`, { method: 'POST', headers: { Authorization: headers.Authorization, 'Content-Type': 'application/octet-stream' }, body: 'actual-image-bytes' });
    assert.equal(upload.status, 201);
    assert.equal(fs.readFileSync(path.join(dir, 'state/images/boot.iso'), 'utf8'), 'actual-image-bytes');
    const list = await (await fetch(`${base}/v1/images`, { headers })).json();
    assert.equal(list[0].sizeBytes, 18);
    assert.equal((await fetch(`${base}/v1/containers`, { method: 'POST', headers, body: JSON.stringify({ name: 'test' }) })).status, 409);
    assert.deepEqual(await (await fetch(`${base}/v1/containers`, { headers })).json(), []);
    assert.equal((await fetch(`${base}/v1/health`, { headers })).status, 200);
  } finally { await stop(child); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('controller returns JSON errors and survives database failures', async () => {
  const port = await freePort();
  const child = await start('dist/server.cjs', {
    PORT: String(port), NODE_ENV: 'production', DATABASE_URL: 'postgresql://invalid:invalid@127.0.0.1:1/invalid',
    SESSION_SECRET: 'test-session-secret', COOKIE_SECURE: 'false', NOVA_AGENT_TOKEN: '',
  }, 'Cyverax Nova listening');
  const base = `http://127.0.0.1:${port}`;
  try {
    assert.equal((await fetch(`${base}/api/auth/me`)).status, 401);
    assert.equal((await fetch(`${base}/api/health`)).status, 503);
    const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.com', password: 'test' }) });
    assert.equal(response.status, 500);
    assert.equal((await response.json()).error, 'Nova request failed');
    const missing = await fetch(`${base}/api/not-a-route`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, 'Unknown Nova API endpoint');
    assert.equal((await fetch(base)).status, 200);
    assert.equal((await fetch(`${base}/api/health`)).status, 503);
  } finally { await stop(child); }
});

test('Nginx update preserves hostname and TLS while fixing console and transfer settings', () => {
  const original = 'server {\nlisten 443 ssl;\nserver_name nova.example.com;\nssl_certificate /existing/cert;\nclient_max_body_size 10m;\nlocation / {\nproxy_pass http://127.0.0.1:3000;\nproxy_http_version 1.1;\n}\n}';
  const updated = upgradeNginxConfig(original);
  assert.match(updated, /server_name nova.example.com/);
  assert.match(updated, /ssl_certificate \/existing\/cert/);
  assert.match(updated, /proxy_set_header Upgrade \$http_upgrade/);
  assert.match(updated, /client_max_body_size 0/);
  assert.match(updated, /proxy_read_timeout 900s/);
  assert.equal((upgradeNginxConfig(updated).match(/proxy_set_header Upgrade/g) || []).length, 1);
  assert.throws(() => upgradeNginxConfig('server { listen 80; }'));
});

test('console proxy authenticates upstream and forwards upgraded traffic both ways', { timeout: 5000 }, async () => {
  const http = await import('node:http');
  const { proxyWebSocket } = await import('../server/websocketProxy.ts');
  let authorization: string | undefined;
  const sockets = new Set<any>();
  const upstream = http.createServer();
  upstream.on('upgrade', (req, socket) => {
    authorization = req.headers.authorization;
    sockets.add(socket);
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n');
    socket.on('data', chunk => socket.write(chunk));
  });
  upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
  const upstreamPort = (upstream.address() as net.AddressInfo).port;
  const gateway = http.createServer();
  gateway.on('upgrade', (req, socket, head) => {
    sockets.add(socket);
    proxyWebSocket(req, socket, head, new URL(`http://127.0.0.1:${upstreamPort}/console`), { authorization: 'Bearer agent-test' });
  });
  gateway.listen(0, '127.0.0.1'); await once(gateway, 'listening');
  const gatewayPort = (gateway.address() as net.AddressInfo).port;
  try {
    const request = http.request(`http://127.0.0.1:${gatewayPort}/console`, { headers: { Connection: 'Upgrade', Upgrade: 'websocket' } });
    const upgraded = once(request, 'upgrade'); request.end();
    const [, socket] = await upgraded;
    sockets.add(socket);
    assert.equal(authorization, 'Bearer agent-test');
    const received = once(socket, 'data');
    socket.write('console-bytes');
    assert.equal((await received)[0].toString(), 'console-bytes');
  } finally {
    for (const socket of sockets) socket.destroy();
    upstream.close(); gateway.close();
  }
});
