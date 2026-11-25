const fs = require('fs');
const path = require('path');
const { getSettings } = require('../_settings');
const { updateLead } = require('../_leads');
const { loadMailer } = require('../_mailer');
const { computeProposalMath, buildProposalEmailHtml } = require('../_proposalTemplate');

const TMP_QUOTES = '/tmp/quotations.json';
const REPO_QUOTES = path.resolve(__dirname, '..', '..', 'backend', 'data', 'quotations.json');
let memoryQuotes = [];

function loadQuotes() {
  for (const f of [TMP_QUOTES, REPO_QUOTES]) {
    try {
      if (fs.existsSync(f)) {
        const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
        if (Array.isArray(parsed)) { memoryQuotes = parsed; return memoryQuotes; }
      }
    } catch (e) {}
  }
  return memoryQuotes;
}

function saveQuotes(list) {
  memoryQuotes = Array.isArray(list) ? list : [];
  for (const f of [TMP_QUOTES, REPO_QUOTES]) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(f, JSON.stringify(memoryQuotes, null, 2), 'utf8');
    } catch (e) {}
  }
  return memoryQuotes;
}

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const settings = getSettings();
  return Boolean(token && settings.adminSecret && token === settings.adminSecret);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Please sign in first.' });
  }

  if (req.method === 'GET') {
    const quotations = loadQuotes();
    return res.status(200).json({ success: true, quotations });
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { id, ...updates } = body;
    if (!id) return res.status(400).json({ success: false, error: 'Quotation ID is required.' });
    const list = loadQuotes();
    const idx = list.findIndex(q => String(q.id) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Quotation not found.' });
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    saveQuotes(list);
    return res.status(200).json({ success: true, quotation: list[idx] });
  }

  if (req.method === 'DELETE') {
    const body = req.body || {};
    const urlParams = new URL(req.url, 'http://localhost').searchParams;
    const id = body.id || urlParams.get('id');
    const clearAll = body.clearAll === true || urlParams.get('clearAll') === 'true';
    if (clearAll) {
      saveQuotes([]);
      return res.status(200).json({ success: true, quotations: [] });
    }
    if (!id) return res.status(400).json({ success: false, error: 'Quotation ID is required.' });
    const filtered = loadQuotes().filter(q => String(q.id) !== String(id));
    saveQuotes(filtered);
    return res.status(200).json({ success: true, id });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const validName = String(body.clientName || '').trim();
  if (!validName) {
    return res.status(400).json({ success: false, error: 'Client Name is required.' });
  }

  const quoteDate = body.quoteDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const proposalPayload = {
    leadId: body.leadId || '',
    clientName: validName,
    clientCompany: body.clientCompany || '',
    clientEmail: body.clientEmail || '',
    clientMobile: body.clientMobile || '',
    quoteNumber: body.quoteNumber,
    quoteDate,
    currency: body.currency || 'INR',
    devTitle: body.devTitle || 'Custom Website + Complete Admin CMS Dashboard',
    devDesc: body.devDesc || 'Custom UI/UX, Responsive Design, Complete Admin CMS, Enquiry Forms, SEO & Cloud Deployment',
    apiTitle: body.apiTitle || 'Custom REST APIs, Webhooks & Third-Party Service Integration',
    apiDesc: body.apiDesc || 'Authenticated API endpoints, payment/ERP connectors, delivery webhooks & structured error logging',
    businessType: body.businessType || 'Corporate / Business',
    modules: body.modules || {},
    hostingProvider: body.hostingProvider || 'hostinger',
    dbProvider: body.dbProvider || 'mongodb',
    dbCustomTier: body.dbCustomTier || '',
    domainProvider: body.domainProvider || 'namecheap',
    customItems: Array.isArray(body.customItems) ? body.customItems : [],
    websiteDevFee: Number(body.websiteDevFee ?? 50000),
    apiIntegrationFee: Number(body.apiIntegrationFee ?? 12000),
    waIntegrationFee: Number(body.waIntegrationFee ?? 8000),
    vpsFee: Number(body.vpsFee ?? 12000),
    vpsRenewal: Number(body.vpsRenewal ?? body.vpsFee ?? 15000),
    domainFee: Number(body.domainFee ?? 1800),
    domainRenewal: Number(body.domainRenewal ?? 2200),
    mongodbFee: Number(body.mongodbFee ?? 10000),
    mongodbRenewal: Number(body.mongodbRenewal ?? body.mongodbFee ?? 10000),
    backupFee: Number(body.backupFee ?? 3000),
    backupRenewal: Number(body.backupRenewal ?? 3000),
    whatsappAllowance: Number(body.whatsappAllowance ?? 3500),
    whatsappRenewal: Number(body.whatsappRenewal ?? 3500),
    customNotes: body.customNotes || ''
  };

  const math = computeProposalMath(proposalPayload);
  const { currencyMeta, totalOneTime, totalOperatingY1, grandTotalY1, grandTotalRenewal } = math;
  const qId = body.quoteNumber || ('DT-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 900)));

  const quoteRecord = {
    id: qId,
    leadId: proposalPayload.leadId,
    client: validName,
    company: proposalPayload.clientCompany,
    email: proposalPayload.clientEmail,
    phone: proposalPayload.clientMobile,
    category: proposalPayload.businessType,
    scope: proposalPayload.devTitle,
    scopeDesc: proposalPayload.devDesc,
    apiTitle: proposalPayload.apiTitle,
    apiDesc: proposalPayload.apiDesc,
    currency: math.currency,
    modules: math.modules,
    hostingProvider: proposalPayload.hostingProvider,
    dbProvider: proposalPayload.dbProvider,
    dbCustomTier: proposalPayload.dbCustomTier,
    domainProvider: proposalPayload.domainProvider,
    customItems: math.customItems,
    websiteDevFee: proposalPayload.websiteDevFee,
    apiIntegrationFee: proposalPayload.apiIntegrationFee,
    waIntegrationFee: proposalPayload.waIntegrationFee,
    vpsFee: proposalPayload.vpsFee,
    vpsRenewal: proposalPayload.vpsRenewal,
    domainFee: proposalPayload.domainFee,
    domainRenewal: proposalPayload.domainRenewal,
    mongodbFee: proposalPayload.mongodbFee,
    mongodbRenewal: proposalPayload.mongodbRenewal,
    backupFee: proposalPayload.backupFee,
    backupRenewal: proposalPayload.backupRenewal,
    whatsappAllowance: proposalPayload.whatsappAllowance,
    whatsappRenewal: proposalPayload.whatsappRenewal,
    value: currencyMeta.sym + totalOneTime.toLocaleString(currencyMeta.locale),
    valNum: totalOneTime,
    totalOneTime,
    totalOperatingY1,
    totalYear1: grandTotalY1,
    totalRenewal: grandTotalRenewal,
    status: body.status || (body.sendEmail === false ? 'In Discussion' : 'Quotation Sent'),
    followupDue: body.followupDue || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: proposalPayload.customNotes || 'Proposal created in Control Studio',
    updatedAt: new Date().toISOString()
  };

  const quotes = loadQuotes();
  const qIdx = quotes.findIndex(q => String(q.id) === String(qId));
  if (qIdx >= 0) quotes[qIdx] = { ...quotes[qIdx], ...quoteRecord };
  else quotes.unshift(quoteRecord);
  saveQuotes(quotes);

  if (body.action === 'save' || body.sendEmail === false) {
    return res.status(200).json({
      success: true,
      emailSent: false,
      quotation: quoteRecord,
      message: `Quotation #${qId} saved successfully.`
    });
  }

  if (!proposalPayload.clientEmail || !String(proposalPayload.clientEmail).trim()) {
    return res.status(400).json({ success: false, quotation: quoteRecord, error: 'Client Email is required to send proposal email.' });
  }

  if (proposalPayload.leadId) {
    try {
      updateLead(proposalPayload.leadId, {
        status: 'Proposal Sent',
        company: proposalPayload.clientCompany || undefined,
        notes: `Proposal #${qId} (${currencyMeta.sym}${grandTotalY1.toLocaleString(currencyMeta.locale)} Year 1 / ${currencyMeta.sym}${grandTotalRenewal.toLocaleString(currencyMeta.locale)} renewal) sent to ${proposalPayload.clientEmail}.`
      });
    } catch (e) {
      console.error('[Lead Quote Update Error]:', e.message);
    }
  }

  const settings = getSettings();
  const smtpUser = String(settings.smtpUser || '').trim();
  const smtpPass = String(settings.smtpPass || '').trim();
  const nodemailer = loadMailer();

  if (!nodemailer || !smtpUser || !smtpPass) {
    return res.status(400).json({
      success: false,
      quotation: quoteRecord,
      error: 'SMTP credentials (SMTP_USER / SMTP_PASS) are not configured on the server.'
    });
  }

  try {
    const emailHtml = buildProposalEmailHtml({ ...proposalPayload, id: qId, quoteNumber: qId });
    const transporter = nodemailer.createTransport({
      host: String(settings.smtpHost || 'smtp.gmail.com').trim(),
      port: parseInt(settings.smtpPort || '465', 10),
      secure: settings.smtpSecure !== false,
      auth: { user: smtpUser, pass: smtpPass }
    });

    const fromAddress = `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${smtpUser}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: proposalPayload.clientEmail.trim(),
      cc: smtpUser,
      replyTo: smtpUser,
      subject: `Annual Cost Proposal #${qId} for ${proposalPayload.clientCompany ? `${proposalPayload.clientCompany} (${validName})` : validName} — Dhani Tech`,
      html: emailHtml
    });

    return res.status(200).json({
      success: true,
      emailSent: true,
      quotation: quoteRecord,
      message: `Proposal #${qId} emailed cleanly to ${proposalPayload.clientEmail.trim()}.`,
      quoteNumber: qId
    });
  } catch (err) {
    console.error('[Send Quote Email Error]:', err.message);
    return res.status(500).json({
      success: false,
      quotation: quoteRecord,
      error: 'Email delivery failed: ' + err.message
    });
  }
};
