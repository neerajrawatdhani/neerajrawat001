const fs = require('fs');
const path = require('path');

const TMP_FILE = '/tmp/leads.json';
const BACKEND_INQ_FILE = path.resolve(__dirname, '..', 'backend', 'data', 'inquiries.json');

let memoryLeads = [
  {
    id: 'inq_1732029600000_dps',
    name: 'Vikas Gupta',
    country: '🇮🇳 India (+91)',
    countryCode: 'IN',
    mobile: '+91 98765 43210',
    email: 'vikas.gupta@dpsschool.in',
    company: 'DPS International',
    channel: 'WhatsApp',
    service: 'School ERP (EduDhani)',
    budget: '₹50,000 – ₹1,00,000',
    message: 'We are looking for a complete School ERP for our 1200+ students school. Need live demo this week.',
    status: 'New',
    followUpDate: new Date(Date.now() + 4 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Inquiry received via WhatsApp. Ready for ERP demo on Friday.',
    consent: true,
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029500000_fintech',
    name: 'Neha Kapoor',
    country: '🇮🇳 India (+91)',
    countryCode: 'IN',
    mobile: '+91 98111 22334',
    email: 'neha@kapurfintech.io',
    company: 'Kapur FinTech',
    channel: 'Email',
    service: 'UI/UX & Web Development',
    budget: '₹50,000 – ₹1,00,000',
    message: 'Need a sleek modern landing page and dashboard UI redesign for our investment platform.',
    status: 'Contacted',
    followUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Discussed requirements on phone. Sent portfolio links. Following up tomorrow.',
    consent: true,
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029400000_arcade',
    name: 'Sarah Jenkins',
    country: '🇦🇪 UAE (+971)',
    countryCode: 'AE',
    mobile: '+971 50 123 4567',
    email: 'sarah.j@dubaimedia.ae',
    company: 'Dubai Media Hub',
    channel: 'WhatsApp',
    service: 'iOS & Mobile App Development',
    budget: '₹1,00,000 – ₹2,50,000',
    message: 'Looking for a native mobile application with smooth 60fps animations and custom dashboard.',
    status: 'Proposal Sent',
    followUpDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
    notes: 'Shared milestone estimate and scope document. Waiting for budget sign-off.',
    consent: true,
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 'inq_1732029300000_brand',
    name: 'Sumit Rao',
    country: '🇮🇳 India (+91)',
    countryCode: 'IN',
    mobile: '+91 91234 56789',
    email: 'sumit@raologistics.com',
    company: 'Rao Logistics',
    channel: 'Email',
    service: 'Graphic Design & Brand Identity',
    budget: '₹25,000 – ₹50,000',
    message: 'Complete corporate identity kit: logo, letterheads, social media kits and brochures.',
    status: 'Won',
    followUpDate: '',
    notes: 'Advance received ₹15,000. Project started.',
    consent: true,
    timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
  }
];

function getStorageFile() {
  if (fs.existsSync(BACKEND_INQ_FILE)) return BACKEND_INQ_FILE;
  if (fs.existsSync(TMP_FILE)) return TMP_FILE;
  return null;
}

function loadLeads() {
  try {
    const file = getStorageFile();
    if (file) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data) && data.length) return data;
    }
  } catch (e) {}
  return memoryLeads;
}

function saveLeads(leads) {
  memoryLeads = leads;
  try {
    const file = getStorageFile() || TMP_FILE;
    fs.writeFileSync(file, JSON.stringify(leads, null, 2), 'utf8');
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
  const idx = leads.findIndex(l => String(l.id) === String(id));
  if (idx !== -1) {
    leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLeads(leads);
    return leads[idx];
  }
  return null;
}

module.exports = { loadLeads, saveLeads, addLead, updateLead };
