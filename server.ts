import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import path from 'path';
import os from 'os';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { novaAgentConfigured, novaAgentRequest } from './server/novaAgentClient';

dotenv.config();

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  throw new Error('DATABASE_URL and SESSION_SECRET must be set');
}

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgStore = connectPgSimple(session);
const app = express();
const port = Number(process.env.PORT || 3000);

const novaAgentUrl = String(process.env.NOVA_AGENT_URL || 'http://127.0.0.1:9443');
let novaSyncInFlight: Promise<void> | null = null;
const eventClients = new Set<Response>();

function publishNovaEvent(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of eventClients) {
    try {
      client.write(payload);
    } catch {
      eventClients.delete(client);
    }
  }
}

async function syncNovaAgentInventory() {
  if (!novaAgentConfigured()) return;
  if (novaSyncInFlight) return novaSyncInFlight;
  novaSyncInFlight = (async () => {
  const [host, instances, images, networks, volumes] = await Promise.all([
    novaAgentRequest('/v1/host'),
    novaAgentRequest('/v1/instances'),
    novaAgentRequest('/v1/images'),
    novaAgentRequest('/v1/networks'),
    novaAgentRequest('/v1/volumes'),
  ]);

  const hostResult = await pool.query(
    `INSERT INTO nova_hosts (agent_id, name, endpoint, status, capabilities, telemetry, last_seen_at)
     VALUES ($1, $2, $3, 'online', $4, $5, NOW())
     ON CONFLICT (agent_id)
     DO UPDATE SET name = EXCLUDED.name, endpoint = EXCLUDED.endpoint, status = 'online',
                   capabilities = EXCLUDED.capabilities, telemetry = EXCLUDED.telemetry,
                   last_seen_at = NOW(), updated_at = NOW()
     RETURNING id`,
    [host.id, host.hostname, novaAgentUrl, host.capabilities || {}, host],
  );
  const hostId = hostResult.rows[0]?.id;

  const instanceIds: string[] = [];
  for (const item of Array.isArray(instances) ? instances : []) {
    instanceIds.push(item.id);
    const memoryGb = Number((Number(item.memoryMb || 0) / 1024).toFixed(2));
    const data = {
      id: item.id,
      name: item.name,
      status: item.status,
      os: 'Nova VM',
      vcpu: Number(item.vcpu || 0),
      memoryGb,
      storageGb: Number(item.diskGb || 0),
      privateIp: '—',
      publicIp: '—',
      region: 'local',
      environment: 'Production',
      vpc: item.bridge || 'novabr0',
      subnet: 'Nova managed',
      securityPolicy: 'Nova host policy',
      hostname: item.name,
      created: item.createdAt,
      uptime: item.status === 'Running' ? 'Running' : '0h',
      cpuUsagePct: 0,
      memUsagePct: 0,
      diskIops: 0,
      networkInMb: 0,
      networkOutMb: 0,
      tags: {
        provider: 'nova-native',
        hostId: String(hostId || ''),
        agentId: String(host.id || ''),
      },
      attachedDisks: [{ name: 'root', sizeGb: Number(item.diskGb || 0), type: 'qcow2', mount: '/' }],
      snapshots: [],
    };
    await pool.query(
      `INSERT INTO resources (type, provider, external_id, data)
       VALUES ('vm', 'nova-native', $1, $2)
       ON CONFLICT (provider, external_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [item.id, data],
    );
  }

  if (instanceIds.length > 0) {
    await pool.query(
      `DELETE FROM resources
       WHERE provider = 'nova-native' AND type = 'vm'
         AND NOT (external_id = ANY($1::text[]))`,
      [instanceIds],
    );
  } else {
    await pool.query(`DELETE FROM resources WHERE provider = 'nova-native' AND type = 'vm'`);
  }

  for (const image of Array.isArray(images) ? images : []) {
    await pool.query(
      `INSERT INTO resources (type, provider, external_id, data)
       VALUES ('image', 'nova-native', $1, $2)
       ON CONFLICT (provider, external_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [image.id, image],
    );
  }

  const networkIds: string[] = [];
  for (const network of Array.isArray(networks) ? networks : []) {
    networkIds.push(network.id);
    await pool.query(
      `INSERT INTO resources (type, provider, external_id, data)
       VALUES ('network', 'nova-native', $1, $2)
       ON CONFLICT (provider, external_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [network.id, network],
    );
  }
  if (networkIds.length) {
    await pool.query(
      `DELETE FROM resources WHERE provider = 'nova-native' AND type = 'network'
       AND NOT (external_id = ANY($1::text[]))`,
      [networkIds],
    );
  } else {
    await pool.query(`DELETE FROM resources WHERE provider = 'nova-native' AND type = 'network'`);
  }

  const volumeIds: string[] = [];
  for (const volume of Array.isArray(volumes) ? volumes : []) {
    volumeIds.push(volume.id);
    await pool.query(
      `INSERT INTO resources (type, provider, external_id, data)
       VALUES ('storage', 'nova-native', $1, $2)
       ON CONFLICT (provider, external_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [volume.id, {
        ...volume,
        type: 'Block Volume',
        capacityGb: Number(volume.sizeGb || 0),
        usedGb: 0,
        region: 'local',
      }],
    );
  }
  if (volumeIds.length) {
    await pool.query(
      `DELETE FROM resources WHERE provider = 'nova-native' AND type = 'storage'
       AND NOT (external_id = ANY($1::text[]))`,
      [volumeIds],
    );
  } else {
    await pool.query(`DELETE FROM resources WHERE provider = 'nova-native' AND type = 'storage'`);
  }

  publishNovaEvent('resource-sync', {
    hostId: host.id,
    instances: instanceIds.length,
    images: Array.isArray(images) ? images.length : 0,
    networks: networkIds.length,
    volumes: volumeIds.length,
    timestamp: new Date().toISOString(),
  });
  })().finally(() => {
    novaSyncInFlight = null;
  });
  return novaSyncInFlight;
}

async function createJob(kind: string, userId: string | undefined, resourceType: string | null, resourceId: string | null, input: any) {
  const result = await pool.query(
    `INSERT INTO jobs (kind, resource_type, resource_id, requested_by, status, input)
     VALUES ($1, $2, $3, $4, 'running', $5)
     RETURNING id`,
    [kind, resourceType, resourceId, userId || null, input || {}],
  );
  return result.rows[0].id as string;
}

async function finishJob(id: string, status: 'succeeded' | 'failed', output: any, error?: string) {
  await pool.query(
    `UPDATE jobs
     SET status = $2, output = $3, error = $4, finished_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [id, status, output || {}, error || null],
  );
  publishNovaEvent('job-update', { id, status, output: output || {}, error: error || null });
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  name: 'nova.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE !== 'false',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected', version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'unavailable' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const result = await pool.query(
    'SELECT id, email, display_name, password_hash, role FROM users WHERE email = $1 AND active = TRUE',
    [email],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.userId = user.id;
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('nova.sid');
    res.status(204).end();
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  const result = await pool.query(
    'SELECT id, email, display_name, role FROM users WHERE id = $1 AND active = TRUE',
    [req.session.userId],
  );
  if (!result.rows[0]) return res.status(401).json({ error: 'Authentication required' });
  const user = result.rows[0];
  res.json({ user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role } });
});

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });
  next();
}

app.get('/api/events', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  eventClients.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat ${Date.now()}\n\n`); } catch {}
  }, 15000);
  req.on('close', () => {
    clearInterval(heartbeat);
    eventClients.delete(res);
  });
});

