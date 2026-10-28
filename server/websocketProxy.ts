import http from 'node:http';
import https from 'node:https';
import type { Duplex } from 'node:stream';

// Forward the upgrade over the authenticated agent connection, including TLS.
export function proxyWebSocket(req: http.IncomingMessage, socket: Duplex, head: Buffer, target: URL, extraHeaders: Record<string, string> = {}) {
  const transport = target.protocol === 'https:' ? https : http;
  const upstreamRequest = transport.request(target, {
    headers: { ...req.headers, host: target.host, ...extraHeaders },
    timeout: 10000,
  });
  upstreamRequest.on('upgrade', (response, upstream, upstreamHead) => {
    upstreamRequest.setTimeout(0);
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(response.headers).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}\r\n`).join('')}\r\n`);
    if (upstreamHead.length) socket.write(upstreamHead);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
    upstream.on('error', () => socket.destroy());
    upstream.on('close', () => socket.destroy());
    socket.on('close', () => upstream.destroy());
    socket.on('error', () => upstream.destroy());
  });
  upstreamRequest.on('response', response => { response.resume(); socket.destroy(); });
  upstreamRequest.on('error', () => socket.destroy());
  upstreamRequest.on('timeout', () => upstreamRequest.destroy());
  socket.on('error', () => upstreamRequest.destroy());
  socket.on('close', () => upstreamRequest.destroy());
  upstreamRequest.end();
}
