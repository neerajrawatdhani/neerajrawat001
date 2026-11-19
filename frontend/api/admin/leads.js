const { loadLeads, updateLead, saveLeads } = require('../_leads');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dhani_super_admin_secure_key_9921';

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === ADMIN_SECRET;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: कृपया लॉगिन करें।' });
  }

  // GET: Fetch all leads and calculate summary metrics
  if (req.method === 'GET') {
    const leads = loadLeads();
    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      total: leads.length,
      newLeads: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      proposalSent: leads.filter(l => l.status === 'Proposal Sent').length,
      won: leads.filter(l => l.status === 'Won').length,
      lost: leads.filter(l => l.status === 'Lost').length,
      todayFollowUps: leads.filter(l => l.followUpDate === todayStr).length,
      conversionRate: leads.length ? Math.round((leads.filter(l => l.status === 'Won').length / leads.length) * 100) : 0,
      whatsappLeads: leads.filter(l => (l.channel || '').toLowerCase().includes('whatsapp')).length,
      emailLeads: leads.filter(l => (l.channel || '').toLowerCase().includes('email') || (l.channel || '').toLowerCase().includes('form')).length
    };

    return res.status(200).json({
      success: true,
      stats,
      leads
    });
  }

  // PATCH: Update lead status, notes, or followUpDate
  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { id, status, notes, followUpDate } = body;
    if (!id) return res.status(400).json({ success: false, error: 'Lead ID आवश्यक है।' });

    const updated = updateLead(id, {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { followUpDate })
    });

    if (!updated) return res.status(404).json({ success: false, error: 'Lead नहीं मिली।' });

    return res.status(200).json({ success: true, lead: updated });
  }

  // DELETE: Delete a lead
  if (req.method === 'DELETE') {
    const { id } = req.body || req.query || {};
    if (!id) return res.status(400).json({ success: false, error: 'Lead ID आवश्यक है।' });

    const leads = loadLeads().filter(l => l.id !== id);
    saveLeads(leads);

    return res.status(200).json({ success: true, message: 'Lead सफलतापूर्वक डिलीट कर दी गई।' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
