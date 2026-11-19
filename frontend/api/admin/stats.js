const { loadLeads } = require('../_leads');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dhani_super_admin_secure_key_9921';

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === ADMIN_SECRET;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const leads = loadLeads();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalWonRevenue = leads
    .filter(l => l.status === 'Won')
    .reduce((sum, l) => {
      const match = (l.budget || '').replace(/[^0-9]/g, '');
      return sum + (parseInt(match, 10) || 25000);
    }, 0);

  const stats = {
    totalTraffic: 4850,
    uniqueVisitors: 3240,
    totalInquiries: leads.length,
    conversionRate: leads.length ? ((leads.filter(l => l.status === 'Won').length / leads.length) * 100).toFixed(1) + '%' : '0%',
    activePipelineValue: '₹' + totalWonRevenue.toLocaleString('en-IN'),
    todayFollowUps: leads.filter(l => l.followUpDate === todayStr).length,
    breakdownByService: {
      'School ERP (EduDhani)': leads.filter(l => (l.service || '').includes('ERP')).length,
      'Web Development': leads.filter(l => (l.service || '').includes('Web')).length,
      'UI/UX Design': leads.filter(l => (l.service || '').includes('UI/UX')).length,
      'iOS App Development': leads.filter(l => (l.service || '').includes('App')).length,
      'Graphic Design': leads.filter(l => (l.service || '').includes('Graphic')).length
    }
  };

  return res.status(200).json({ success: true, stats });
};
