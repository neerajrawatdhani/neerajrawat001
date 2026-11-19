const fs = require('fs');

const TMP_FILE = '/tmp/leads.json';

let memoryLeads = [
  {
    id: 'inq_1732029600000_dps',
    name: 'Vikas Gupta',
    mobile: '+91 98765 43210',
    email: 'vikas.gupta@dpsschool.in',
    company: 'DPS International',
    service: 'School ERP (EduDhani)',
    budget: '₹85,000',
    message: 'We are looking for a complete School ERP for our 1200+ students school. Need live demo this week.',
    status: 'New',
    followUpDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Inquiry received via website. Ready for ERP demo on Friday.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029500000_fintech',
    name: 'Neha Kapoor',
    mobile: '+91 98111 22334',
    email: 'neha@kapurfintech.io',
    company: 'Kapur FinTech',
    service: 'UI/UX & Web Development',
    budget: '₹55,000',
    message: 'Need a sleek modern landing page and dashboard UI redesign for our investment platform.',
    status: 'Contacted',
    followUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Discussed requirements on phone. Sent portfolio links. Following up tomorrow.',
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029400000_arcade',
    name: 'Rahul Mehta',
    mobile: '+91 99887 76655',
    email: 'rahul.mehta@gamecraft.dev',
    company: 'GameCraft Studios',
    service: 'iOS App Development',
    budget: '₹1,20,000',
    message: 'Looking for a native iOS game/app with smooth 60fps animations and in-app purchases.',
    status: 'Proposal Sent',
    followUpDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Shared milestone estimate and scope document. Waiting for budget sign-off.',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029300000_brand',
    name: 'Sumit Rao',
    mobile: '+91 91234 56789',
    email: 'sumit@raologistics.com',
    company: 'Rao Logistics',
    service: 'Graphic Design & Brand Identity',
    budget: '₹30,000',
    message: 'Complete corporate identity kit: logo, letterheads, social media kits and brochures.',
    status: 'Won',
    followUpDate: '',
    notes: 'Advance received ₹15,000. Project started.',
    timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
  }
];

function loadLeads() {
  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
      if (Array.isArray(data) && data.length) return data;
    }
  } catch (e) {}
  return memoryLeads;
}

function saveLeads(leads) {
  memoryLeads = leads;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {}
}

function addLead(lead) {
  const leads = loadLeads();
  leads.unshift(lead);
  saveLeads(leads);
  return lead;
}

function updateLead(id, updates) {
  const leads = loadLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx !== -1) {
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLeads(leads);
    return leads[idx];
  }
  return null;
}

module.exports = { loadLeads, saveLeads, addLead, updateLead };
