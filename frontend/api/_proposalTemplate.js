const DEFAULT_MODULES = {
  website: true,
  customApi: false,
  whatsapp: true,
  hosting: true,
  database: true,
  domain: true,
  backups: true,
  dbComparison: true
};

const CURRENCIES = {
  INR: { code: 'INR', sym: '₹', locale: 'en-IN', label: 'INR (₹) — Indian Rupee' },
  USD: { code: 'USD', sym: '$', locale: 'en-US', label: 'USD ($) — US Dollar' },
  EUR: { code: 'EUR', sym: '€', locale: 'en-US', label: 'EUR (€) — Euro' },
  GBP: { code: 'GBP', sym: '£', locale: 'en-GB', label: 'GBP (£) — British Pound' },
  AED: { code: 'AED', sym: 'AED ', locale: 'en-US', label: 'AED — UAE Dirham' },
  SAR: { code: 'SAR', sym: 'SAR ', locale: 'en-US', label: 'SAR — Saudi Riyal' },
  AUD: { code: 'AUD', sym: 'A$', locale: 'en-US', label: 'AUD (A$) — Australian Dollar' },
  CAD: { code: 'CAD', sym: 'C$', locale: 'en-US', label: 'CAD (C$) — Canadian Dollar' },
  SGD: { code: 'SGD', sym: 'S$', locale: 'en-US', label: 'SGD (S$) — Singapore Dollar' },
  JPY: { code: 'JPY', sym: '¥', locale: 'en-US', label: 'JPY (¥) — Japanese Yen' },
  CHF: { code: 'CHF', sym: 'CHF ', locale: 'en-US', label: 'CHF — Swiss Franc' },
  QAR: { code: 'QAR', sym: 'QAR ', locale: 'en-US', label: 'QAR — Qatari Riyal' },
  KWD: { code: 'KWD', sym: 'KWD ', locale: 'en-US', label: 'KWD — Kuwaiti Dinar' },
  OMR: { code: 'OMR', sym: 'OMR ', locale: 'en-US', label: 'OMR — Omani Rial' },
  BHD: { code: 'BHD', sym: 'BHD ', locale: 'en-US', label: 'BHD — Bahraini Dinar' },
  MYR: { code: 'MYR', sym: 'RM ', locale: 'en-US', label: 'MYR (RM) — Malaysian Ringgit' },
  NZD: { code: 'NZD', sym: 'NZ$', locale: 'en-US', label: 'NZD (NZ$) — New Zealand Dollar' },
  CNY: { code: 'CNY', sym: '¥', locale: 'en-US', label: 'CNY (¥) — Chinese Yuan' },
  HKD: { code: 'HKD', sym: 'HK$', locale: 'en-US', label: 'HKD (HK$) — Hong Kong Dollar' },
  ZAR: { code: 'ZAR', sym: 'R ', locale: 'en-US', label: 'ZAR (R) — South African Rand' }
};

function getCurrencyMeta(code) {
  const key = String(code || 'INR').toUpperCase().trim();
  return CURRENCIES[key] || { code: key, sym: key + ' ', locale: 'en-US', label: key };
}

function fmtMoney(n, codeOrMeta) {
  const meta = typeof codeOrMeta === 'object' && codeOrMeta ? codeOrMeta : getCurrencyMeta(codeOrMeta);
  const val = Number(n) || 0;
  return meta.sym + val.toLocaleString(meta.locale || 'en-US');
}

