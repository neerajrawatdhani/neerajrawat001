const fs = require('fs');

const SETTINGS_FILE = '/tmp/admin_settings.json';

let memorySettings = {
  // SMTP Configuration
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: process.env.SMTP_USER || 'neerajrawat001.bizz@gmail.com',
  smtpPass: process.env.SMTP_PASS || 'bkou vujw zshy bplp',
  adminEmail: process.env.ADMIN_EMAIL || 'neerajrawat001.bizz@gmail.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'neeraj@123',
  adminSecret: process.env.ADMIN_SECRET || 'dhani_super_admin_secure_key_9921',
  fromName: process.env.FROM_NAME || 'Neeraj Rawat | Dhani Tech',

  // Provider Rates (Per Year / Duration)
  providers: {
    hostinger: {
      name: 'Hostinger Cloud / Web Hosting',
      perMonth: 349,
      year1: 3499,
      year2: 3499,
      year3: 3499,
      specs: 'LiteSpeed Web Server, 100 GB NVMe Storage, 99.9% Uptime SLA'
    },
    vps: {
      name: 'Dedicated VPS Cloud Server (Hostinger / DigitalOcean)',
      perMonth: 799,
      year1: 8499,
      year2: 8499,
      year3: 8499,
      specs: '2 vCPU Cores, 4 GB RAM, 50 GB NVMe SSD, Dedicated IP'
    },
    domain: {
      name: 'Custom Domain Name (.com / .in / .dev)',
      perMonth: 0,
      year1: 999,
      year2: 1099,
      year3: 1199,
      specs: 'DNS Management, Free WHOIS Privacy & SSL'
    },
    mongodb: {
      name: 'Cloud Database (MongoDB Atlas / PostgreSQL)',
      perMonth: 499,
      year1: 5499,
      year2: 5499,
      year3: 5499,
      specs: 'Managed Replica Set, Automated Daily Backups, End-to-End Encryption'
    },
    email: {
      name: 'Business Email / Google Workspace',
      perMonth: 150,
      year1: 1800,
      year2: 1800,
      year3: 1800,
      specs: 'Custom domain email (info@yourbusiness.com), 30 GB Cloud Storage'
    }
  },

  // Data Scaling Tiers (डेटा स्केलिंग स्लैब्स)
  dataTiers: {
    starter: {
      name: 'Starter Tier (Up to 1 GB / 500 Students)',
      additionalCostPerYear: 0,
      desc: 'Base database included with project delivery'
    },
    growth: {
      name: 'Growth Tier (1 GB – 10 GB / 2,500 Students)',
      additionalCostPerYear: 4800,
      desc: 'Expanded storage cluster, automated point-in-time recovery & index optimization'
    },
    enterprise: {
      name: 'Enterprise Tier (10 GB – 50 GB+ / 10,000+ Students)',
      additionalCostPerYear: 12000,
      desc: 'Dedicated high-performance cluster, multi-region failover, 24/7 priority DB monitoring'
    }
  },

  // Base Developer Fees Presets
  devPresets: {
    schoolErp: { name: 'School ERP (EduDhani)', baseFee: 65000 },
    web: { name: 'Custom Full-Stack Web Application', baseFee: 45000 },
    uiux: { name: 'UI/UX Design & Interactive Prototypes', baseFee: 25000 },
    app: { name: 'iOS & Android Mobile App', baseFee: 85000 },
    graphic: { name: 'Graphic Design & Complete Brand Identity', baseFee: 20000 }
  },

  // Digital Products & Modular Add-ons Catalog
  digitalProducts: [
    {
      id: 'prod_app_module',
      name: 'Mobile App Module (Android / iOS for Parents & Staff)',
      price: 15000,
      type: 'One-Time Add-on',
      desc: 'Push notifications, fee payment, report cards & attendance'
    },
    {
      id: 'prod_wa_gateway',
      name: 'Automated WhatsApp & SMS Notification Engine',
      price: 6500,
      type: 'One-Time Setup',
      desc: 'Instant fee receipts, absent alerts & notices directly to parents\' WhatsApp'
    },
    {
      id: 'prod_pg',
      name: 'Razorpay / Cashfree Online Payment Gateway Integration',
      price: 4500,
      type: 'One-Time Setup',
      desc: 'Zero-commission direct settlement with UPI, cards, and netbanking'
    },
    {
      id: 'prod_amc',
      name: 'Annual Technical Maintenance & Priority Support (AMC)',
      price: 12000,
      type: 'Per Year',
      desc: 'Server health checks, software security updates, bug fixes, & on-call assistance'
    }
  ]
};

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      memorySettings = { ...memorySettings, ...saved };
    }
  } catch (e) {}
  return memorySettings;
}

function saveSettings(newSettings) {
  memorySettings = { ...memorySettings, ...newSettings };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(memorySettings, null, 2), 'utf8');
  } catch (e) {}
  return memorySettings;
}

module.exports = { getSettings, saveSettings };
