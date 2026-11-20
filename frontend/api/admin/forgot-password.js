const fs = require('fs');
const nodemailer = require('nodemailer');
const { getSettings, saveSettings } = require('../_settings');

const OTP_FILE = '/tmp/admin_otp.json';

let memoryOtp = null;

function saveOtpData(data) {
  memoryOtp = data;
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(data), 'utf8');
  } catch (e) {}
}

function getOtpData() {
  try {
    if (fs.existsSync(OTP_FILE)) {
      return JSON.parse(fs.readFileSync(OTP_FILE, 'utf8'));
    }
  } catch (e) {}
  return memoryOtp;
}

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

  const { action, email, otp, newPassword } = req.body || {};
  const settings = getSettings();
  const targetEmail = (settings.adminEmail || 'neerajrawat001.bizz@gmail.com').toLowerCase().trim();

  // 1. Request OTP
  if (action === 'request-otp') {
    const inputEmail = (email || '').toLowerCase().trim();
    if (!inputEmail || inputEmail !== targetEmail) {
      return res.status(400).json({
        success: false,
        error: `अमान्य ईमेल! पासवर्ड रिकवरी केवल रजिस्टर्ड एडमिन ईमेल (${targetEmail}) पर भेजी जा सकती है।`
      });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    saveOtpData({
      otp: generatedOtp,
      email: targetEmail,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

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
        to: targetEmail,
        subject: `🔐 Your Super Admin Password Reset OTP: ${generatedOtp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #d5cdca; border-radius: 12px; background: #faf9f6; color: #1a1818;">
            <h2 style="margin-top: 0; color: #1a1818; border-bottom: 2px solid #e0deda; padding-bottom: 12px;">
              Super Admin Password Recovery
            </h2>
            <p>आपने <strong>Super Admin Panel</strong> के लिए पासवर्ड रीसेट का अनुरोध किया है।</p>
            <div style="background: #ffffff; border: 2px dashed #e8a87c; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #9e9292; font-weight: bold; display: block; margin-bottom: 6px;">Your 6-Digit OTP</span>
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1a1818; font-family: monospace;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #6b5c5c;">यह OTP केवल <strong>10 मिनट</strong> के लिए वैध है। सुरक्षा कारणों से इसे किसी के साथ साझा न करें।</p>
            <hr style="border: none; border-top: 1px solid #e0deda; margin: 24px 0;">
            <p style="font-size: 12px; color: #9e9292; margin-bottom: 0;">Super Admin Portal · <a href="https://admin.neerajrawat.dev" style="color:#6b5c5c;">admin.neerajrawat.dev</a></p>
          </div>
        `
      });

      return res.status(200).json({
        success: true,
        message: `OTP सफलतापूर्वक ${targetEmail} पर भेज दिया गया है। कृपया अपना इनबॉक्स चेक करें।`
      });
    } catch (err) {
      console.error('[OTP Send Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'OTP ईमेल भेजने में विफलता: ' + err.message
      });
    }
  }

  // 2. Verify OTP & Set New Password
  if (action === 'verify-otp') {
    const otpData = getOtpData();
    if (!otpData || !otpData.otp) {
      return res.status(400).json({ success: false, error: 'कृपया पहले नया OTP मंगाएँ।' });
    }

    if (Date.now() > otpData.expiresAt) {
      return res.status(400).json({ success: false, error: 'OTP की समय सीमा (10 मिनट) समाप्त हो चुकी है। कृपया पुनः OTP मंगाएँ।' });
    }

    if (String(otp).trim() !== String(otpData.otp).trim()) {
      return res.status(400).json({ success: false, error: 'गलत OTP! कृपया ईमेल में आया 6-अंकीय OTP सही दर्ज करें।' });
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' });
    }

    // Update password
    saveSettings({ adminPassword: newPassword.trim() });
    saveOtpData(null); // Clear OTP

    return res.status(200).json({
      success: true,
      message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब नए पासवर्ड से लॉगिन करें।'
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid action.' });
};