const DB_PROVIDERS = {
  mongodb: {
    name: 'MongoDB Atlas Flex Database',
    company: 'MongoDB Inc.',
    tier: 'M0 Free -> Atlas Flex ($8-$30/mo)',
    bestFor: 'Flexible JSON schemas, catalogs, CRM & fast Node.js APIs'
  },
  supabase: {
    name: 'Supabase Managed PostgreSQL',
    company: 'Supabase Inc.',
    tier: 'Free Tier -> Pro ($25/mo+)',
    bestFor: 'Relational SQL apps, built-in Auth, Storage & Realtime subscriptions'
  },
  neon: {
    name: 'Neon Serverless Postgres',
    company: 'Neon / Databricks',
    tier: 'Free -> Launch ($19/mo+)',
    bestFor: 'Serverless Next.js/Vercel APIs with instant branching & autoscaling'
  },
  firebase: {
    name: 'Firebase Firestore Cloud DB',
    company: 'Google Cloud',
    tier: 'Spark Free -> Blaze Pay-as-you-go',
    bestFor: 'Mobile apps, live sync, push alerts & serverless backends'
  },
  aws_rds: {
    name: 'Managed MySQL / AWS RDS',
    company: 'Amazon Web Services / Hostinger',
    tier: 'Included in VPS or RDS (~$15-$50/mo)',
    bestFor: 'Traditional relational ERPs, billing & transactional reporting'
  }
};

const HOSTING_PROVIDERS = {
  hostinger: 'Hostinger Cloud / VPS Hosting',
  digitalocean: 'DigitalOcean Droplet / App Platform',
  aws: 'AWS EC2 / Lightsail Cloud Server',
  vercel: 'Vercel Pro Managed Edge & Functions',
  custom: 'Client-Managed Infrastructure'
};

const DOMAIN_PROVIDERS = {
  namecheap: 'Namecheap .com Registrar & DNS',
  cloudflare: 'Cloudflare Registrar & DNSSEC',
  godaddy: 'GoDaddy .com Domain & DNS',
  bigrock: 'BigRock / Accredited Registrar'
};

function escHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function normalizeCustomItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(it => it && String(it.label || '').trim())
    .map(it => ({
      label: String(it.label).trim(),
      billing: it.billing === 'annual' ? 'annual' : 'one-time',
      y1: Number(it.y1) || 0,
      y2: it.billing === 'annual' ? (Number(it.y2 ?? it.y1) || 0) : 0
    }));
}

function computeProposalMath(data) {
  const modules = { ...DEFAULT_MODULES, ...(data.modules || {}) };
  const cMeta = getCurrencyMeta(data.currency);
  const customItems = normalizeCustomItems(data.customItems);

  const webFee = modules.website ? (Number(data.websiteDevFee) || 0) : 0;
  const apiFee = modules.customApi ? (Number(data.apiIntegrationFee) || 0) : 0;
  const waFee = modules.whatsapp ? (Number(data.waIntegrationFee) || 0) : 0;

  const vpsY1 = modules.hosting ? (Number(data.vpsFee) || 0) : 0;
  const domY1 = modules.domain ? (Number(data.domainFee) || 0) : 0;
  const dbY1 = modules.database ? (Number(data.mongodbFee) || 0) : 0;
  const bakY1 = modules.backups ? (Number(data.backupFee) || 0) : 0;
  const waY1 = modules.whatsapp ? (Number(data.whatsappAllowance) || 0) : 0;

  const vpsRen = modules.hosting ? (Number(data.vpsRenewal ?? vpsY1) || 0) : 0;
  const domRen = modules.domain ? (Number(data.domainRenewal ?? domY1) || 0) : 0;
  const dbRen = modules.database ? (Number(data.mongodbRenewal ?? dbY1) || 0) : 0;
  const bakRen = modules.backups ? (Number(data.backupRenewal ?? bakY1) || 0) : 0;
  const waRen = modules.whatsapp ? (Number(data.whatsappRenewal ?? waY1) || 0) : 0;

  const customOneTime = customItems.filter(i => i.billing === 'one-time').reduce((s, i) => s + i.y1, 0);
  const customOpsY1 = customItems.filter(i => i.billing === 'annual').reduce((s, i) => s + i.y1, 0);
  const customRen = customItems.filter(i => i.billing === 'annual').reduce((s, i) => s + i.y2, 0);

  const totalOneTime = webFee + apiFee + waFee + customOneTime;
  const totalOperatingY1 = vpsY1 + domY1 + dbY1 + bakY1 + waY1 + customOpsY1;
  const grandTotalY1 = totalOneTime + totalOperatingY1;
  const grandTotalRenewal = vpsRen + domRen + dbRen + bakRen + waRen + customRen;

  return {
    modules,
    currency: cMeta.code,
    sym: cMeta.sym,
    currencyMeta: cMeta,
    customItems,
    webFee, apiFee, waFee,
    vpsY1, domY1, dbY1, bakY1, waY1,
    vpsRen, domRen, dbRen, bakRen, waRen,
    totalOneTime, totalOperatingY1, grandTotalY1, grandTotalRenewal
  };
}

