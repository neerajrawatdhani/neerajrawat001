const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getSettings, saveSettings } = require('../_settings');

const ALLOWED_ADMIN_EMAILS = [
  'neerajrawat001.bizz@gmail.com',
  'neerajrawatdhani@gmail.com'
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, otp, newPassword, resetToken } = req.body || {};
  const settings = getSettings();
  const configuredAdminEmail = (settings.adminEmail || 'neerajrawat001.bizz@gmail.com').toLowerCase().trim();

  // ==========================================
  // 1. STEP 1: REQUEST OTP (Verify Email & Send OTP)
  // ==========================================
  if (action === 'request-otp') {
    const inputEmail = (email || '').toLowerCase().trim();

    const isAuthorized = ALLOWED_ADMIN_EMAILS.includes(inputEmail) || inputEmail === configuredAdminEmail;

    if (!inputEmail || !isAuthorized) {
      return res.status(400).json({
        success: false,
        error: `अमान्य ईमेल! पासवर्ड केवल अधिकृत एडमिन ईमेल (${configuredAdminEmail} या neerajrawatdhani@gmail.com) पर भेजा जा सकता है।`
      });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    // Generate stateless cryptographic HMAC signature (works reliably across Vercel serverless containers)
    const secret = settings.adminSecret || 'dhani_super_admin_secure_key_9921';
    const hmacSig = crypto.createHmac('sha256', secret)
      .update(`${inputEmail}:${generatedOtp}:${expiresAt}`)
      .digest('hex');
    const token = `${expiresAt}.${hmacSig}`;

    // Send OTP via Gmail SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost || 'smtp.gmail.com',
        port: parseInt(settings.smtpPort || '465', 10),
        secure: settings.smtpSecure !== false,
        auth: {
          user: settings.smtpUser.trim(),
          pass: settings.smtpPass.trim()
        }
      });

      await transporter.sendMail({
        from: `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${settings.smtpUser.trim()}>`,
        to: inputEmail,
        subject: `🔐 Super Admin Password Reset OTP: ${generatedOtp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #d5cdca; border-radius: 12px; background: #faf9f6; color: #1a1818;">
            <h2 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e0deda; padding-bottom: 12px;">
              Super Admin Password Recovery
            </h2>
            <p style="font-size: 14px; color: #334155;">आपने <strong>Super Admin Portal</strong> (admin.neerajrawat.dev) के लिए पासवर्ड रीसेट का अनुरोध किया है।</p>
            <div style="background: #ffffff; border: 2px dashed #e8a87c; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; font-weight: bold; display: block; margin-bottom: 8px;">Your 6-Digit OTP</span>
              <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">यह OTP अगले <strong>15 मिनट</strong> तक मान्य है। सुरक्षा कारणों से इसे किसी के साथ साझा न करें।</p>
            <hr style="border: none; border-top: 1px solid #e0deda; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Neeraj Rawat · Dhani Tech Super Admin System</p>
          </div>
        `
      });

      return res.status(200).json({
        success: true,
        message: `6-अंकीय OTP सफलतापूर्वक ${inputEmail} पर भेज दिया गया है! कृपया इनबॉक्स चेक करें।`,
        resetToken: token,
        email: inputEmail
      });
    } catch (err) {
      console.error('[Forgot Password OTP Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'OTP ईमेल भेजने में विफलता: ' + err.message
      });
    }
  }

  // ==========================================
  // 2. STEP 2: VERIFY OTP & SET NEW PASSWORD
  // ==========================================
  if (action === 'verify-otp') {
    const inputEmail = (email || '').toLowerCase().trim();
    const inputOtp = String(otp || '').trim();
    const newPass = (newPassword || '').trim();

    if (!inputOtp || inputOtp.length !== 6) {
      return res.status(400).json({ success: false, error: 'कृपया ईमेल में आया सही 6-अंकीय OTP दर्ज करें।' });
    }

    if (!newPass || newPass.length < 4) {
      return res.status(400).json({ success: false, error: 'नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' });
    }

    if (!resetToken || !resetToken.includes('.')) {
      return res.status(400).json({ success: false, error: 'सुरक्षा टोकन अनुपलब्ध है। कृपया दोबारा OTP मंगाएँ।' });
    }

    const [expStr, clientSig] = resetToken.split('.');
    const expiresAt = parseInt(expStr, 10);

    if (Date.now() > expiresAt) {
      return res.status(400).json({ success: false, error: 'OTP की समय सीमा (15 मिनट) समाप्त हो चुकी है। कृपया पुनः नया OTP मंगाएँ।' });
    }

    // Verify HMAC signature
    const secret = settings.adminSecret || 'dhani_super_admin_secure_key_9921';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(`${inputEmail}:${inputOtp}:${expStr}`)
      .digest('hex');

    if (clientSig !== expectedSig) {
      return res.status(400).json({ success: false, error: 'गलत OTP! कृपया ईमेल में प्राप्त 6-अंकीय कोड ध्यानपूर्वक देखकर दर्ज करें।' });
    }

    // Update the admin password in persistent settings
    saveSettings({
      adminPassword: newPass,
      adminEmail: inputEmail
    });

    return res.status(200).json({
      success: true,
      message: '🎉 पासवर्ड सफलतापूर्वक अपडेट हो गया है! अब आप नए पासवर्ड से लॉगिन कर सकते हैं।'
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid action.' });
};
