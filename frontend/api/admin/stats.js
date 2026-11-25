const fs = require('fs');
const path = require('path');
const { loadLeads } = require('../_leads');
const { loadProducts } = require('../_products');
const { checkAdminAuth } = require('../_mailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const leads = loadLeads();
  const products = loadProducts();
  let quotations = [];
  for (const qPath of ['/tmp/quotations.json', path.resolve(__dirname, '..', '..', 'backend', 'data', 'quotations.json')]) {
    try {
      if (fs.existsSync(qPath)) {
        const parsed = JSON.parse(fs.readFileSync(qPath, 'utf8'));
        if (Array.isArray(parsed)) { quotations = parsed; break; }
      }
    } catch (e) {}
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const parseAmount = (raw) => {
    const parts = String(raw || '').match(/\d[\d,]*/g);
    return parts && parts.length ? (parseInt(parts[0].replace(/,/g, ''), 10) || 0) : 0;
  };

  const totalWonRevenue = leads
    .filter(l => l.status === 'Won')
    .reduce((sum, l) => sum + (parseAmount(l.budget) || 0), 0);

  const openPipelineValue = leads
    .filter(l => l.status !== 'Lost')
    .reduce((sum, l) => sum + parseAmount(l.budget), 0);

  const stats = {
    totalInquiries: leads.length,
    totalProducts: products.length,
    totalQuotations: quotations.length,
    wonCount: leads.filter(l => l.status === 'Won').length,
    conversionRate: leads.length ? ((leads.filter(l => l.status === 'Won').length / leads.length) * 100).toFixed(1) + '%' : '0%',
    activePipelineValue: '₹' + (openPipelineValue || totalWonRevenue).toLocaleString('en-IN'),
    wonRevenue: '₹' + totalWonRevenue.toLocaleString('en-IN'),
    todayFollowUps: leads.filter(l => l.followUpDate === todayStr).length
  };

  return res.status(200).json({ success: true, stats });
};