function buildProposalEmailHtml(data) {
  const m = computeProposalMath(data);
  const { modules, currencyMeta, customItems } = m;
  const clientHeading = (data.clientCompany || data.clientName || 'Client').toUpperCase();
  const quoteDate = data.quoteDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const quoteRef = data.quoteNumber || data.id || 'DT-2026-001';

  const dbInfo = DB_PROVIDERS[data.dbProvider || 'mongodb'] || DB_PROVIDERS.mongodb;
  const dbBasisText = String(data.dbCustomTier || '').trim() || dbInfo.tier;
  const hostLabel = HOSTING_PROVIDERS[data.hostingProvider || 'hostinger'] || HOSTING_PROVIDERS.hostinger;
  const domainLabel = DOMAIN_PROVIDERS[data.domainProvider || 'namecheap'] || DOMAIN_PROVIDERS.namecheap;

  const enabledParts = [];
  if (modules.website) enabledParts.push('Website & Admin Dashboard');
  if (modules.customApi) enabledParts.push('REST / Third-Party API Integration');
  if (modules.whatsapp) enabledParts.push('WhatsApp Business API');
  if (modules.database) enabledParts.push(dbInfo.name);
  const subtitleText = `${enabledParts.join(' + ') || 'Custom Software Proposal'} | Annual Cost Proposal (${currencyMeta.code}) | ${quoteDate}`;

  const oneTimeRows = [];
  if (modules.website) oneTimeRows.push({ label: data.devTitle || 'Custom Website + Complete Admin CMS Dashboard', val: m.webFee });
  if (modules.customApi) oneTimeRows.push({ label: data.apiTitle || 'Custom REST APIs, Webhooks & Third-Party Service Integration', val: m.apiFee });
  if (modules.whatsapp) oneTimeRows.push({ label: 'WhatsApp Cloud API & Automated Webhook Integration Allowance', val: m.waFee });
  customItems.filter(i => i.billing === 'one-time').forEach(i => oneTimeRows.push({ label: i.label, val: i.y1 }));

  const operatingRows = [];
  if (modules.hosting) operatingRows.push({ label: hostLabel, y1: m.vpsY1, ren: m.vpsRen, basis: 'Estimated Year 1 (application + API)' });
  if (modules.domain) operatingRows.push({ label: domainLabel, y1: m.domY1, ren: m.domRen, basis: 'Estimated initial registration' });
  if (modules.database) operatingRows.push({ label: dbInfo.name, y1: m.dbY1, ren: m.dbRen, basis: dbBasisText });
  if (modules.backups) operatingRows.push({ label: 'Automated Cloud Backups / Object Storage', y1: m.bakY1, ren: m.bakRen, basis: 'Daily snapshot reserve' });
  if (modules.whatsapp) operatingRows.push({ label: 'Meta WhatsApp Messaging Allowance', y1: m.waY1, ren: m.waRen, basis: 'Direct Meta Cloud usage reserve' });
  customItems.filter(i => i.billing === 'annual').forEach(i => operatingRows.push({ label: i.label, y1: i.y1, ren: i.y2, basis: 'Custom annual service allowance' }));

  const renewalHeaders = [];
  if (modules.hosting) renewalHeaders.push({ label: 'Hosting / VPS', val: m.vpsRen });
  if (modules.domain) renewalHeaders.push({ label: 'Domain renewal', val: m.domRen });
  if (modules.database) renewalHeaders.push({ label: 'Database', val: m.dbRen });
  if (modules.backups) renewalHeaders.push({ label: 'Backups', val: m.bakRen });
  if (modules.whatsapp) renewalHeaders.push({ label: 'WhatsApp', val: m.waRen });
  customItems.filter(i => i.billing === 'annual').forEach(i => renewalHeaders.push({ label: i.label, val: i.y2 }));

  const dbCompanyRows = Object.entries(DB_PROVIDERS).map(([key, info], idx) => `
    <tr style="border-bottom:1px solid #e2e8f0; background:${key === (data.dbProvider || 'mongodb') ? '#edf2f7' : (idx % 2 === 1 ? '#f8fafc' : '#ffffff')};">
      <td style="padding:8px 12px; font-weight:700; color:#0f2843;">${escHtml(info.name)}${key === (data.dbProvider || 'mongodb') ? ' (Selected)' : ''}</td>
      <td style="padding:8px 12px; color:#334155;">${escHtml(info.company)}</td>
      <td style="padding:8px 12px; color:#0f2843; font-weight:600;">${escHtml(key === (data.dbProvider || 'mongodb') && data.dbCustomTier ? data.dbCustomTier : info.tier)}</td>
      <td style="padding:8px 12px; color:#475569;">${escHtml(info.bestFor)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:0 auto;padding:34px 28px;background:#ffffff;color:#1a202c;line-height:1.5;border:1px solid #cbd5e1;border-radius:10px;">
      <div style="border-bottom:2px solid #0f2843;padding-bottom:18px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#0f2843;letter-spacing:-0.01em;">${escHtml(clientHeading)}</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#475569;">${escHtml(subtitleText)}</p>
        </div>
        <div style="text-align:right;">
          <span style="display:inline-block;background:#0f2843;color:#ffffff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.04em;">ANNUAL COST PROPOSAL</span>
          <div style="margin-top:5px;font-size:13px;font-weight:700;color:#0f2843;">Quote #${escHtml(quoteRef)} (${escHtml(currencyMeta.code)})</div>
        </div>
      </div>

      <div style="margin-bottom:22px;">
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0f2843;">Project overview</h3>
        <p style="margin:0;font-size:13px;color:#334155;">
          Modular architecture and annual budget proposal prepared for <strong>${escHtml(data.clientCompany || data.clientName)}</strong> covering ${escHtml(enabledParts.join(', '))}. All quoted prices are stated in <strong>${escHtml(currencyMeta.code)} (${escHtml(currencyMeta.sym.trim())})</strong>.
        </p>
      </div>

      ${oneTimeRows.length ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">1. One-time development &amp; integration</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1;margin-bottom:10px;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;text-align:left;">
              <th style="padding:10px 14px;">Deliverable</th>
              <th style="padding:10px 14px;text-align:right;width:160px;">One-time charge</th>
            </tr>
          </thead>
          <tbody>
            ${oneTimeRows.map((r, i) => `
              <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                <td style="padding:9px 14px;">${escHtml(r.label)}</td>
                <td style="padding:9px 14px;text-align:right;font-weight:700;">${fmtMoney(r.val, currencyMeta)}</td>
              </tr>
            `).join('')}
            <tr style="background:#ffffff;font-weight:800;border-top:2px solid #0f2843;">
              <td style="padding:10px 14px;">Total one-time implementation investment</td>
              <td style="padding:10px 14px;text-align:right;color:#0f2843;font-size:15px;">${fmtMoney(m.totalOneTime, currencyMeta)}</td>
            </tr>
          </tbody>
        </table>
        ${modules.website ? `<p style="font-size:11.5px;color:#475569;margin:4px 0;"><strong>Included scope:</strong> ${escHtml(data.devDesc || 'Responsive UI/UX, Admin CMS, secure server APIs & production deployment.')}</p>` : ''}
        ${modules.customApi ? `<p style="font-size:11.5px;color:#475569;margin:4px 0;"><strong>API &amp; integration scope:</strong> ${escHtml(data.apiDesc || 'REST API endpoints, webhook handlers, payment gateway / third-party service connectors, authentication & error logging.')}</p>` : ''}
        ${modules.whatsapp ? `<p style="font-size:11.5px;color:#475569;margin:4px 0;"><strong>WhatsApp integration scope:</strong> Meta business setup assistance, approved template integration, automated enquiry acknowledgements, webhook status logging &amp; admin dispatch view.</p>` : ''}
      </div>
      ` : ''}

      ${operatingRows.length ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">2. First-year annual operating budget</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;text-align:left;">
              <th style="padding:10px 14px;">Cost component</th>
              <th style="padding:10px 14px;width:150px;">Annual allowance</th>
              <th style="padding:10px 14px;">Basis &amp; Provider</th>
            </tr>
          </thead>
          <tbody>
            ${operatingRows.map((r, i) => `
              <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                <td style="padding:9px 14px;">${escHtml(r.label)}</td>
                <td style="padding:9px 14px;font-weight:700;">${fmtMoney(r.y1, currencyMeta)}</td>
                <td style="padding:9px 14px;color:#64748b;font-size:12px;">${escHtml(r.basis)}</td>
              </tr>
            `).join('')}
            <tr style="background:#f1f5f9;font-weight:700;border-top:1px solid #cbd5e1;">
              <td style="padding:10px 14px;">Total first-year operating cost</td>
              <td style="padding:10px 14px;color:#0f2843;">${fmtMoney(m.totalOperatingY1, currencyMeta)}</td>
              <td style="padding:10px 14px;color:#64748b;font-size:12px;">Before applicable taxes / optional SaaS add-ons</td>
            </tr>
            <tr style="background:#e2e8f0;font-weight:800;border-top:2px solid #0f2843;">
              <td style="padding:11px 14px;font-size:14px;">First-year project total</td>
              <td style="padding:11px 14px;font-size:16px;color:#0f2843;">${fmtMoney(m.grandTotalY1, currencyMeta)}</td>
              <td style="padding:11px 14px;color:#0f2843;font-size:12px;">${fmtMoney(m.totalOneTime, currencyMeta)} implementation + ${fmtMoney(m.totalOperatingY1, currencyMeta)} running</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      ${renewalHeaders.length ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">3. Second-year onward — annual renewal</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1;text-align:center;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;">
              ${renewalHeaders.map(h => `<th style="padding:10px 8px;">${escHtml(h.label)}</th>`).join('')}
              <th style="padding:10px 8px;background:#1e3a5f;">Total/year</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#ffffff;font-weight:700;">
              ${renewalHeaders.map(h => `<td style="padding:11px 8px;">${fmtMoney(h.val, currencyMeta)}</td>`).join('')}
              <td style="padding:11px 8px;font-size:15px;color:#0f2843;background:#f8fafc;">${fmtMoney(m.grandTotalRenewal, currencyMeta)}</td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:11.5px;color:#475569;margin:8px 0 0;">One-time implementation fees (${fmtMoney(m.totalOneTime, currencyMeta)}) are <strong>not repeated</strong> in renewal years.</p>
      </div>
      ` : ''}

      ${modules.whatsapp ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">4. WhatsApp Business API — Meta official rate index (India base rates)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid #cbd5e1;margin-bottom:14px;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;text-align:left;">
              <th style="padding:9px 12px;">Message category</th>
              <th style="padding:9px 12px;width:190px;">Meta rate / delivered message</th>
              <th style="padding:9px 12px;">Common business use</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;font-weight:700;">Utility</td><td style="padding:8px 12px;font-weight:700;">₹0.1150 (or regional Meta tariff)</td><td style="padding:8px 12px;color:#475569;">Operational updates / receipts / reminders</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;"><td style="padding:8px 12px;font-weight:700;">Authentication</td><td style="padding:8px 12px;font-weight:700;">₹0.1150</td><td style="padding:8px 12px;color:#475569;">OTP / verification codes</td></tr>
            <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:8px 12px;font-weight:700;">Marketing</td><td style="padding:8px 12px;font-weight:700;">₹0.8631</td><td style="padding:8px 12px;color:#475569;">Promotional campaigns / announcements</td></tr>
            <tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:700;">Service reply</td><td style="padding:8px 12px;font-weight:700;">₹0.1150 after free allowance</td><td style="padding:8px 12px;color:#475569;">Replies to incoming customer chats</td></tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      ${(modules.database && modules.dbComparison) ? `
      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">Supported Database Providers &amp; Cloud Companies</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #cbd5e1;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;text-align:left;">
              <th style="padding:9px 12px;">Database Platform</th>
              <th style="padding:9px 12px;">Company / Vendor</th>
              <th style="padding:9px 12px;">Typical Cloud Tiers</th>
              <th style="padding:9px 12px;">Recommended Use Case</th>
            </tr>
          </thead>
          <tbody>${dbCompanyRows}</tbody>
        </table>
      </div>
      ` : ''}

      <div style="margin-bottom:24px;">
        <h3 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f2843;">Commercial Summary (${escHtml(currencyMeta.code)})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1;">
          <thead>
            <tr style="background:#0f2843;color:#ffffff;text-align:left;">
              <th style="padding:10px 14px;width:140px;">Period</th>
              <th style="padding:10px 14px;width:160px;">Estimate (${escHtml(currencyMeta.code)})</th>
              <th style="padding:10px 14px;">Composition</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;background:#ffffff;">
              <td style="padding:10px 14px;font-weight:700;">Year 1 Total</td>
              <td style="padding:10px 14px;font-weight:800;font-size:15px;color:#0f2843;">${fmtMoney(m.grandTotalY1, currencyMeta)}</td>
              <td style="padding:10px 14px;color:#334155;">Implementation ${fmtMoney(m.totalOneTime, currencyMeta)} + Annual infrastructure &amp; usage ${fmtMoney(m.totalOperatingY1, currencyMeta)}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;background:#f8fafc;">
              <td style="padding:10px 14px;font-weight:700;">Year 2 Onward</td>
              <td style="padding:10px 14px;font-weight:800;font-size:15px;color:#0f2843;">${fmtMoney(m.grandTotalRenewal, currencyMeta)} / year</td>
              <td style="padding:10px 14px;color:#334155;">Recurring infrastructure &amp; annual services</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:700;">Higher Scale</td>
              <td style="padding:10px 14px;font-weight:700;color:#64748b;">Variable</td>
              <td style="padding:10px 14px;color:#64748b;">Resource tier upgrades based on traffic, DB storage &amp; messaging volume</td>
            </tr>
          </tbody>
        </table>
        ${data.customNotes ? `<p style="font-size:12px;color:#334155;margin:10px 0 0;"><strong>Additional Notes / Terms:</strong> ${escHtml(data.customNotes)}</p>` : ''}
      </div>

      <div style="border-top:2px solid #0f2843;padding-top:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="margin:0;font-weight:800;font-size:15px;color:#0f2843;">Neeraj Rawat</p>
          <p style="margin:2px 0 0;font-size:12px;color:#475569;">
            Dhani Tech · Direct WhatsApp / Call: <a href="https://wa.me/918708167959" style="color:#0f2843;font-weight:700;text-decoration:none;">+91 87081 67959</a><br>
            Portfolio &amp; Studio: <a href="https://neerajrawat.dev" style="color:#2563eb;text-decoration:none;">neerajrawat.dev</a>
          </p>
        </div>
        <div>
          <a href="https://wa.me/918708167959?text=${encodeURIComponent(`Hi Neeraj, I have reviewed Commercial Proposal #${quoteRef} (${fmtMoney(m.grandTotalY1, currencyMeta)} Year 1 / ${fmtMoney(m.grandTotalRenewal, currencyMeta)} renewal). Let's proceed.`)}" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 18px;border-radius:7px;text-decoration:none;font-size:13px;font-weight:700;">
            Approve &amp; Discuss on WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;
}

module.exports = {
  DEFAULT_MODULES,
  CURRENCIES,
  getCurrencyMeta,
  fmtMoney,
  DB_PROVIDERS,
  HOSTING_PROVIDERS,
  DOMAIN_PROVIDERS,
  computeProposalMath,
  buildProposalEmailHtml
};
