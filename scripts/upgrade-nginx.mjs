import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function upgradeNginxConfig(text) {
  if (!text.includes('proxy_pass http://127.0.0.1:3000;')) throw new Error('Unrecognized Nova Nginx configuration; refusing to replace it');
  for (const directive of ['client_max_body_size', 'proxy_read_timeout', 'proxy_send_timeout', 'proxy_request_buffering', 'proxy_buffering']) {
    text = text.replace(new RegExp(`^\\s*${directive}\\s+[^;]+;`, 'gm'), '');
  }
  text = text.replace(/server\s*\{/, `server {
    client_max_body_size 0;
    proxy_read_timeout 900s;
    proxy_send_timeout 900s;
    proxy_request_buffering off;
    proxy_buffering off;`);
  text = text.replace(/^\s*proxy_set_header (Upgrade|Connection)\s+[^;]+;/gm, '');
  return text.replace('proxy_http_version 1.1;', 'proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  fs.writeFileSync(file, upgradeNginxConfig(fs.readFileSync(file, 'utf8')));
}
