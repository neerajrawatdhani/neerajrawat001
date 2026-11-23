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

  // 0. API routes handling
  if (reqUrl.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    const inqPath = path.join(DIR, 'backend', 'data', 'inquiries.json');

    // 1. Inquiries & Admin Leads: GET
    if ((clean === '/api/inquiries' || clean === '/api/admin/leads') && req.method === 'GET') {
      let inquiries = [];
      try {
        if (fs.existsSync(inqPath)) inquiries = JSON.parse(fs.readFileSync(inqPath, 'utf8'));
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, count: inquiries.length, inquiries, leads: inquiries }));
    }

    // 2. Inquiries & Admin Leads: DELETE
    if ((clean === '/api/inquiries' || clean === '/api/admin/leads' || clean.startsWith('/api/inquiries/')) && req.method === 'DELETE') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let deleteId = null;
        if (clean.startsWith('/api/inquiries/')) {
          deleteId = clean.replace('/api/inquiries/', '').trim();
        }
        if (!deleteId && body) {
          try {
            const parsed = JSON.parse(body);
            deleteId = parsed.id;
          } catch(e) {}
        }
        if (!deleteId && req.url.includes('?')) {
          const qs = new URLSearchParams(req.url.split('?')[1]);
          deleteId = qs.get('id');
        }

        let inquiries = [];
        try {
          if (fs.existsSync(inqPath)) inquiries = JSON.parse(fs.readFileSync(inqPath, 'utf8'));
        } catch(e) {}

        if (deleteId) {
          inquiries = inquiries.filter(i => String(i.id) !== String(deleteId));
          try {
            fs.writeFileSync(inqPath, JSON.stringify(inquiries, null, 2), 'utf8');
          } catch(e) {}
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Inquiry deleted successfully', id: deleteId }));
      });
      return;
    }

    // 3. Quotation DELETE or POST
    if (clean === '/api/admin/quotation') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Quotation processed successfully' }));
    }

    // 4. Products API
    if (clean === '/api/products') {
      const prodApi = require('./api/products.js');
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        if (bodyData) {
          try { req.body = JSON.parse(bodyData); } catch(e) { req.body = {}; }
        } else {
          req.body = {};
        }

        // Mock express res methods
        res.status = function(code) { res.statusCode = code; return res; };
        res.json = function(obj) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        try {
          await prodApi(req, res);
        } catch(err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 5. Razorpay Create Order API
    if (clean === '/api/create-order') {
      const createOrderApi = require('./api/create-order.js');
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        if (bodyData) {
          try { req.body = JSON.parse(bodyData); } catch(e) { req.body = {}; }
        } else {
          req.body = {};
        }
        res.status = function(code) { res.statusCode = code; return res; };
        res.json = function(obj) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        try {
          await createOrderApi(req, res);
        } catch(err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 6. Razorpay Verify Payment API
    if (clean === '/api/verify-payment') {
      const verifyPaymentApi = require('./api/verify-payment.js');
      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', async () => {
        if (bodyData) {
          try { req.body = JSON.parse(bodyData); } catch(e) { req.body = {}; }
        } else {
          req.body = {};
        }
        res.status = function(code) { res.statusCode = code; return res; };
        res.json = function(obj) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        try {
          await verifyPaymentApi(req, res);
        } catch(err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }
  }

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

  if (clean === '/legal' || clean === '/privacy' || clean === '/credits' || clean === '/privacy-policy') {
    return serveFile(path.join(DIR, 'frontend', 'legal', 'index.html'), res);
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
