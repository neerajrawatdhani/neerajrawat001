const fs = require('fs');

const SETTINGS_FILE = '/tmp/admin_settings.json';

let memorySettings = {
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: process.env.SMTP_USER || 'neerajrawat001.bizz@gmail.com',
  smtpPass: process.env.SMTP_PASS || 'bkou vujw zshy bplp',
  adminEmail: process.env.ADMIN_EMAIL || 'neerajrawat001.bizz@gmail.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'neeraj@123',
  adminSecret: process.env.ADMIN_SECRET || 'dhani_super_admin_secure_key_9921',
  fromName: process.env.FROM_NAME || 'Neeraj Rawat | Dhani Tech'
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
