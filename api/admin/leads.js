const { loadLeads, addLead, updateLead, saveLeads } = require('../_leads');
const { getSettings } = require('../_settings');

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

  // GET: Fetch all leads and computed summary metrics
  if (req.method === 'GET') {
    const leads = loadLeads();
    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      total: leads.length,
      newLeads: leads.filter(l => l.status === 'New').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      demo: leads.filter(l => l.status === 'Demo').length,
      proposalSent: leads.filter(l => l.status === 'Proposal Sent' || l.status === 'Quotation Sent').length,
      won: leads.filter(l => l.status === 'Won').length,
      lost: leads.filter(l => l.status === 'Lost').length,
      todayFollowUps: leads.filter(l => l.followUpDate === todayStr || l.followUpDate === 'Today').length,
      conversionRate: leads.length ? Math.round((leads.filter(l => l.status === 'Won').length / leads.length) * 100) : 0,
      whatsappLeads: leads.filter(l => (l.channel || '').toLowerCase().includes('whatsapp')).length,
      emailLeads: leads.filter(l => (l.channel || '').toLowerCase().includes('email') || (l.channel || '').toLowerCase().includes('form') || (l.channel || '').toLowerCase().includes('studio')).length
    };

    return res.status(200).json({ success: true, stats, leads });
  }

  // POST: Add a new manual lead from Admin Console
  if (req.method === 'POST') {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'Client name is required.' });

    const newLead = addLead({
      id: b.id || ('inq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      timestamp: new Date().toISOString(),
      channel: String(b.channel || b.source || 'Direct Call').trim(),
      name,
      company: String(b.company || '').trim(),
      country: String(b.country || 'India (+91)').trim(),
      countryCode: String(b.countryCode || 'IN').trim(),
      mobile: String(b.mobile || b.phone || '').trim(),
      email: String(b.email || '').trim(),
      service: String(b.service || 'Web & Custom Solutions').trim(),
      timeline: String(b.timeline || '').trim(),
      budget: String(b.budget || 'Flexible / To be discussed').trim(),
      message: String(b.message || b.notes || '').trim(),
      status: String(b.status || 'New').trim(),
      followUpDate: String(b.followUpDate || new Date().toISOString().split('T')[0]).trim(),
      notes: String(b.notes || 'Created from Super Admin console.').trim(),
      consent: true
    });

    return res.status(201).json({ success: true, lead: newLead });
  }

  // PATCH: Update lead fields
  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { id, status, notes, followUpDate, company, service, budget, mobile, email } = body;
    if (!id) return res.status(400).json({ success: false, error: 'Lead ID is required.' });

    const updated = updateLead(id, {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { followUpDate }),
      ...(company !== undefined && { company }),
      ...(service !== undefined && { service }),
      ...(budget !== undefined && { budget }),
      ...(mobile !== undefined && { mobile }),
      ...(email !== undefined && { email })
    });

    if (!updated) return res.status(404).json({ success: false, error: 'Lead not found.' });

    return res.status(200).json({ success: true, lead: updated });
  }

  // DELETE: Delete a lead or clear all leads when clearAll=true
  if (req.method === 'DELETE') {
    const body = req.body || {};
    const urlParams = new URL(req.url, 'http://localhost').searchParams;
    const id = body.id || urlParams.get('id');
    const clearAll = body.clearAll === true || urlParams.get('clearAll') === 'true';

    if (clearAll) {
      saveLeads([]);
      return res.status(200).json({ success: true, message: 'All leads cleared.', leads: [] });
    }
    if (!id) return res.status(400).json({ success: false, error: 'Lead ID is required.' });

    const leads = loadLeads().filter(l => String(l.id) !== String(id));
    saveLeads(leads);

    return res.status(200).json({ success: true, message: 'Lead deleted.', id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
