const { getSettings } = require('../_settings');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const settings = getSettings();
  const { password } = req.body || {};

  if (!password || password.trim() !== settings.adminPassword) {
    return res.status(401).json({ success: false, error: 'गलत पासवर्ड! कृपया सही पासवर्ड डालें।' });
  }

  // Return secure token
  return res.status(200).json({
    success: true,
    token: settings.adminSecret,
    user: {
      name: 'Neeraj Rawat',
      role: 'Super Admin',
      email: settings.adminEmail || 'neerajrawatdhani@gmail.com'
    }
  });
};
