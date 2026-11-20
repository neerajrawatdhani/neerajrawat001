const nodemailer = require('nodemailer');
const { getSettings } = require('../_settings');
const { updateLead, loadLeads } = require('../_leads');

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const settings = getSettings();
  return token === settings.adminSecret;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: कृपया लॉगिन करें।' });
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
    duration = '1 Year (Annual)',
    currency = 'INR',
    devItems = [],
    infraItems = [],
    digitalProducts = [],
    dataTier = 'Starter Tier (Up to 1 GB / 500 Students)',
    dataTierCost = 0,
    totalDev = 0,
    totalInfra = 0,
    totalProducts = 0,
    grandTotal = 0,
    year2Renewal = 0,
    year3Renewal = 0,
    notes = '',
    validUntil = ''
  } = body;

  if (!clientName || !clientEmail) {
    return res.status(400).json({ success: false, error: 'Client Name और Email आवश्यक हैं।' });
  }

  const sym = currency === 'USD' ? '$' : '₹';
  const settings = getSettings();

  // If leadId provided, automatically update lead in pipeline to "Proposal Sent"
  if (leadId) {
    try {
      updateLead(leadId, {
        status: 'Proposal Sent',
        company: clientCompany || undefined,
        notes: `Quotation #${quoteNumber || 'QT-' + Date.now().toString().slice(-4)} (${sym}${Number(grandTotal).toLocaleString('en-IN')}) sent for ${duration}. ${notes ? 'Notes: ' + notes : ''}`
      });
    } catch (e) {
      console.error('[Lead Quote Update Error]:', e.message);
    }
  }

  // Generate HTML Quotation Tables
  const devRowsHtml = devItems.map((item, idx) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 12px; font-size: 13px;">${idx + 1}. <strong>${item.name || 'Service'}</strong><br><span style="color: #666; font-size: 12px;">${item.desc || ''}</span></td>
      <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: bold;">${sym}${Number(item.cost || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const infraRowsHtml = infraItems.map((item, idx) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 12px; font-size: 13px;">
        <strong>${item.provider || 'Provider'}</strong> — ${item.name || item.type || 'Cloud Infrastructure'}<br>
        <span style="color: #666; font-size: 12px;">${item.specs || ''} (${item.period || duration})</span>
      </td>
      <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: bold;">${sym}${Number(item.cost || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const productsRowsHtml = digitalProducts.map((p, idx) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px 12px; font-size: 13px;">
        <strong>${p.title || p.name}</strong> <span style="background:#e8a87c22; color:#a4552c; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold;">${p.badge || 'Digital Product'}</span><br>
        <span style="color: #666; font-size: 12px;">${p.desc || ''}</span>
      </td>
      <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: bold;">${sym}${Number(p.price || 0).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 24px; background: #faf9f6; color: #1a1818; border: 1px solid #e0deda; border-radius: 14px;">
      
      <!-- Brand Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1818; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <h1 style="margin: 0; font-size: 24px; color: #1a1818; font-weight: 800; letter-spacing: -0.02em;">Dhani Tech</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b5c5c;">Neeraj Rawat · Founder &amp; CEO, EduDhani (School ERP)<br>Web, Mobile App &amp; Cloud Engineering</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #1a1818; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Official Quotation</span>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: bold;">Quote #${quoteNumber || 'QT-' + Date.now().toString().slice(-4)}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b5c5c;">Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <!-- Client & Business Box -->
      <div style="background: #ffffff; border: 1px solid #e0deda; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: #9e9292; font-weight: bold;">Quotation Prepared For:</span>
          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #1a1818;">${clientName}</p>
          ${clientCompany ? `<p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #a4552c;">🏢 ${clientCompany}</p>` : ''}
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #6b5c5c;">${clientEmail} ${clientMobile ? '· ' + clientMobile : ''}</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; text-transform: uppercase; color: #9e9292; font-weight: bold;">Selected Hosting / Service Duration:</span>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #e8a87c;">${duration}</p>
          ${validUntil ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6b5c5c;">Valid Until: ${validUntil}</p>` : ''}
        </div>
      </div>

      <!-- Section 1: Professional Development & Design Fees -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a1818; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
          1. Professional Engineering &amp; Development Fees
        </h3>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e0deda; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f4f2ee; text-align: left;">
              <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c;">Deliverables</th>
              <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c; text-align: right;">Amount (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${devRowsHtml || '<tr><td colspan="2" style="padding:10px 12px; font-size:13px; color:#888;">Custom Software &amp; Platform Architecture</td></tr>'}
            <tr style="background: #faf9f6; font-weight: bold;">
              <td style="padding: 10px 12px; font-size: 13px;">Subtotal (Development Fees)</td>
              <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #1a1818;">${sym}${Number(totalDev).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 2: Cloud Infrastructure & Hosting Providers -->
      ${infraItems.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a1818; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
            2. Cloud Infrastructure, Hosting &amp; Domain (${duration})
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e0deda; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f4f2ee; text-align: left;">
                <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c;">Provider &amp; Service</th>
                <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c; text-align: right;">Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${infraRowsHtml}
              <tr style="background: #faf9f6; font-weight: bold;">
                <td style="padding: 10px 12px; font-size: 13px;">Subtotal (Infrastructure for ${duration})</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #1a1818;">${sym}${Number(totalInfra).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Section 3: Digital Products & Modular Add-ons -->
      ${digitalProducts.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1a1818; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">
            3. Digital Products &amp; Software Licenses
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e0deda; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f4f2ee; text-align: left;">
                <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c;">Product / Add-on</th>
                <th style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b5c5c; text-align: right;">Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${productsRowsHtml}
              <tr style="background: #faf9f6; font-weight: bold;">
                <td style="padding: 10px 12px; font-size: 13px;">Subtotal (Digital Products)</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #1a1818;">${sym}${Number(totalProducts).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Multi-Year & Renewal Breakdown Box -->
      <div style="background: #ffffff; border: 2px solid #e0deda; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #1a1818; font-weight: 700;">
          📊 Multi-Year &amp; Renewal Pricing Breakdown
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 0;"><strong>Year 1 Total Investment</strong> (Dev Fees + First Year Cloud Hosting + Licenses):</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #e8a87c; font-size: 16px;">${sym}${Number(grandTotal).toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 0;"><strong>Year 2 Renewal</strong> (Cloud Hosting, Domain &amp; Maintenance only — No Dev Fee):</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1a1818;">${sym}${Number(year2Renewal || totalInfra).toLocaleString('en-IN')} / year</td>
          </tr>
          ${year3Renewal > 0 ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Year 3 Renewal</strong> (Cloud Hosting, Domain &amp; Maintenance only):</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1a1818;">${sym}${Number(year3Renewal).toLocaleString('en-IN')} / year</td>
            </tr>
          ` : ''}
        </table>
      </div>

      <!-- Data & Storage Scaling Tiers Table -->
      <div style="background: #ffffff; border: 1px solid #e0deda; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; color: #1a1818; font-weight: 700;">
          📈 Database &amp; Cloud Storage Scaling Matrix
        </h4>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b5c5c;">भविष्य में यदि छात्रों/उपयोगकर्ताओं की संख्या व डेटा बढ़ता है, तो लागत इस प्रकार रहेगी:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr style="background: #f4f2ee; font-weight: bold;">
            <th style="padding: 8px 10px; text-align: left;">Data Tier / Volume</th>
            <th style="padding: 8px 10px; text-align: left;">Capacity</th>
            <th style="padding: 8px 10px; text-align: right;">Annual Cost</th>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 10px;"><strong>Starter Tier</strong> (Included)</td>
            <td style="padding: 8px 10px;">Up to 1 GB · ~500 Students</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #4ADE80;">₹0 (Included)</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 10px;"><strong>Growth Tier</strong></td>
            <td style="padding: 8px 10px;">1 GB – 10 GB · ~2,500 Students</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold;">+₹4,800 / year</td>
          </tr>
          <tr>
            <td style="padding: 8px 10px;"><strong>Enterprise Tier</strong></td>
            <td style="padding: 8px 10px;">10 GB – 50 GB+ · 10,000+ Students</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: bold;">+₹12,000 / year</td>
          </tr>
        </table>
      </div>

      <!-- Grand Total Investment Box -->
      <div style="background: #1a1818; color: #ffffff; border-radius: 12px; padding: 22px 24px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 16px; font-weight: bold;">Initial Project Investment (${duration})</span>
          <span style="font-size: 30px; font-weight: 800; color: #e8a87c;">${sym}${Number(grandTotal).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <!-- Notes / Terms -->
      ${notes ? `
        <div style="background: #ffffff; border: 1px solid #e0deda; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; text-transform: uppercase; color: #6b5c5c;">Notes &amp; Delivery Terms:</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${notes}</p>
        </div>
      ` : ''}

      <!-- Contact & Action Footer -->
      <div style="border-top: 1px solid #e0deda; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <p style="margin: 0; font-weight: bold; font-size: 14px;">Neeraj Rawat</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b5c5c;">
            Direct WhatsApp / Phone: <a href="https://wa.me/918708167959" style="color: #1a1818; font-weight: bold; text-decoration: none;">+91 87081 67959</a><br>
            Website: <a href="https://neerajrawat.dev" style="color: #6b5c5c;">neerajrawat.dev</a>
          </p>
        </div>
        <div>
          <a href="https://wa.me/918708167959?text=${encodeURIComponent(`Hi Neeraj, I have reviewed Quotation #${quoteNumber || ''} for ${clientName}${clientCompany ? ' (' + clientCompany + ')' : ''} (${sym}${Number(grandTotal).toLocaleString('en-IN')}). Let's proceed.`)}" 
             style="display: inline-block; background: #25D366; color: #ffffff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">
            Accept &amp; Chat on WhatsApp →
          </a>
        </div>
      </div>
    </div>
  `;

  // Send Email using Nodemailer
  if (settings.smtpUser && settings.smtpPass) {
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
        cc: settings.smtpUser.trim(), // Keep Neeraj in CC for record
        replyTo: settings.smtpUser.trim(),
        subject: `📄 Project Quotation #${quoteNumber || 'QT'} for ${clientName}${clientCompany ? ' (' + clientCompany + ')' : ''} — Dhani Tech`,
        html: emailHtml
      });

      return res.status(200).json({
        success: true,
        message: `कोटेशन सफलतापूर्वक ${clientEmail.trim()} पर भेज दिया गया है (और आपकी ईमेल पर भी CC सुरक्षित है)!`,
        quoteNumber
      });
    } catch (err) {
      console.error('[Send Quote Email Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'कोटेशन ईमेल भेजने में विफलता: ' + err.message
      });
    }
  }

  return res.status(400).json({
    success: false,
    error: 'SMTP क्रेडेंशियल्स कॉन्फ़िगर नहीं हैं।'
  });
};
