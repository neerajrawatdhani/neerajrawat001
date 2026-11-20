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
  const { password, email } = req.body || {};
  const pass = (password || '').trim();

  // Accept current configured password OR default backup 'neeraj@123'
  const isPassValid = Boolean(pass && (pass === (settings.adminPassword || '').trim() || pass === 'neeraj@123'));

  if (!isPassValid) {
    return res.status(401).json({
      success: false,
      error: 'गलत पासवर्ड! कृपया सही पासवर्ड डालें या नीचे "Forgot Password?" पर क्लिक करके नया पासवर्ड सेट करें।'
    });
  }

  // Return secure token and admin info
  return res.status(200).json({
    success: true,
    token: settings.adminSecret,
    user: {
      name: 'Neeraj Rawat',
      role: 'Super Admin',
      email: email || settings.adminEmail || 'neerajrawat001.bizz@gmail.com'
    }
  });
};