app.get('/api/jobs', requireAuth, async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
  const result = await pool.query(
    `SELECT j.id, j.kind, j.resource_type AS "resourceType", j.resource_id AS "resourceId",
            j.status, j.input, j.output, j.error, j.created_at AS "createdAt",
            j.started_at AS "startedAt", j.finished_at AS "finishedAt",
            u.email AS "requestedBy"
       FROM jobs j
       LEFT JOIN users u ON u.id = j.requested_by
       ORDER BY j.created_at DESC
       LIMIT $1`,
    [limit],
  );
  res.json(result.rows);
});

app.get('/api/hosts', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, agent_id AS "agentId", name, endpoint, status, capabilities, telemetry,
            last_seen_at AS "lastSeenAt", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM nova_hosts ORDER BY name ASC`,
  );
  res.json(result.rows);
});

app.get('/api/nova/host', requireAuth, async (_req, res) => {
  try {
    const host = await novaAgentRequest('/v1/host');
    await syncNovaAgentInventory();
    res.json({ configured: true, connected: true, host });
  } catch (error) {
    res.status(502).json({
      configured: novaAgentConfigured(),
      connected: false,
      error: error instanceof Error ? error.message : 'Nova Agent unavailable',
    });
  }
});

app.post('/api/nova/sync', requireAuth, async (_req, res) => {
  try {
    await syncNovaAgentInventory();
    res.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Nova Agent sync failed' });
  }
});

app.get('/api/compute/options', requireAuth, async (_req, res) => {
  try {
    const host = await novaAgentRequest('/v1/host');
    const images = await novaAgentRequest('/v1/images');
    res.json({
      configured: true,
      hosts: [{ id: host.id, name: host.hostname }],
      nodes: [host.hostname],
      storages: [{ node: host.hostname, storage: 'nova-local', type: 'qcow2' }],
      bridges: [host.capabilities?.bridge || 'novabr0'],
      images,
    });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to read Nova host options' });
  }
});

app.post('/api/compute/vms', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const cores = Number(req.body?.cores || req.body?.vcpu || 2);
  const memoryMb = Number(req.body?.memoryMb || 4096);
  const diskGb = Number(req.body?.diskGb || 32);
  const bridge = String(req.body?.bridge || 'novabr0');
  const imageId = String(req.body?.imageId || req.body?.iso || '');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$/.test(name)) return res.status(400).json({ error: 'A valid VM name is required' });

  const jobId = await createJob('compute.create', req.session.userId, 'vm', null, { name, cores, memoryMb, diskGb, bridge, imageId });
  try {
    const vm = await novaAgentRequest('/v1/instances', 'POST', {
      name,
      vcpu: cores,
      memoryMb,
      diskGb,
      bridge,
      imageId: imageId || undefined,
      start: true,
    });
    await finishJob(jobId, 'succeeded', vm);
    await syncNovaAgentInventory();
    await pool.query(
      `INSERT INTO activity_events (actor, action, resource, status)
       VALUES ($1, 'compute.create', $2, 'SUCCESS')`,
      [String(req.session.userId || 'user'), vm.id],
    );
    res.status(201).json({ success: true, jobId, ...vm });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'VM creation failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.get('/api/compute/images', requireAuth, async (_req, res) => {
  try {
    const images = await novaAgentRequest('/v1/images');
    res.json((Array.isArray(images) ? images : []).map((image: any) => ({
      id: image.id,
      name: image.name,
      distribution: image.format === 'iso' ? 'ISO Image' : 'Disk Image',
      version: '—',
      arch: 'x86_64',
      size: `${(Number(image.sizeBytes || 0) / 1024 ** 3).toFixed(2)} GB`,
      type: 'Custom AMI',
      status: 'Ready',
    })));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to read Nova images' });
  }
});

app.post('/api/compute/images/import-url', requireAuth, async (req, res) => {
  const url = String(req.body?.url || '').trim();
  const filename = String(req.body?.filename || '').trim();
  const jobId = await createJob('image.import', req.session.userId, 'image', filename || null, { url, filename });
  try {
    const image = await novaAgentRequest('/v1/images/import-url', 'POST', { url, filename });
    await finishJob(jobId, 'succeeded', image);
    await syncNovaAgentInventory();
    res.status(201).json({ success: true, jobId, ...image });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image import failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.get('/api/compute/snapshots', requireAuth, async (_req, res) => {
  try {
    const instances = await novaAgentRequest('/v1/instances');
    const all: any[] = [];
    for (const vm of Array.isArray(instances) ? instances : []) {
      try {
        const snapshots = await novaAgentRequest(`/v1/instances/${encodeURIComponent(vm.id)}/snapshots`);
        all.push(...(Array.isArray(snapshots) ? snapshots : []));
      } catch {}
    }
    res.json(all);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to list snapshots' });
  }
});

app.post('/api/compute/vms/:id/snapshots', requireAuth, async (req, res) => {
  const id = String(req.params.id || '');
  const name = String(req.body?.name || '').trim();
  const jobId = await createJob('snapshot.create', req.session.userId, 'vm', id, { name });
  try {
    const result = await novaAgentRequest(`/v1/instances/${encodeURIComponent(id)}/snapshots`, 'POST', { name });
    await finishJob(jobId, 'succeeded', result);
    res.status(201).json({ success: true, jobId, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Snapshot creation failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.post('/api/compute/snapshots/rollback', requireAuth, async (req, res) => {
  const full = String(req.body?.id || '');
  const split = full.indexOf(':');
  if (split < 1) return res.status(400).json({ error: 'Invalid snapshot identifier' });
  const id = full.slice(0, split);
  const name = full.slice(split + 1);
  const jobId = await createJob('snapshot.rollback', req.session.userId, 'vm', id, { name });
  try {
    const result = await novaAgentRequest(
      `/v1/instances/${encodeURIComponent(id)}/snapshots/${encodeURIComponent(name)}/rollback`,
      'POST',
    );
    await finishJob(jobId, 'succeeded', result);
    res.json({ success: true, jobId, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Snapshot rollback failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.post('/api/compute/vms/:id/action', requireAuth, async (req, res) => {
  const id = String(req.params.id || '');
  const action = String(req.body?.action || '');
  if (!['start', 'stop', 'shutdown', 'reboot', 'delete'].includes(action)) return res.status(400).json({ error: 'Unsupported VM action' });
  const jobId = await createJob(`compute.${action}`, req.session.userId, 'vm', id, { action });
  try {
    let result: any = {};
    if (action === 'delete') {
      await novaAgentRequest(`/v1/instances/${encodeURIComponent(id)}`, 'DELETE');
    } else {
      result = await novaAgentRequest(`/v1/instances/${encodeURIComponent(id)}/action`, 'POST', { action });
    }
    await finishJob(jobId, 'succeeded', result);
    await syncNovaAgentInventory();
    await pool.query(
      `INSERT INTO activity_events (actor, action, resource, status)
       VALUES ($1, $2, $3, 'SUCCESS')`,
      [String(req.session.userId || 'user'), `compute.${action}`, id],
    );
    res.json({ success: true, jobId, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : `VM ${action} failed`;
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.get('/api/networking/vpcs', requireAuth, async (_req, res) => {
  try {
    res.json(await novaAgentRequest('/v1/networks'));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to load Nova networks' });
  }
});

app.post('/api/networking/vpcs', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const cidr = String(req.body?.cidr || '').trim();
  const nat = req.body?.nat !== false;
  const jobId = await createJob('network.create', req.session.userId, 'network', null, { name, cidr, nat });
  try {
    const network = await novaAgentRequest('/v1/networks', 'POST', { name, cidr, nat });
    await finishJob(jobId, 'succeeded', network);
    await syncNovaAgentInventory();
    res.status(201).json({ ...network, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network creation failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.delete('/api/networking/vpcs/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id || '');
  const jobId = await createJob('network.delete', req.session.userId, 'network', id, {});
  try {
    await novaAgentRequest(`/v1/networks/${encodeURIComponent(id)}`, 'DELETE');
    await finishJob(jobId, 'succeeded', {});
    await syncNovaAgentInventory();
    res.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network deletion failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.get('/api/storage/volumes', requireAuth, async (_req, res) => {
  try {
    res.json(await novaAgentRequest('/v1/volumes'));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unable to load Nova volumes' });
  }
});

app.post('/api/storage/volumes', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const sizeGb = Number(req.body?.sizeGb || 20);
  const jobId = await createJob('storage.volume.create', req.session.userId, 'storage', null, { name, sizeGb });
  try {
    const volume = await novaAgentRequest('/v1/volumes', 'POST', { name, sizeGb });
    await finishJob(jobId, 'succeeded', volume);
    await syncNovaAgentInventory();
    res.status(201).json({ ...volume, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Volume creation failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.patch('/api/storage/volumes/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id || '');
  const sizeGb = Number(req.body?.sizeGb);
  const jobId = await createJob('storage.volume.resize', req.session.userId, 'storage', id, { sizeGb });
  try {
    const volume = await novaAgentRequest(`/v1/volumes/${encodeURIComponent(id)}`, 'PATCH', { sizeGb });
    await finishJob(jobId, 'succeeded', volume);
    await syncNovaAgentInventory();
    res.json({ ...volume, jobId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Volume resize failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.delete('/api/storage/volumes/:id', requireAuth, async (req, res) => {
  const id = String(req.params.id || '');
  const jobId = await createJob('storage.volume.delete', req.session.userId, 'storage', id, {});
  try {
    await novaAgentRequest(`/v1/volumes/${encodeURIComponent(id)}`, 'DELETE');
    await finishJob(jobId, 'succeeded', {});
    await syncNovaAgentInventory();
    res.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Volume deletion failed';
    await finishJob(jobId, 'failed', {}, message);
    res.status(502).json({ error: message, jobId });
  }
});

app.get('/api/vlan/matrix', requireAuth, async (_req, res) => {
  res.json({ totalVlans: 0, vlanRange: 'Not configured', fabric: 'Nova native networking', matrix: [] });
});

app.post('/api/vlan/verify', requireAuth, async (_req, res) => {
  res.status(409).json({ error: 'Nova VLAN isolation testing is not enabled yet' });
});

app.get('/api/compute/ssh-keys', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, data, created_at FROM resources WHERE type = 'ssh-key' ORDER BY created_at DESC`
  );
  res.json(result.rows.map((row: any) => ({ id: row.id, ...row.data, created: row.data?.created || row.created_at })));
});

