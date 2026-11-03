const http = require('http');
const fs = require('fs');
const path = require('path');
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
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

// In-memory data store for standalone environments
let visitCount = 22;
const inquiriesList = [];

// Setup Nodemailer transporter if available
const SMTP_USER = process.env.SMTP_USER || 'neerajrawatdhani@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'rwqu hghn cuct vuzp';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SMTP_USER;

let transporter = null;
if (nodemailer && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
  } catch (e) {
    console.warn('[SMTP Notice] Mailer setup deferred:', e.message);
  }
}

// Handle all /api/* endpoints directly
function handleApi(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const cleanUrl = req.url.split('?')[0];

  // Health
  if (cleanUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      smtpReady: !!transporter
    }));
  }

  // Status
  if (cleanUrl === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      available: true,
      statusMessage: "Available for enterprise inquiries and product collaborations",
      responseTime: "Replies within 5 hours",
      serverTime: new Date().toISOString()
    }));
  }

  // Stats visit
  if (cleanUrl === '/api/stats/visit' || cleanUrl === '/api/stats') {
    if (req.method === 'POST') visitCount++;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, visits: visitCount }));
  }

  // Contact form submission
  if (cleanUrl === '/api/contact' || cleanUrl === '/api/inquiries') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }

    let rawBody = '';
    req.on('data', chunk => rawBody += chunk);
    req.on('end', async () => {
      let body = {};
      try {
        body = JSON.parse(rawBody || '{}');
      } catch (e) {
        body = {};
      }

      const name = (body.name || '').trim();
      const mobile = (body.mobile || body.phone || '').trim();
      const email = (body.email || body.mail || '').trim();
      const budget = (body.budget || 'Flexible / To be discussed').trim();
      const message = (body.message || body.project || '').trim();
      const consent = body.consent === true || body.consent === 'true' || body.consent === 'on' || body.consent === 1;

      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: "Please enter your name." }));
      }
      if (!mobile) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: "Please provide your mobile number." }));
      }
      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: "Please provide a valid email ID." }));
      }
      if (!message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: "Please provide a brief description of your project." }));
      }
      if (!consent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: "Consent is required: please confirm that your details will not be shared with any third party."
        }));
      }

      const inquiry = {
        id: 'inq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
        channel: (body.channel || 'Email').trim(),
        name,
        mobile,
        email,
        budget,
        message,
        consent: true
      };
      inquiriesList.unshift(inquiry);

      // Send emails asynchronously
      if (transporter) {
        const fromAddress = `"Neeraj Rawat | Dhani Tech" <${SMTP_USER}>`;
        transporter.sendMail({
          from: fromAddress,
          to: ADMIN_EMAIL,
          replyTo: email,
          subject: inquiry.channel === 'WhatsApp'
            ? `💬 [WhatsApp Lead] New Project Inquiry: ${name} (${budget})`
            : `🚀 New Project Inquiry: ${name} (${budget})`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>New Project Inquiry</h2><p><b>Name:</b> ${name}</p><p><b>Phone:</b> ${mobile}</p><p><b>Email:</b> ${email}</p><p><b>Budget:</b> ${budget}</p><p><b>Channel:</b> ${inquiry.channel}</p><p><b>Message:</b><br>${message}</p></div>`
        }).catch(err => console.error('[SMTP Error]:', err.message));

        transporter.sendMail({
          from: fromAddress,
          to: email,
          replyTo: ADMIN_EMAIL,
          subject: `Thank you for reaching out, ${name} | Dhani Tech & EduDhani`,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Hello ${name},</h2><p>Thank you for contacting me. I will reply to you within 5 hours.</p><p>Best regards,<br><b>Neeraj Rawat</b><br>Founder & CEO, EduDhani</p></div>`
        }).catch(err => console.error('[SMTP Auto-Reply Error]:', err.message));
      }

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Thank you, ${name}! Your inquiry has been received. I will reply to ${email} within 5 hours.`,
        inquiry
      }));
    });
    return;
  }

  // Unhandled API
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
}

const server = http.createServer((req, res) => {
  // CORS support
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // Check if it's an API request
  if (req.url.startsWith('/api/') || req.url === '/api') {
    return handleApi(req, res);
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  const cleanNorm = reqPath.replace(/\/index\.html$/, '').replace(/\/$/, '').toLowerCase();

  // 1. SUBPAGES: explicitly serve their dedicated index.html (never fallback to home!)
  const SUBPAGES = ['photographer', 'app-developer', 'web-developer', 'ui-ux-designer', 'graphic-designer', 'ability-card', 'legal'];
  for (const sp of SUBPAGES) {
    if (cleanNorm === '/' + sp) {
      const spIndex = path.join(ROOT, sp, 'index.html');
      if (fs.existsSync(spIndex)) {
        res.writeHead(200, {
          'Content-Length': fs.statSync(spIndex).size,
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(spIndex).pipe(res);
        return;
      }
    }
  }

  // 2. Clean SPA section routes: /home, /work, /my-story, /contact -> serve index.html directly
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

  // 3. Resilient font resolution: any request for onest-latin from any path
  if (reqPath.includes('onest-latin')) {
    const fontName = path.basename(reqPath);
    const fontPath = path.join(ROOT, 'fonts', fontName);
    if (fs.existsSync(fontPath)) {
      res.writeHead(200, {
        'Content-Length': fs.statSync(fontPath).size,
        'Content-Type': 'font/woff2',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      fs.createReadStream(fontPath).pipe(res);
      return;
    }
  }

  // 4. Resilient Lenis resolution: any request for lenis.min.mjs from any subpath
  if (reqPath.includes('lenis.min.mjs')) {
    const lenisPath = path.join(ROOT, 'vendor', 'lenis.min.mjs');
    if (fs.existsSync(lenisPath)) {
      res.writeHead(200, {
        'Content-Length': fs.statSync(lenisPath).size,
        'Content-Type': 'text/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(lenisPath).pipe(res);
      return;
    }
  }

  // 5. Virtual route prefix stripping (e.g., if a browser requests /home/card/win_sub.webp)
  const virtualPrefixes = ['/home/', '/work/', '/works/', '/my-story/', '/about/', '/contact/'];
  for (const vp of virtualPrefixes) {
    if (reqPath.startsWith(vp)) {
      const stripped = reqPath.slice(vp.length - 1);
      const testPath = path.join(ROOT, stripped);
      if (fs.existsSync(testPath)) {
        reqPath = stripped;
        break;
      }
    }
  }

  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }

  let filePath = path.join(ROOT, reqPath);

  // If path is a directory, serve its index.html directly (NO 301 loop!)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const dirIdx = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIdx)) {
      filePath = dirIdx;
    }
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
