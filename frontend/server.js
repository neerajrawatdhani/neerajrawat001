const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const BACKEND_PORT = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT, 10) : 5000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Proxy request to backend on port 5000
function proxyToBackend(req, res) {
  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${BACKEND_PORT}` }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`[Frontend Proxy Error] Could not connect to backend at :${BACKEND_PORT} -`, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Backend service unreachable on port " + BACKEND_PORT }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  // Check if it's an API request meant for the backend
  if (req.url.startsWith('/api/') || req.url === '/api') {
    return proxyToBackend(req, res);
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Clean SPA section routes: /home, /work, /my-story, /contact -> serve index.html directly
  const cleanNorm = reqPath.replace(/\/index\.html$/, '').replace(/\/$/, '').toLowerCase();
  const cleanRoutes = ['/home', '/work', '/works', '/my-story', '/about', '/contact', ''];
  if (cleanRoutes.includes(cleanNorm)) {
    const indexPath = path.join(ROOT, 'index.html');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }

  let filePath = path.join(ROOT, reqPath);

  // If path is a directory without trailing slash, redirect with trailing slash
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    res.writeHead(301, { Location: reqPath + '/' });
    res.end();
    return;
  }

  // If file doesn't exist, try adding /index.html
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '/index.html')) {
    res.writeHead(301, { Location: reqPath + '/' });
    res.end();
    return;
  }

  // Any non-file path fallback to index.html
  if (!fs.existsSync(filePath) && path.extname(reqPath) === '' && !reqPath.startsWith('/api')) {
    filePath = path.join(ROOT, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  // Video range requests
  if (range && ext === '.mp4') {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
