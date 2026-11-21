const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3300;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let rawUrl = req.url.split('?')[0].split('#')[0];
  let reqUrl = rawUrl.replace(/\/+/g, '/') || '/';
  let clean = reqUrl.replace(/\/+$/, '') || '/';

  // 1. Core route rewrites (matching vercel.json)
  if (clean === '/' || clean === '/home' || clean === '/work' || clean === '/works' || clean === '/my-story' || clean === '/about' || clean === '/contact') {
    return serveFile(path.join(DIR, 'frontend', 'index.html'), res);
  }

  if (clean === '/shop' || clean === '/store') {
    return serveFile(path.join(DIR, 'frontend', 'shop.html'), res);
  }

  if (clean === '/admin' || clean === '/admin-portal' || clean === '/admin-portal.html' || clean === '/super-admin-orbit.html') {
    return serveFile(path.join(DIR, 'super-admin-orbit.html'), res);
  }

  // Skill pages
  const skillMatch = clean.match(/^\/(?:frontend\/)?(web-developer|app-developer|ui-ux-designer|graphic-designer|photographer|ability-card|legal)(?:\/(.*))?$/);
  if (skillMatch) {
    const skill = skillMatch[1];
    const sub = skillMatch[2];
    if (!sub || sub === 'index.html') {
      return serveFile(path.join(DIR, 'frontend', skill, 'index.html'), res);
    } else {
      return serveFile(path.join(DIR, 'frontend', skill, sub), res);
    }
  }

  // 2. Direct files or frontend files
  let filePath = path.join(DIR, reqUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  let frontPath = path.join(DIR, 'frontend', reqUrl);
  if (fs.existsSync(frontPath) && fs.statSync(frontPath).isFile()) {
    return serveFile(frontPath, res);
  }

  if (fs.existsSync(frontPath + '.html')) {
    return serveFile(frontPath + '.html', res);
  }

  if (fs.existsSync(filePath + '.html')) {
    return serveFile(filePath + '.html', res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found: ' + reqUrl);
});

function serveFile(fp, res) {
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 File Not Found');
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(fp).pipe(res);
}

server.listen(PORT, () => {
  console.log(`LOCAL PREVIEW SERVER RUNNING AT: http://localhost:${PORT}/`);
});
