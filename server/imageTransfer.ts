import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';

// Publish complete images atomically. A broken upload/download never becomes a boot image.
export async function receiveImage(source: Readable, destination: string) {
  const temp = `${destination}.${crypto.randomUUID()}.part`;
  try {
    await pipeline(source, fs.createWriteStream(temp, { mode: 0o600, flags: 'wx' }));
    const size = fs.statSync(temp).size;
    if (!size) throw new Error('Image is empty');
    // link is exclusive: a concurrent transfer cannot overwrite an existing image.
    fs.linkSync(temp, destination);
    return size;
  } finally {
    fs.rmSync(temp, { force: true });
  }
}

export async function downloadImage(urlText: string, destination: string, redirects = 0): Promise<void> {
  const url = new URL(urlText);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP/HTTPS image URLs are allowed');
  if (redirects > 5) throw new Error('Image download exceeded the redirect limit');
  const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.get(url, { timeout: 30000 }, resolve);
    request.on('error', reject);
    request.on('timeout', () => request.destroy(new Error('Image download timed out')));
  });
  if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    response.resume();
    return downloadImage(new URL(response.headers.location, url).toString(), destination, redirects + 1);
  }
  if (response.statusCode !== 200) {
    response.resume();
    throw new Error(`Image download returned HTTP ${response.statusCode || 0}`);
  }
  await receiveImage(response, destination);
}
