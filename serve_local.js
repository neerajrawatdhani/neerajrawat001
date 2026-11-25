const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3300;
const DIR = __dirname;
const FRONTEND_DIR = path.join(DIR, 'frontend');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
};

const API_ROUTES = {
  '/api/admin/login': './frontend/api/admin/login.js',
  '/api/admin/forgot-password': './frontend/api/admin/forgot-password.js',
  '/api/admin/leads': './frontend/api/admin/leads.js',
  '/api/admin/quotation': './frontend/api/admin/quotation.js',
  '/api/admin/settings': './frontend/api/admin/settings.js',
  '/api/admin/stats': './frontend/api/admin/stats.js',
  '/api/stats/visit': './frontend/api/stats/visit.js',
  '/api/products': './frontend/api/products.js',
  '/api/create-order': './frontend/api/create-order.js',
  '/api/verify-payment': './frontend/api/verify-payment.js',
  '/api/contact': './frontend/api/contact.js',
  '/api/inquiries': './frontend/api/admin/leads.js'
};

/**
 * Mount a Vercel-style Node serverless handler with parsed JSON body and Express-like res helpers.
 * @param {string} relPath
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function mountApi(relPath, req, res) {
  let bodyData = '';
  req.on('data', chunk => {
    if (bodyData.length < 10 * 1024 * 1024) bodyData += chunk;
  });
  req.on('end', async () => {
    if (bodyData) {
      try { req.body = JSON.parse(bodyData); } catch (e) { req.body = {}; }
    } else {
      req.body = {};
    }

    const qsIdx = req.url.indexOf('?');
    req.query = qsIdx >= 0 ? Object.fromEntries(new URLSearchParams(req.url.slice(qsIdx + 1))) : {};

    res.status = function(code) { res.statusCode = code; return res; };
    res.json = function(obj) {
      if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    };

    try {
      const handler = require(relPath);
      await handler(req, res);
    } catch (err) {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url.split('?')[0].split('#')[0];
  const reqUrl = rawUrl.replace(/\/+/g, '/') || '/';
  const clean = reqUrl.replace(/\/+$/, '') || '/';

  if (reqUrl.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (API_ROUTES[clean]) {
      return mountApi(API_ROUTES[clean], req, res);
    }

    if (clean.startsWith('/api/inquiries/')) {
      req.query = { id: clean.replace('/api/inquiries/', '').trim() };
      return mountApi('./frontend/api/admin/leads.js', req, res);
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: `Unknown API route: ${clean}` }));
  }

  if (clean === '/' || clean === '/home' || clean === '/work' || clean === '/works' || clean === '/my-story' || clean === '/about') {
    return serveFile(path.join(FRONTEND_DIR, 'index.html'), res);
  }

  if (clean === '/contact' || clean === '/contact.html') {
    return serveFile(path.join(FRONTEND_DIR, 'contact.html'), res);
  }

  if (clean === '/shop' || clean === '/store') {
    return serveFile(path.join(FRONTEND_DIR, 'shop.html'), res);
  }

  if (
    clean === '/admin' ||
    clean.startsWith('/admin/') ||
    clean === '/admin-portal' ||
    clean === '/admin-portal.html' ||
    clean === '/super-admin-orbit.html'
  ) {
    return serveFile(path.join(FRONTEND_DIR, 'super-admin-orbit.html'), res);
  }

  if (clean === '/legal' || clean === '/privacy' || clean === '/credits' || clean === '/privacy-policy') {
    return serveFile(path.join(FRONTEND_DIR, 'legal', 'index.html'), res);
  }

  const skillMatch = clean.match(/^\/(?:frontend\/)?(web-developer|app-developer|ui-ux-designer|graphic-designer|photographer|ability-card|legal)(?:\/(.*))?$/);
  if (skillMatch) {
    const skill = skillMatch[1];
    const sub = skillMatch[2];
    if (!sub || sub === 'index.html') {
      return serveFile(path.join(FRONTEND_DIR, skill, 'index.html'), res);
    }
    return serveFile(path.join(FRONTEND_DIR, skill, sub), res);
  }

  const frontPath = path.join(FRONTEND_DIR, reqUrl);
  if (fs.existsSync(frontPath) && fs.statSync(frontPath).isFile()) {
    return serveFile(frontPath, res);
  }

  const filePath = path.join(DIR, reqUrl);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  if (fs.existsSync(frontPath + '.html')) {
    return serveFile(frontPath + '.html', res);
  }

  if (fs.existsSync(filePath + '.html')) {
    return serveFile(filePath + '.html', res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
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