app.post('/api/compute/ssh-keys', requireAuth, async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const publicKey = String(req.body?.publicKey || '').trim();
  if (!name || !publicKey) return res.status(400).json({ error: 'Key name and public key are required' });
  if (!/^(ssh-ed25519|ssh-rsa)\s+[A-Za-z0-9+/=]+(?:\s+.*)?$/.test(publicKey)) return res.status(400).json({ error: 'Invalid OpenSSH public key' });
  const crypto = await import('crypto');
  const body = publicKey.split(/\s+/)[1];
  const fingerprint = `SHA256:${crypto.createHash('sha256').update(Buffer.from(body, 'base64')).digest('base64').replace(/=+$/, '')}`;
  const key = {
    name,
    publicKey,
    fingerprint,
    type: publicKey.startsWith('ssh-rsa') ? 'RSA-4096' : 'ED25519',
    created: new Date().toISOString(),
    lastUsed: 'Never',
  };
  const result = await pool.query(
    `INSERT INTO resources (type, provider, external_id, data) VALUES ('ssh-key', 'novacloud', $1, $2) RETURNING id`,
    [`ssh-key:${Date.now()}:${name}`, key],
  );
  res.status(201).json({ id: result.rows[0].id, ...key });
});

app.delete('/api/compute/ssh-keys/:id', requireAuth, async (req, res) => {
  const result = await pool.query(`DELETE FROM resources WHERE id = $1 AND type = 'ssh-key'`, [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'SSH key not found' });
  res.status(204).end();
});

