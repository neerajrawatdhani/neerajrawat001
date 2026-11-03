require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Locate frontend directory dynamically
const candidateFrontendDirs = [
  path.resolve(__dirname, '..', 'frontend'),
  path.resolve(__dirname, 'frontend'),
  path.resolve(process.cwd(), 'frontend'),
  path.resolve(process.cwd())
];
const FRONTEND_DIR = candidateFrontendDirs.find(d => fs.existsSync(path.join(d, 'index.html'))) || candidateFrontendDirs[0];
console.log(`[Server] Static frontend root identified at: ${FRONTEND_DIR}`);

// Setup Nodemailer transporter with Gmail SMTP
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  transporter.verify((error) => {
    if (error) {
      console.warn('[SMTP Warning] Could not verify Gmail SMTP connection:', error.message);
    } else {
      console.log('[SMTP] Gmail transporter ready. Notifications will be sent from', process.env.SMTP_USER);
    }
  });
} else {
  console.warn('[SMTP] No email credentials found in .env; email dispatch disabled.');
}

// Data directory & storage setup with zero-fail in-memory and /tmp fallback
let DATA_DIR = path.join(__dirname, 'data');
const memStore = {};

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.accessSync(DATA_DIR, fs.constants.W_OK);
} catch (e) {
  // If running in a read-only container/serverless env, fallback to /tmp
  try {
    const tmpData = path.join('/tmp', 'dhani-tech-data');
    if (!fs.existsSync(tmpData)) fs.mkdirSync(tmpData, { recursive: true });
    DATA_DIR = tmpData;
    console.log('[Storage] Using writable temporary data directory:', DATA_DIR);
  } catch (err) {
    console.warn('[Storage] Read-only disk detected. Operating with in-memory caching fallback.');
  }
}

const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

const DEFAULT_CONFIG = {
  name: "Neeraj Rawat",
  title: "Founder & CEO, EduDhani (School ERP) | UI/UX & Graphic Designer",
  available: true,
  company: "EduDhani (www.edudhani.com)",
  statusMessage: "Available for enterprise inquiries and product collaborations",
  responseTime: "Replies within 5 hours",
  email: process.env.SMTP_USER || "neerajrawatdhani@gmail.com",
  website: "https://www.edudhani.com",
  location: "India / Remote",
  timezone: "Asia/Kolkata",
  socials: {
    website: "https://www.edudhani.com",
    github: "https://github.com",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    instagram: "https://instagram.com"
  }
};

const DEFAULT_STATS = { visits: 0, inquiries: 0, lastVisited: null };

function initFile(filePath, defaultValue) {
  memStore[path.basename(filePath)] = defaultValue;
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    } else {
      memStore[path.basename(filePath)] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.warn(`[Storage Warning] Cannot initialize ${filePath} on disk; loaded to memory.`);
  }
}

initFile(INQUIRIES_FILE, []);
initFile(CONFIG_FILE, DEFAULT_CONFIG);
initFile(STATS_FILE, DEFAULT_STATS);

function readJson(file) {
  const key = path.basename(file);
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      memStore[key] = parsed;
      return parsed;
    }
  } catch (err) {
    console.error(`Error reading ${file}, using memory cache:`, err.message);
  }
  return memStore[key] || null;
}

