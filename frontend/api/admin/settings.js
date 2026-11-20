const nodemailer = require('nodemailer');
const { getSettings, saveSettings } = require('../_settings');

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const settings = getSettings();
  return token === settings.adminSecret;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: कृपया लॉगिन करें।' });
  }

  const settings = getSettings();

  // GET: Fetch current settings (masking password)
  if (req.method === 'GET') {
    const pass = settings.smtpPass || '';
    const maskedPass = pass.length > 4 ? `${pass.slice(0, 4)} **** **** ${pass.slice(-4)}` : '••••••••••••';
    return res.status(200).json({
      success: true,
      settings: {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpUser: settings.smtpUser,
        smtpPassMasked: maskedPass,
        isConfigured: Boolean(settings.smtpUser && settings.smtpPass),
        adminEmail: settings.adminEmail,
        fromName: settings.fromName,
        providers: settings.providers,
        dataTiers: settings.dataTiers,
        digitalProducts: settings.digitalProducts,
        devPresets: settings.devPresets
      }
    });
  }

  // POST: Either test SMTP or save settings
  if (req.method === 'POST' || req.method === 'PATCH') {
    const body = req.body || {};

    // 1. Test SMTP Connection & Send Test Email
    if (body.action === 'test') {
      const testUser = body.smtpUser || settings.smtpUser;
      const testPass = body.smtpPass || settings.smtpPass;
      const testTo = body.adminEmail || settings.adminEmail || testUser;

      if (!testUser || !testPass) {
        return res.status(400).json({
          success: false,
          error: 'Gmail Address और App Password दोनों आवश्यक हैं।'
        });
      }

      try {
        const testTransporter = nodemailer.createTransport({
          host: settings.smtpHost || 'smtp.gmail.com',
          port: parseInt(settings.smtpPort || '465', 10),
          secure: settings.smtpSecure !== false,
          auth: {
            user: testUser.trim(),
            pass: testPass.trim()
          }
        });

        // Verify connection
        await testTransporter.verify();

        // Send a test email
        await testTransporter.sendMail({
          from: `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${testUser.trim()}>`,
          to: testTo.trim(),
          subject: '✅ Gmail SMTP Connection Verified — Super Admin Panel',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #d5cdca; border-radius: 12px; background: #faf9f6;">
              <h2 style="color: #1a1818; margin-top: 0;">🎉 Gmail SMTP Successfully Connected!</h2>
              <p>आपका Gmail SMTP और ऐप पासवर्ड बिल्कुल सही तरीके से काम कर रहा है।</p>
              <div style="background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid #e0deda; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Sender Account:</strong> ${testUser.trim()}</p>
                <p style="margin: 4px 0;"><strong>Recipient:</strong> ${testTo.trim()}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> Active &amp; Verified</p>
                <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <p style="color: #6b5c5c; font-size: 13px;">अब वेबसाइट पर जब भी कोई क्लाइंट कांटेक्ट फॉर्म भरेगा, तो तुरंत आपके ईमेल पर नोटिफिकेशन आ जाएगा।</p>
            </div>
          `
        });

        return res.status(200).json({
          success: true,
          message: `टेस्ट ईमेल सफलतापूर्वक ${testTo.trim()} पर भेजा गया!`
        });
      } catch (err) {
        console.error('[SMTP Test Error]:', err.message);
        let errorMsg = err.message;
        if (err.message.includes('Username and Password not accepted') || err.message.includes('BadCredentials')) {
          errorMsg = 'गलत Gmail ID या App Password! कृपया Google Account से 16-अक्षरों का नया App Password जनरेट करके डालें।';
        }
        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      }
    }

    // 2. Save Updated Settings
    const updates = {};
    if (body.smtpUser) updates.smtpUser = body.smtpUser.trim();
    if (body.smtpPass) updates.smtpPass = body.smtpPass.trim();
    if (body.adminEmail) updates.adminEmail = body.adminEmail.trim();
    if (body.fromName) updates.fromName = body.fromName.trim();
    if (body.adminPassword) updates.adminPassword = body.adminPassword.trim();
    if (body.providers) updates.providers = body.providers;
    if (body.dataTiers) updates.dataTiers = body.dataTiers;
    if (body.digitalProducts) updates.digitalProducts = body.digitalProducts;
    if (body.devPresets) updates.devPresets = body.devPresets;

    saveSettings(updates);

    return res.status(200).json({
      success: true,
      message: 'सेटिंग्स सफलतापूर्वक सेव हो गईं!',
      settings: updates
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
