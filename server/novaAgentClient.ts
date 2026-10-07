import http from 'http';
import https from 'https';

const baseUrl = String(process.env.NOVA_AGENT_URL || 'http://127.0.0.1:9443').replace(/\/$/, '');
const token = String(process.env.NOVA_AGENT_TOKEN || '');

export function novaAgentConfigured() {
  return Boolean(baseUrl && token);
}

export async function novaAgentRequest(pathname: string, method = 'GET', body?: unknown): Promise<any> {
  if (!novaAgentConfigured()) throw new Error('Nova Agent is not configured');
  const target = new URL(pathname, baseUrl + '/');
  const transport = target.protocol === 'https:' ? https : http;
  const payload = body === undefined ? '' : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = transport.request(target, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
      rejectUnauthorized: process.env.NOVA_AGENT_VERIFY_TLS !== 'false',
    } as any, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let decoded: any = null;
        if (responseBody.trim()) {
          try { decoded = JSON.parse(responseBody); } catch { decoded = { raw: responseBody }; }
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(decoded?.error || `Nova Agent returned HTTP ${response.statusCode || 0}`));
          return;
        }
        resolve(decoded);
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error('Nova Agent request timed out')));
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}


export async function novaAgentUpload(filename: string, source: NodeJS.ReadableStream, contentLength?: number): Promise<any> {
  if (!novaAgentConfigured()) throw new Error('Nova Agent is not configured');
  if (!/^[A-Za-z0-9._-]{1,160}$/.test(filename)) throw new Error('Invalid image filename');
  const target = new URL(`/v1/images/upload?filename=${encodeURIComponent(filename)}`, baseUrl + '/');
  const transport = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(target, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/octet-stream',
        ...(contentLength && Number.isFinite(contentLength) ? { 'Content-Length': String(contentLength) } : {}),
      },
      rejectUnauthorized: process.env.NOVA_AGENT_VERIFY_TLS !== 'false',
    } as any, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let decoded: any = null;
        if (responseBody.trim()) {
          try { decoded = JSON.parse(responseBody); } catch { decoded = { raw: responseBody }; }
        }
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(decoded?.error || `Nova Agent returned HTTP ${response.statusCode || 0}`));
          return;
        }
        resolve(decoded);
      });
    });
    request.setTimeout(0);
    request.on('error', reject);
    source.on('error', reject);
    source.pipe(request);
  });
}