function writeJson(file, data) {
  const key = path.basename(file);
  memStore[key] = data;
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn(`Warning writing ${file} to disk, maintained in memory:`, err.message);
    return true; // memory fallback guarantees zero API disruption
  }
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (!req.url.startsWith('/fonts') && !req.url.startsWith('/vendor')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// ----------------------------------------------------
// 1. API ROUTES
// ----------------------------------------------------

// API Index
app.get('/api', (req, res) => {
  res.json({
    service: "Dhani Tech Portfolio & EduDhani Backend API",
    status: "running",
    port: PORT,
    endpoints: {
      health: "GET /api/health",
      status: "GET /api/status",
      config: "GET /api/config, PUT /api/config",
      inquiries: "GET /api/inquiries, POST /api/contact, DELETE /api/inquiries/:id",
      stats: "GET /api/stats, POST /api/stats/visit"
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    smtpReady: !!transporter
  });
});

// Status & Availability
app.get('/api/status', (req, res) => {
  const cfg = readJson(CONFIG_FILE) || {};
  res.json({
    available: cfg.available !== undefined ? cfg.available : true,
    statusMessage: cfg.statusMessage || "Available for projects",
    responseTime: cfg.responseTime || "Replies within 5 hours",
    serverTime: new Date().toISOString()
  });
});

// Site Config
app.get('/api/config', (req, res) => {
  const cfg = readJson(CONFIG_FILE);
  res.json(cfg || {});
});

app.put('/api/config', (req, res) => {
  const current = readJson(CONFIG_FILE) || {};
  const updated = { ...current, ...req.body };
  writeJson(CONFIG_FILE, updated);
  res.json({ success: true, config: updated });
});

// Helper: send emails
async function sendInquiryEmails(inquiry) {
  if (!transporter) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'neerajrawatdhani@gmail.com';
  const fromAddress = `"${process.env.FROM_NAME || 'Neeraj Rawat | Dhani Tech'}" <${process.env.SMTP_USER}>`;

  // 1. Notification email to Neeraj Rawat
  const adminMailOptions = {
    from: fromAddress,
    to: adminEmail,
    replyTo: inquiry.email,
    subject: inquiry.channel === 'WhatsApp' 
      ? `💬 [WhatsApp Lead] New Project Inquiry: ${inquiry.name} (${inquiry.budget})` 
      : `🚀 New Project Inquiry: ${inquiry.name} (${inquiry.budget})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e0deda; border-radius: 12px; background: #faf9f6; color: #1a1818;">
        <h2 style="margin-top: 0; color: #1a1818; border-bottom: 2px solid #d5cdca; padding-bottom: 12px;">
          ${inquiry.channel === 'WhatsApp' ? '💬 New WhatsApp Inquiry' : '🚀 New Email Inquiry'} Received
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 160px; color: #6b5c5c;">Preferred Channel:</td>
            <td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: ${inquiry.channel === 'WhatsApp' ? '#25D366' : '#1a1818'};">
              ${inquiry.channel || 'Email'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b5c5c;">Client Name:</td>
            <td style="padding: 8px 0; font-size: 16px; color: #1a1818;">${inquiry.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b5c5c;">Mobile Number:</td>
            <td style="padding: 8px 0; font-size: 16px;">
              <a href="tel:${inquiry.mobile}" style="color: #1a1818; text-decoration: none; font-weight: bold;">${inquiry.mobile}</a>
              ${inquiry.mobile ? ` · <a href="https://wa.me/${inquiry.mobile.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(inquiry.name)}%2C%20thank%20you%20for%20contacting%20me%20via%20my%20website%20regarding%20your%20project." target="_blank" style="display:inline-block; margin-left:8px; color: #25D366; font-weight: bold; text-decoration: underline;">Chat on WhatsApp</a>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b5c5c;">Email ID:</td>
            <td style="padding: 8px 0; font-size: 16px;"><a href="mailto:${inquiry.email}" style="color: #1a1818; text-decoration: none; font-weight: bold;">${inquiry.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b5c5c;">Estimated Budget:</td>
            <td style="padding: 8px 0; font-size: 16px; color: #1a1818; font-weight: 600;">${inquiry.budget}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b5c5c;">Submission Time:</td>
            <td style="padding: 8px 0; color: #555;">${new Date(inquiry.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 16px; background: #ffffff; border: 1px solid #d5cdca; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #1a1818;">Project Description:</h4>
          <p style="margin: 0; line-height: 1.6; white-space: pre-wrap; color: #333;">${inquiry.message}</p>
        </div>

        <div style="margin-top: 16px; padding: 12px; background: #edf7ed; border-left: 4px solid #4caf50; border-radius: 4px; font-size: 13px; color: #2e7d32;">
          <strong>Consent Verified:</strong> Client explicitly confirmed that their information will NOT be shared with any third party.
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0deda; font-size: 12px; color: #857878; text-align: center;">
          Sent via Dhani Tech & EduDhani Inquiry Engine · Hit "Reply" to respond directly to ${inquiry.email}
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(adminMailOptions);
    console.log(`[SMTP] Admin notification sent to ${adminEmail} for inquiry ${inquiry.id}`);
  } catch (err) {
    console.error('[SMTP Error] Failed to send admin notification:', err.message);
  }

  // 2. Auto-reply confirmation to client
  if (process.env.ENABLE_CLIENT_AUTOREPLY !== 'false' && inquiry.email) {
    const clientMailOptions = {
      from: fromAddress,
      to: inquiry.email,
      replyTo: adminEmail,
      subject: `Thank you for reaching out, ${inquiry.name} | Dhani Tech & EduDhani`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0deda; border-radius: 12px; background: #ffffff; color: #1a1818;">
          <h2 style="margin-top: 0; color: #1a1818;">Hello ${inquiry.name},</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #333;">
            Thank you for reaching out regarding your project. I have received your submission and will personally review the details you provided.
          </p>
          
          <div style="margin: 20px 0; padding: 16px; background: #faf9f6; border: 1px solid #e0deda; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #1a1818;">Summary of your inquiry:</h4>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px; color: #555;">
              <li><strong>Mobile:</strong> ${inquiry.mobile}</li>
              <li><strong>Email:</strong> ${inquiry.email}</li>
              <li><strong>Estimated Budget:</strong> ${inquiry.budget}</li>
              <li><strong>Description:</strong> ${inquiry.message}</li>
            </ul>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #333;">
            I typically respond within <strong>5 hours</strong>. I will reply to you directly from this email address (<strong>${adminEmail}</strong>) or via phone if urgent.
          </p>

          <div style="margin-top: 20px; padding: 12px; background: #f0f7ff; border-left: 4px solid #2196f3; border-radius: 4px; font-size: 13px; color: #0d47a1;">
            🔒 <strong>Privacy Assurance:</strong> Your trust is paramount. As confirmed in your submission, your contact details and project requirements are strictly confidential and will <strong>never be shared with any third party</strong>.
          </div>

          <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #eee;">
            <p style="margin: 0; font-weight: bold; color: #1a1818;">Neeraj Rawat</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b5c5c;">Founder & CEO · EduDhani (School ERP)<br>Dhani Tech · <a href="https://www.edudhani.com" style="color: #6b5c5c; text-decoration: underline;">www.edudhani.com</a></p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(clientMailOptions);
      console.log(`[SMTP] Auto-reply confirmation sent to client <${inquiry.email}>`);
    } catch (err) {
      console.error('[SMTP Error] Failed to send client auto-reply:', err.message);
    }
  }
}

// Contact / Inquiry Submission
app.post(['/api/contact', '/api/inquiries'], async (req, res) => {
  const body = req.body || {};
  const name = (body.name || '').trim();
  const mobile = (body.mobile || body.phone || '').trim();
  const email = (body.email || body.mail || '').trim();
  const budget = (body.budget || 'Flexible / To be discussed').trim();
  const message = (body.message || body.project || '').trim();
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on' || body.consent === 1;

  if (!name) return res.status(400).json({ success: false, error: "Please enter your name." });
  if (!mobile) return res.status(400).json({ success: false, error: "Please provide your mobile number." });
  if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: "Please provide a valid email ID." });
  if (!message) return res.status(400).json({ success: false, error: "Please provide a brief description of your project." });
  if (!consent) {
    return res.status(400).json({
      success: false,
      error: "Consent is required: please confirm that your details will not be shared with any third party."
    });
  }

  const inquiries = readJson(INQUIRIES_FILE) || [];
  const newInquiry = {
    id: 'inq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: new Date().toISOString(),
    channel: (body.channel || 'Email').trim(),
    name: name,
    mobile: mobile,
    email: email,
    budget: budget,
    message: message,
    consent: true,
    consentStatement: "Confirmed: Details will not be shared with any third party and will solely be used for project communication.",
    ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown'
  };

  inquiries.unshift(newInquiry);
  writeJson(INQUIRIES_FILE, inquiries);

  const stats = readJson(STATS_FILE) || { visits: 0, inquiries: 0 };
  stats.inquiries = (stats.inquiries || 0) + 1;
  writeJson(STATS_FILE, stats);

  console.log(`[Backend] New Inquiry from ${newInquiry.name} | Phone: ${newInquiry.mobile} | Email: ${newInquiry.email} | Budget: ${newInquiry.budget}`);

  sendInquiryEmails(newInquiry).catch(err => {
    console.error('[SMTP Background Error]:', err.message);
  });

  res.status(201).json({
    success: true,
    message: `Thank you, ${name}! Your inquiry has been received. I will reply to ${email} within 5 hours.`,
    inquiry: newInquiry
  });
});

// Get all inquiries
app.get('/api/inquiries', (req, res) => {
  const inquiries = readJson(INQUIRIES_FILE) || [];
  res.json({
    count: inquiries.length,
    inquiries: inquiries
  });
});

// Delete an inquiry
app.delete('/api/inquiries/:id', (req, res) => {
  const id = req.params.id;
  const inquiries = readJson(INQUIRIES_FILE) || [];
  const filtered = inquiries.filter(i => i.id !== id);
  if (filtered.length === inquiries.length) {
    return res.status(404).json({ success: false, error: "Inquiry not found" });
  }
  writeJson(INQUIRIES_FILE, filtered);
  res.json({ success: true, message: `Inquiry ${id} deleted` });
});

// Stats: supports GET, POST, and HEAD without throwing 404
app.all(['/api/stats/visit'], (req, res) => {
  const stats = readJson(STATS_FILE) || { visits: 0, inquiries: 0 };
  if (req.method === 'POST') {
    stats.visits = (stats.visits || 0) + 1;
    stats.lastVisited = new Date().toISOString();
    writeJson(STATS_FILE, stats);
  }
  res.json({ success: true, visits: stats.visits });
});

app.get('/api/stats', (req, res) => {
  const stats = readJson(STATS_FILE) || { visits: 0, inquiries: 0 };
  res.json(stats);
});

// ----------------------------------------------------
// 2. FULL-STACK UNIFIED FRONTEND SERVING
// ----------------------------------------------------

// Virtual route prefix stripping (e.g., if a browser requests /home/card/win_sub.webp or /home/vendor/lenis.min.mjs)
const VIRTUAL_PREFIXES = ['/home/', '/work/', '/works/', '/my-story/', '/about/', '/contact/'];
app.use((req, res, next) => {
  for (const vp of VIRTUAL_PREFIXES) {
    if (req.url.startsWith(vp)) {
      const stripped = req.url.slice(vp.length - 1);
      const filePath = path.join(FRONTEND_DIR, decodeURIComponent(stripped.split('?')[0]));
      if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
        req.url = stripped;
        break;
      }
    }
  }
  next();
});

// Clean SPA section routes -> serve index.html
const SPA_ROUTES = ['/home', '/work', '/works', '/my-story', '/about', '/contact', '/legal'];
SPA_ROUTES.forEach(route => {
  app.get([route, route + '/'], (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
});

// Video streaming helper for .mp4 media
app.get('*.mp4', (req, res, next) => {
  const reqPath = decodeURIComponent(req.path);
  const filePath = path.join(FRONTEND_DIR, reqPath);
  if (!fs.existsSync(filePath)) return next();

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// Static assets from frontend directory
app.use(express.static(FRONTEND_DIR, {
  extensions: ['html'],
  index: 'index.html',
  maxAge: '1h'
}));

// Route fallback for subpage directories (e.g. /photographer -> /photographer/index.html)
const SUBPAGES = ['photographer', 'app-developer', 'web-developer', 'ui-ux-designer', 'graphic-designer', 'ability-card', 'legal'];
SUBPAGES.forEach(sp => {
  app.get([`/${sp}`, `/${sp}/`], (req, res) => {
    const target = path.join(FRONTEND_DIR, sp, 'index.html');
    if (fs.existsSync(target)) {
      res.sendFile(target);
    } else {
      res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
    }
  });
});

// Root route serves the website
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Any unmatched GET request falls back to index.html (SPA guarantee)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "Endpoint not found: " + req.path });
  }
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`⚡ Dhani Tech Full-Stack Unified Server`);
  console.log(`🌐 Website & API live at: http://localhost:${PORT}`);
  console.log(`📁 Frontend: ${FRONTEND_DIR}`);
  console.log(`💾 Database: ${DATA_DIR}`);
  console.log(`====================================================`);
});
