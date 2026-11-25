const fs = require('fs');
const crypto = require('crypto');

const SETTINGS_FILE = '/tmp/admin_settings.json';

function computeFallbackSecret() {
  return crypto
    .createHash('sha256')
    .update(`dhani-studio:${process.env.ADMIN_EMAIL || 'admin'}:${process.env.ADMIN_PASSWORD || 'nr-studio'}`)
    .digest('hex');
}

let memorySettings = {
  // SMTP Configuration
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.MAIL_USER || '').trim(),
  smtpPass: (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS || '').trim(),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminEmail: (process.env.ADMIN_EMAIL || 'neerajrawat001.biz@gmail.com').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminSecret: process.env.ADMIN_SECRET || computeFallbackSecret(),
  fromEmail: (process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim(),
  fromName: process.env.FROM_NAME || 'Neeraj Rawat | Dhani Tech',

  // Annual Operating Costs (As per Official Gurukulam Proposal PDF)
  operatingCosts: {
    vps: {
      name: 'VPS Hosting (Application + API Backend)',
      year1: 12000,
      year2Renewal: 15000,
      basis: 'Estimated Year 1 (Renewal ₹15,000/yr)'
    },
    domain: {
      name: '.com Domain Registration & DNS',
      year1: 1800,
      year2Renewal: 2200,
      basis: 'Initial registration ₹1,800 (Renewal ₹2,200/yr)'
    },
    mongodb: {
      name: 'MongoDB Atlas Flex Database',
      year1: 10000,
      year2Renewal: 10000,
      basis: 'Low-usage planning budget (~$8-$30/mo)'
    },
    backupStorage: {
      name: 'Cloud Backup / Object Storage',
      year1: 3000,
      year2Renewal: 3000,
      basis: 'Budget reserve for automated daily snapshots'
    },
    whatsappMessaging: {
      name: 'Meta WhatsApp Messaging Allowance',
      year1: 3500,
      year2Renewal: 3500,
      basis: 'Direct Meta usage allowance (~1,000 utility + 200 marketing/mo)'
    }
  },

  // One-time Implementation Items (PDF Section 1)
  implementationItems: {
    websiteCms: {
      name: 'School Website + Complete Admin Content-Management Dashboard',
      fee: 50000,
      scope: 'Home, About, Admissions, Academics, Facilities, Gallery, News/Notices, Events, Contact, Responsive UI, Enquiry forms, SEO basics, Admin login, Content & gallery management.'
    },
    whatsappIntegration: {
      name: 'WhatsApp Cloud API Integration Allowance (Additional)',
      fee: 8000,
      scope: 'Meta business setup assistance, approved-template integration, admissions enquiry acknowledgement, server-side API calls, delivery webhooks, error logging.'
    }
  },

  // Infrastructure Scaling Budget Bands (PDF Section 7)
  scalingBands: [
    { scenario: 'Starting', vps: '₹12k–15k', mongodb: '₹9k–12k', domainStorage: '₹4k–6k', total: '₹25k–33k' },
    { scenario: 'Growing', vps: '₹15k–30k', mongodb: '₹12k–36k', domainStorage: '₹5k–12k', total: '₹32k–78k' },
    { scenario: 'High Usage', vps: '₹30k–60k+', mongodb: '₹65k–90k+', domainStorage: '₹8k–25k+', total: '₹103k–175k+' }
  ],

  // Meta Pricing for India (PDF Section 4)
  metaPricingIndia: {
    utility: 0.1150,
    authentication: 0.1150,
    marketing: 0.8631,
    serviceReply: 0.1150
  },

  // Payment Gateway Configuration (Test & Live API Keys + UPI)
  paymentGateway: {
    mode: process.env.PAYMENT_MODE || 'test',
    testKeyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || '',
    testKeySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || '',
    liveKeyId: process.env.RAZORPAY_LIVE_KEY_ID || '',
    liveKeySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || '',
    upiId: process.env.UPI_ID || '8708167959@paytm',
    upiName: process.env.UPI_NAME || 'Neeraj Rawat | Dhani Tech'
  }
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      const merged = { ...memorySettings, ...data };
      if (!merged.adminSecret) merged.adminSecret = memorySettings.adminSecret || computeFallbackSecret();
      return merged;
    }
  } catch (e) {}
  if (!memorySettings.adminSecret) memorySettings.adminSecret = computeFallbackSecret();
  return memorySettings;
}

function saveSettings(updates) {
  memorySettings = { ...memorySettings, ...updates };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(memorySettings, null, 2), 'utf8');
  } catch (e) {}
  return memorySettings;
}

module.exports = { getSettings, saveSettings };
