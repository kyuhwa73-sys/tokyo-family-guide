import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = 4317;
const PUBLIC_URL = 'https://kyuhwa73-sys.github.io/tokyo-family-guide/';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const COMPRESSIBLE_EXTS = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg']);

function getLanIPv4List() {
  const result = [];
  const interfaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254.')) {
        result.push({ name, address: addr.address });
      }
    }
  }
  return result;
}

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let decodedPath = decodeURIComponent(parsedUrl.pathname);
    if (decodedPath === '/' || decodedPath === '') {
      decodedPath = '/index.html';
    }

    const safePath = path.normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(DIST_DIR, safePath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const useGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip');

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' || ext === '.js' && decodedPath === '/sw.js' ? 'no-cache' : 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    };

    if (useGzip) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
    } else {
      headers['Content-Length'] = stat.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const lanIps = getLanIPv4List();
  console.log('========================================================');
  console.log('Tokyo Family Guide Server (Local Backup + Gzip Ready)');
  console.log(`- 24시간 영구 접속 주소 : ${PUBLIC_URL}`);
  console.log(`- PC 로컬 접속 주소     : http://127.0.0.1:${PORT}`);
  if (lanIps.length > 0) {
    for (const item of lanIps) {
      console.log(`- 집 Wi-Fi 접속 (${item.name}) : http://${item.address}:${PORT}`);
    }
  } else {
    console.log('- 집 Wi-Fi LAN IP를 찾지 못했습니다.');
  }
  console.log('========================================================');
});