app.get('/api/system/summary', requireAuth, async (_req, res) => {
  const rootFs = fs.statfsSync('/');
  const [resourceCount, userCount, activityCount] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM resources'),
    pool.query('SELECT COUNT(*)::int AS count FROM users WHERE active = TRUE'),
    pool.query('SELECT COUNT(*)::int AS count FROM activity_events'),
  ]);

  const totalMemoryBytes = os.totalmem();
  const freeMemoryBytes = os.freemem();
  const network = Object.entries(os.networkInterfaces())
    .flatMap(([name, addresses]) =>
      (addresses || [])
        .filter((address) => address.family === 'IPv4' && !address.internal)
        .map((address) => ({ name, address: address.address, cidr: address.cidr }))
    );

  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    cpuCount: os.cpus().length,
    loadAverage: os.loadavg(),
    uptimeSeconds: os.uptime(),
    memory: {
      totalBytes: totalMemoryBytes,
      usedBytes: totalMemoryBytes - freeMemoryBytes,
      freeBytes: freeMemoryBytes,
      usedPercent: totalMemoryBytes > 0
        ? Number((((totalMemoryBytes - freeMemoryBytes) / totalMemoryBytes) * 100).toFixed(1))
        : 0,
    },
    disk: {
      totalBytes: rootFs.blocks * rootFs.bsize,
      freeBytes: rootFs.bavail * rootFs.bsize,
      usedBytes: (rootFs.blocks - rootFs.bfree) * rootFs.bsize,
    },
    database: {
      resources: resourceCount.rows[0]?.count || 0,
      activeUsers: userCount.rows[0]?.count || 0,
      activityEvents: activityCount.rows[0]?.count || 0,
    },
    network,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/dashboard', requireAuth, async (_req, res) => {
  try { await syncNovaAgentInventory(); } catch (error) { console.error('Nova Agent sync failed', error); }
  const [resources, activity] = await Promise.all([
    pool.query('SELECT id, type, data FROM resources ORDER BY updated_at DESC'),
    pool.query(`SELECT id, action, resource, status, actor AS "user", source_ip AS ip,
                       created_at AS timestamp FROM activity_events ORDER BY created_at DESC LIMIT 20`),
  ]);
  const byType = (type: string) => resources.rows.filter((row) => row.type === type).map((row) => ({ id: row.id, ...row.data }));
  res.json({
    vms: byType('vm'),
    applications: byType('application'),
    databases: byType('database'),
    storage: byType('storage'),
    notifications: byType('notification'),
    securityAlerts: byType('security_alert'),
    aiRecommendations: byType('ai_recommendation'),
    activities: activity.rows,
  });
});

