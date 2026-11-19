const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'neeraj@123';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dhani_super_admin_secure_key_9921';

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

  const { password } = req.body || {};

  if (!password || password.trim() !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'गलत पासवर्ड! कृपया सही पासवर्ड डालें।' });
  }

  // Return secure token
  return res.status(200).json({
    success: true,
    token: ADMIN_SECRET,
    user: {
      name: 'Neeraj Rawat',
      role: 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'neerajrawatdhani@gmail.com'
    }
  });
};
