const fs = require('fs');
const path = require('path');
const { getSettings } = require('../_settings');
const { updateLead } = require('../_leads');

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

const { loadMailer } = require('../_mailer');

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const {
    leadId,
    clientName,
    clientCompany = '',
    clientEmail,
    clientMobile = '',
    quoteNumber,
    quoteDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    currency = 'INR',
    devTitle = 'Custom Website + Complete Admin CMS Dashboard',
    devDesc = 'Custom UI/UX, Responsive Design, Complete Admin CMS, Enquiry Forms, SEO & Cloud Deployment',
    businessType = 'Corporate / Business',
    // Section 1: One-time implementation
    websiteDevFee = 50000,
    waIntegrationFee = 8000,
    // Section 2 & 3: Operating costs
    vpsFee = 12000,
    vpsRenewal = 15000,
    domainFee = 1800,
    domainRenewal = 2200,
    mongodbFee = 10000,
    mongodbRenewal = 10000,
    backupFee = 3000,
    backupRenewal = 3000,
    whatsappAllowance = 3500,
    whatsappRenewal = 3500,
    customNotes = ''
  } = body;

  const validName = String(clientName || '').trim();
  if (!validName) {
    return res.status(400).json({ success: false, error: 'Client Name is required.' });
  }

  const sym = currency === 'USD' ? '$' : '₹';
  const settings = getSettings();

  // Computations matching Annual Cost Proposal exact mathematics
  const totalOneTime = Number(websiteDevFee) + Number(waIntegrationFee);
  const totalOperatingY1 = Number(vpsFee) + Number(domainFee) + Number(mongodbFee) + Number(backupFee) + Number(whatsappAllowance);
  const grandTotalY1 = totalOneTime + totalOperatingY1;
  const grandTotalRenewal = Number(vpsRenewal) + Number(domainRenewal) + Number(mongodbRenewal) + Number(backupRenewal) + Number(whatsappRenewal);

  const qId = quoteNumber || ('DT-' + new Date().getFullYear() + '-' + String(Math.floor(100 + Math.random() * 900)));
  const quoteRecord = {
    id: qId,
    leadId: leadId || '',
    client: validName,
    company: clientCompany || '',
    email: clientEmail || '',
    phone: clientMobile || '',
    category: businessType || 'Custom Project',
    scope: devTitle,
    scopeDesc: devDesc,
    currency: currency || 'INR',
    websiteDevFee: Number(websiteDevFee) || 0,
    waIntegrationFee: Number(waIntegrationFee) || 0,
    vpsFee: Number(vpsFee) || 0,
    vpsRenewal: Number(vpsRenewal) || 0,
    domainFee: Number(domainFee) || 0,
    domainRenewal: Number(domainRenewal) || 0,
    mongodbFee: Number(mongodbFee) || 0,
    mongodbRenewal: Number(mongodbRenewal) || 0,
    backupFee: Number(backupFee) || 0,
    backupRenewal: Number(backupRenewal) || 0,
    whatsappAllowance: Number(whatsappAllowance) || 0,
    whatsappRenewal: Number(whatsappRenewal) || 0,
    value: sym + Number(websiteDevFee).toLocaleString('en-IN'),
    valNum: Number(websiteDevFee) || 0,
    totalOneTime,
    totalYear1: grandTotalY1,
    totalRenewal: grandTotalRenewal,
    status: body.status || (body.sendEmail === false ? 'In Discussion' : 'Quotation Sent'),
    followupDue: body.followupDue || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: customNotes || 'Proposal created in Super Admin',
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

  if (!clientEmail || !String(clientEmail).trim()) {
    return res.status(400).json({ success: false, quotation: quoteRecord, error: 'Client Email is required to send proposal email.' });
  }

  // Auto-update lead in CRM pipeline if leadId passed
  if (leadId) {
    try {
      updateLead(leadId, {
        status: 'Proposal Sent',
        company: clientCompany || undefined,
        notes: `Gurukulam Proposal #${quoteNumber || 'QT-' + Date.now().toString().slice(-4)} (${sym}${grandTotalY1.toLocaleString('en-IN')} Year 1 / ${sym}${grandTotalRenewal.toLocaleString('en-IN')} renewal) sent to ${clientEmail}.`
      });
    } catch (e) {
      console.error('[Lead Quote Update Error]:', e.message);
    }
  }

  // Exact 10-section Gurukulam School HTML Proposal
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 740px; margin: 0 auto; padding: 36px 28px; background: #ffffff; color: #1a1a1a; line-height: 1.5; border: 1px solid #e2e8f0; border-radius: 12px;">
      
      <!-- Proposal Header -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; text-transform: uppercase;">
              ${clientCompany ? clientCompany.toUpperCase() : clientName.toUpperCase()}
            </h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569; font-weight: 500;">
              Website, Complete Admin Dashboard &amp; WhatsApp Business API | Annual Cost Proposal | ${quoteDate}
            </p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #0f172a; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
              Official Proposal
            </span>
            <div style="margin-top: 4px; font-size: 13px; font-weight: bold; color: #0f172a;">Quote #${quoteNumber || 'QT-' + Date.now().toString().slice(-4)}</div>
          </div>
        </div>
      </div>

      <!-- Project Overview -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #0f172a;">Project overview</h3>
        <p style="margin: 0; font-size: 13px; color: #334155;">
          Development of a responsive school website and secure content-management admin dashboard, with an additional WhatsApp Business Platform (Meta Cloud API) integration. Figures are indicative annual budgets in INR, not vendor invoices.
        </p>
      </div>

      <!-- 1. One-time development & integration -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">1. One-time development &amp; integration</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 10px 14px; font-weight: 700;">Deliverable</th>
              <th style="padding: 10px 14px; font-weight: 700; text-align: right; width: 180px;">One-time charge</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 10px 14px;">${devTitle}</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: bold;">${sym}${Number(websiteDevFee).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 10px 14px;">WhatsApp Cloud API &amp; Automated Webhook Integration Allowance</td>
              <td style="padding: 10px 14px; text-align: right; font-weight: bold;">${sym}${Number(waIntegrationFee).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #ffffff; font-weight: bold; border-top: 2px solid #0f172a;">
              <td style="padding: 10px 14px;">Total one-time implementation investment</td>
              <td style="padding: 10px 14px; text-align: right; color: #0f172a; font-size: 15px;">${sym}${totalOneTime.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 11.5px; color: #475569; margin: 4px 0 6px 0; line-height: 1.5;">
          <strong>Included deliverable scope:</strong> ${devDesc}
        </p>
        <p style="font-size: 11.5px; color: #475569; margin: 0; line-height: 1.5;">
          <strong>WhatsApp integration scope:</strong> Meta business setup assistance, approved-template integration, opt-in aware admissions enquiry acknowledgement and selected school notices, secure server-side API calls, delivery-status webhook handling, error logging and basic admin send/history view. Business verification, template approval and third-party service fees are subject to Meta/provider policies.
        </p>
      </div>

      <!-- 2. First-year annual operating budget -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">2. First-year annual operating budget</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 10px 14px; font-weight: 700;">Cost component</th>
              <th style="padding: 10px 14px; font-weight: 700; width: 150px;">Annual allowance</th>
              <th style="padding: 10px 14px; font-weight: 700;">Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 14px;">VPS hosting (application + API)</td>
              <td style="padding: 9px 14px; font-weight: bold;">${sym}${Number(vpsFee).toLocaleString('en-IN')}</td>
              <td style="padding: 9px 14px; color: #64748b; font-size: 12px;">Estimated Year 1</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 9px 14px;">.com domain registration</td>
              <td style="padding: 9px 14px; font-weight: bold;">${sym}${Number(domainFee).toLocaleString('en-IN')}</td>
              <td style="padding: 9px 14px; color: #64748b; font-size: 12px;">Estimated initial cost</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 14px;">MongoDB Atlas Flex database</td>
              <td style="padding: 9px 14px; font-weight: bold;">${sym}${Number(mongodbFee).toLocaleString('en-IN')}</td>
              <td style="padding: 9px 14px; color: #64748b; font-size: 12px;">Low-usage planning budget</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 9px 14px;">Backup / storage</td>
              <td style="padding: 9px 14px; font-weight: bold;">${sym}${Number(backupFee).toLocaleString('en-IN')}</td>
              <td style="padding: 9px 14px; color: #64748b; font-size: 12px;">Budget reserve</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 9px 14px;">Meta WhatsApp messaging</td>
              <td style="padding: 9px 14px; font-weight: bold;">${sym}${Number(whatsappAllowance).toLocaleString('en-IN')}</td>
              <td style="padding: 9px 14px; color: #64748b; font-size: 12px;">Usage illustration below</td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: bold; border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 14px;">Total first-year operating cost</td>
              <td style="padding: 10px 14px; font-size: 14px; color: #0f172a;">${sym}${totalOperatingY1.toLocaleString('en-IN')}</td>
              <td style="padding: 10px 14px; color: #64748b; font-size: 12px;">Before taxes and BSP fees</td>
            </tr>
            <tr style="background: #e2e8f0; font-weight: 800; border-top: 2px solid #0f172a;">
              <td style="padding: 11px 14px; font-size: 14px;">First-year project total</td>
              <td style="padding: 11px 14px; font-size: 16px; color: #0f172a;">${sym}${grandTotalY1.toLocaleString('en-IN')}</td>
              <td style="padding: 11px 14px; color: #0f172a; font-size: 12px;">${sym}${totalOneTime.toLocaleString('en-IN')} implementation + ${sym}${totalOperatingY1.toLocaleString('en-IN')} running</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. Second-year onward — annual renewal -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">3. Second-year onward — annual renewal</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1; text-align: center;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 10px 8px; font-weight: 700;">VPS</th>
              <th style="padding: 10px 8px; font-weight: 700;">Domain renewal</th>
              <th style="padding: 10px 8px; font-weight: 700;">MongoDB</th>
              <th style="padding: 10px 8px; font-weight: 700;">Backups</th>
              <th style="padding: 10px 8px; font-weight: 700;">WhatsApp</th>
              <th style="padding: 10px 8px; font-weight: 700; background: #1e293b;">Total/year</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #ffffff; font-weight: bold;">
              <td style="padding: 12px 8px;">${sym}${Number(vpsRenewal).toLocaleString('en-IN')}</td>
              <td style="padding: 12px 8px;">${sym}${Number(domainRenewal).toLocaleString('en-IN')}</td>
              <td style="padding: 12px 8px;">${sym}${Number(mongodbRenewal).toLocaleString('en-IN')}</td>
              <td style="padding: 12px 8px;">${sym}${Number(backupRenewal).toLocaleString('en-IN')}</td>
              <td style="padding: 12px 8px;">${sym}${Number(whatsappRenewal).toLocaleString('en-IN')}</td>
              <td style="padding: 12px 8px; font-size: 15px; color: #0f172a; background: #f8fafc;">${sym}${grandTotalRenewal.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 11.5px; color: #475569; margin: 8px 0 0 0; line-height: 1.5;">
          The ${sym}${Number(websiteDevFee).toLocaleString('en-IN')} website development fee and ${sym}${Number(waIntegrationFee).toLocaleString('en-IN')} WhatsApp integration fee are one-time and are <strong>not repeated</strong> in the renewal figure. Ongoing technical maintenance or change requests are separate.
        </p>
      </div>

      <!-- 4. Meta pricing for India (effective 01 October 2026) -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">4. Meta pricing for India (effective 01 October 2026)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 9px 12px;">Message category</th>
              <th style="padding: 9px 12px; width: 200px;">Meta rate / delivered message</th>
              <th style="padding: 9px 12px;">Common school use</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 12px; font-weight: bold;">Utility</td><td style="padding: 8px 12px; font-weight: bold; color: #0f172a;">₹0.1150</td><td style="padding: 8px 12px; color: #475569;">Operational updates / eligible reminders</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold;">Authentication</td><td style="padding: 8px 12px; font-weight: bold; color: #0f172a;">₹0.1150</td><td style="padding: 8px 12px; color: #475569;">OTP / verification</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 12px; font-weight: bold;">Marketing</td><td style="padding: 8px 12px; font-weight: bold; color: #0f172a;">₹0.8631</td><td style="padding: 8px 12px; color: #475569;">Promotional admissions campaigns / offers</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px 12px; font-weight: bold;">Service reply</td><td style="padding: 8px 12px; font-weight: bold; color: #0f172a;">₹0.1150 after applicable allowance</td><td style="padding: 8px 12px; color: #475569;">Replies to incoming chats</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 5. Illustrative annual messaging cost -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">5. Illustrative annual messaging cost</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; border: 1px solid #cbd5e1; text-align: right;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 9px 12px;">Usage scenario (annual deliveries)</th>
              <th style="padding: 9px 12px; text-align: right;">Utility</th>
              <th style="padding: 9px 12px; text-align: right;">Marketing</th>
              <th style="padding: 9px 12px; text-align: right; background: #1e293b;">Meta estimate/year</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;"><td style="padding: 8px 12px;">Small: 5,000 utility + 500 marketing</td><td style="padding: 8px 12px; text-align: right;">₹575</td><td style="padding: 8px 12px; text-align: right;">₹432</td><td style="padding: 8px 12px; text-align: right; font-weight: bold;">₹1,007</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-weight: 700;">Base: 12,000 utility + 2,400 marketing</td><td style="padding: 8px 12px; text-align: right; font-weight: 700;">₹1,380</td><td style="padding: 8px 12px; text-align: right; font-weight: 700;">₹2,071</td><td style="padding: 8px 12px; text-align: right; font-weight: 800; color: #0f172a; background: #edf2f7;">₹3,451 (~₹3,500 budget)</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;"><td style="padding: 8px 12px;">Growing: 60,000 utility + 12,000 marketing</td><td style="padding: 8px 12px; text-align: right;">₹6,900</td><td style="padding: 8px 12px; text-align: right;">₹10,357</td><td style="padding: 8px 12px; text-align: right; font-weight: bold;">₹17,257</td></tr>
            <tr style="text-align: left;"><td style="padding: 8px 12px;">Large: 240,000 utility + 48,000 marketing</td><td style="padding: 8px 12px; text-align: right;">₹27,600</td><td style="padding: 8px 12px; text-align: right;">₹41,429</td><td style="padding: 8px 12px; text-align: right; font-weight: bold;">₹69,029</td></tr>
          </tbody>
        </table>
        <p style="font-size: 11.5px; color: #475569; margin: 6px 0 0 0;">
          Base case = approximately 1,000 utility messages and 200 marketing messages per month. The quotation budgets ₹3,500/year for Meta usage (rounded), rather than promising a fixed Meta subscription. Messaging is usage-based and may be billed monthly.
        </p>
      </div>

      <!-- 6. Direct Meta API vs. third-party WhatsApp provider -->
      <div style="margin-bottom: 28px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
        <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #0f172a;">6. Direct Meta API vs. third-party WhatsApp provider</h3>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #334155; line-height: 1.5;">
          The proposed budget assumes direct Meta Cloud API integration with no added BSP/SaaS subscription. If the school selects a business solution provider, shared inbox, campaign SaaS or chatbot vendor, that provider may add monthly platform charges and/or markups on Meta message rates. Those optional fees are not included.
        </p>
        <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
          <strong>Conditions for activation:</strong> The school must have an eligible Meta business account, verified/approved business assets where required, a compatible WhatsApp sender number, an active billing method, accepted message templates, appropriate recipient opt-in, and an approved messaging use case. Meta approval and throughput are not guaranteed.
        </p>
      </div>

      <!-- 7. Infrastructure scaling — annual budget bands -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">7. Infrastructure scaling — annual budget bands</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; border: 1px solid #cbd5e1; text-align: center;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 9px 10px; text-align: left;">Scenario</th>
              <th style="padding: 9px 10px;">VPS/year</th>
              <th style="padding: 9px 10px;">MongoDB/year</th>
              <th style="padding: 9px 10px;">Domain + storage/year</th>
              <th style="padding: 9px 10px; background: #1e293b;">Infrastructure/year (excl. WhatsApp)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; text-align: center;"><td style="padding: 8px 10px; text-align: left; font-weight: bold;">Starting</td><td>₹12k–15k</td><td>₹9k–12k</td><td>₹4k–6k</td><td style="font-weight: bold; background: #f8fafc;">₹25k–33k</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc; text-align: center;"><td style="padding: 8px 10px; text-align: left; font-weight: bold;">Growing</td><td>₹15k–30k</td><td>₹12k–36k</td><td>₹5k–12k</td><td style="font-weight: bold; background: #edf2f7;">₹32k–78k</td></tr>
            <tr style="text-align: center;"><td style="padding: 8px 10px; text-align: left; font-weight: bold;">High usage</td><td>₹30k–60k+</td><td>₹65k–90k+</td><td>₹8k–25k+</td><td style="font-weight: bold; background: #f8fafc;">₹103k–175k+</td></tr>
          </tbody>
        </table>
        <p style="font-size: 11.5px; color: #475569; margin: 6px 0 0 0;">
          Add actual annual Meta messaging cost from Section 5 to the applicable infrastructure scenario. WhatsApp usage grows with the number and category of delivered messages, not directly with website visitor traffic. Higher traffic may separately require more VPS capacity, database resources, storage or caching.
        </p>
      </div>

      <!-- 8. MongoDB and domain pricing notes -->
      <div style="margin-bottom: 28px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px;">
        <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: #0f172a;">8. MongoDB and domain pricing notes</h3>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #334155; line-height: 1.5;">
          MongoDB Atlas M0 Free is available for limited testing. Atlas Flex typically costs about USD 8–30/month (USD 96–360/year), depending on use. Dedicated clusters cost more; an M10-class baseline may start around USD 720/year before data transfer, backups and regional variations. The quotation sets aside ₹10,000/year for initial MongoDB usage, which is not a fixed guaranteed vendor rate.
        </p>
        <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
          For a .com domain, the proposal budgets ₹1,800 for registration and ₹2,200/year for renewal. Actual price depends on registrar, available domain name, taxes and currency. VPS estimates are planning allowances: promotional hosting prices may require multi-year prepayment, and renewals can differ from introductory offers.
        </p>
      </div>

      <!-- 9. Commercial summary -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">9. Commercial summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff; text-align: left;">
              <th style="padding: 10px 14px; width: 140px;">Period</th>
              <th style="padding: 10px 14px; width: 160px;">Estimate (INR)</th>
              <th style="padding: 10px 14px;">Composition</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
              <td style="padding: 11px 14px; font-weight: bold;">Year 1</td>
              <td style="padding: 11px 14px; font-weight: 800; font-size: 15px; color: #0f172a;">${sym}${grandTotalY1.toLocaleString('en-IN')}</td>
              <td style="padding: 11px 14px; color: #334155;">Website ${sym}${Number(websiteDevFee).toLocaleString('en-IN')} + WhatsApp integration ${sym}${Number(waIntegrationFee).toLocaleString('en-IN')} + hosting/domain/DB/backup ${sym}${(totalOperatingY1 - Number(whatsappAllowance)).toLocaleString('en-IN')} + Meta usage ${sym}${Number(whatsappAllowance).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 11px 14px; font-weight: bold;">Year 2 onward</td>
              <td style="padding: 11px 14px; font-weight: 800; font-size: 15px; color: #0f172a;">${sym}${grandTotalRenewal.toLocaleString('en-IN')} / year</td>
              <td style="padding: 11px 14px; color: #334155;">VPS/domain/DB/backup renewal ${sym}${(grandTotalRenewal - Number(whatsappRenewal)).toLocaleString('en-IN')} + Meta usage ${sym}${Number(whatsappRenewal).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 11px 14px; font-weight: bold;">Higher usage</td>
              <td style="padding: 11px 14px; font-weight: bold; color: #64748b;">Variable</td>
              <td style="padding: 11px 14px; color: #64748b;">Infrastructure upgrades + additional WhatsApp messages</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 11.5px; color: #64748b; margin: 8px 0 0 0; line-height: 1.5;">
          All figures exclude applicable GST and vendor-specific charges. The ${sym}${Number(waIntegrationFee).toLocaleString('en-IN')} integration amount is a proposed additional development allowance, subject to agreement; the original ${sym}${Number(websiteDevFee).toLocaleString('en-IN')} website quote is unchanged. Recurring support, content production, paid emails/SMS, unrelated ERP features and vendor SaaS subscriptions are excluded.
        </p>
      </div>

      <!-- 10. Public pricing references -->
      <div style="margin-bottom: 28px; background: #f1f5f9; border-radius: 8px; padding: 14px 16px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
          10. Public pricing references (checked 03 November 2026)
        </h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #3b82f6; line-height: 1.6;">
          <li><a href="https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/" style="color: #2563eb; text-decoration: none;">Meta WhatsApp Pricing Documentation</a></li>
          <li><a href="https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/" style="color: #2563eb; text-decoration: none;">MongoDB Atlas Flex Pricing &amp; Billing</a></li>
          <li><a href="https://www.hostinger.com/in/vps-hosting" style="color: #2563eb; text-decoration: none;">Hostinger VPS Cloud Hosting Plans</a></li>
          <li><a href="https://www.namecheap.com/support/knowledgebase/article.aspx/10840/2201/com-price-change-november-1-2026/" style="color: #2563eb; text-decoration: none;">Namecheap .COM Registry Price Updates</a></li>
          <li><a href="https://botsense.io/whatsapp-api-pricing-india/" style="color: #2563eb; text-decoration: none;">India WhatsApp Cloud API Rate Index</a></li>
        </ul>
        <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
          Prepared for: <strong>${clientCompany || clientName}</strong> | Proposal date: ${quoteDate}
        </div>
      </div>

      <!-- Footer Contact -->
      <div style="border-top: 2px solid #0f172a; padding-top: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <p style="margin: 0; font-weight: 800; font-size: 15px; color: #0f172a;">Neeraj Rawat</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">
            Dhani Tech · Direct WhatsApp / Call: <a href="https://wa.me/918708167959" style="color: #0f172a; font-weight: bold; text-decoration: none;">+91 87081 67959</a><br>
            Official Website: <a href="https://neerajrawat.dev" style="color: #2563eb; text-decoration: none;">neerajrawat.dev</a>
          </p>
        </div>
        <div>
          <a href="https://wa.me/918708167959?text=${encodeURIComponent(`Hi Neeraj, I have reviewed the Commercial Proposal #${quoteNumber || ''} for ${clientCompany || clientName} (${sym}${grandTotalY1.toLocaleString('en-IN')} Year 1 / ${sym}${grandTotalRenewal.toLocaleString('en-IN')} renewal). Let's proceed.`)}" 
             style="display: inline-block; background: #25D366; color: #ffffff; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700;">
            Accept &amp; Chat on WhatsApp →
          </a>
        </div>
      </div>
    </div>
  `;

  // Send Email using Nodemailer
  const nodemailer = loadMailer();
  if (nodemailer && settings.smtpUser && settings.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost || 'smtp.gmail.com',
        port: parseInt(settings.smtpPort || '465', 10),
        secure: settings.smtpSecure !== false,
        auth: {
          user: settings.smtpUser.trim(),
          pass: settings.smtpPass.trim()
        }
      });

      const fromAddress = `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${settings.smtpUser.trim()}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: clientEmail.trim(),
        cc: settings.smtpUser.trim(),
        replyTo: settings.smtpUser.trim(),
        subject: `Commercial Proposal & Quotation #${qId} for ${clientCompany ? clientCompany + ' (' + clientName + ')' : clientName} — Dhani Tech`,
        html: emailHtml
      });

      return res.status(200).json({
        success: true,
        emailSent: true,
        quotation: quoteRecord,
        message: `Proposal #${qId} emailed cleanly to ${clientEmail.trim()}!`,
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
  }

  return res.status(400).json({
    success: false,
    quotation: quoteRecord,
    error: 'SMTP credentials are not configured in Settings / Vercel Env.'
  });
};