app.get('/api/activity', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, actor, action, resource, status, source_ip AS ip, created_at AS timestamp
       FROM activity_events ORDER BY created_at DESC LIMIT 250`
  );
  res.json(result.rows);
});

app.get('/api/iam/users', requireAuth, async (_req, res) => {
  const result = await pool.query(
    `SELECT id, email, display_name AS "displayName", role, active,
            created_at AS "createdAt", last_login_at AS "lastLoginAt"
       FROM users ORDER BY created_at ASC`
  );
  res.json(result.rows);
});

app.get('/api/resources', requireAuth, async (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : null;
  const result = type
    ? await pool.query('SELECT id, type, provider, external_id, data, created_at, updated_at FROM resources WHERE type = $1 ORDER BY updated_at DESC', [type])
    : await pool.query('SELECT id, type, provider, external_id, data, created_at, updated_at FROM resources ORDER BY updated_at DESC');
  res.json(result.rows);
});

app.post('/api/resources', requireAuth, async (req, res) => {
  const type = String(req.body?.type || '');
  const data = req.body?.data;
  if (!type || !data || typeof data !== 'object') {
    return res.status(400).json({ error: 'type and data are required' });
  }
  const result = await pool.query(
    'INSERT INTO resources (type, data) VALUES ($1, $2) RETURNING id, type, data, created_at, updated_at',
    [type, data],
  );
  res.status(201).json(result.rows[0]);
});

let aiClient: GoogleGenAI | null = null;
app.post('/api/ai/query', requireAuth, async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Nova AI is not configured on this installation' });
  }
  aiClient ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Nova AI, a cloud infrastructure assistant. Give precise, safe, actionable guidance. User request: ${prompt}`,
    });
    res.json({ source: 'gemini', response: response.text || 'No response returned', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Gemini request failed', error);
    res.status(502).json({ error: 'Nova AI request failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(port, '127.0.0.1', () => {
    console.log(`Cyverax Nova listening on http://127.0.0.1:${port}`);
    if (novaAgentConfigured()) {
      syncNovaAgentInventory().catch((error) => console.error('Initial Nova Agent sync failed', error));
      setInterval(() => {
        syncNovaAgentInventory().catch((error) => console.error('Nova Agent sync failed', error));
      }, 5000);
    }
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
