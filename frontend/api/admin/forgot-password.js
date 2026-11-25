const crypto = require('crypto');
const { getSettings, saveSettings } = require('../_settings');
const { loadMailer } = require('../_mailer');

const ALLOWED_ADMIN_EMAILS = [
  'neerajrawat001.biz@gmail.com',
  (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
].filter(Boolean);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { action, email, otp, newPassword, resetToken } = req.body || {};
  const settings = getSettings();
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || settings.adminEmail || '').toLowerCase().trim();

  // ==========================================
  // 1. STEP 1: REQUEST OTP (Verify Email & Send OTP)
  // ==========================================
  if (action === 'request-otp') {
    const inputEmail = String(email || '').toLowerCase().trim();
    const isAuthorized = ALLOWED_ADMIN_EMAILS.includes(inputEmail) || (configuredAdminEmail && inputEmail === configuredAdminEmail);

    if (!inputEmail || !isAuthorized) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address. Please enter your registered Super Admin email.'
      });
    }

    const smtpUser = String(settings.smtpUser || '').trim();
    const smtpPass = String(settings.smtpPass || '').trim();
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        error: 'Gmail SMTP is not configured on this Vercel project (missing SMTP_USER or SMTP_PASS in project "neerajrawat001"). Add both variables in Vercel Settings -> Environment Variables and redeploy.'
      });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    // Generate stateless cryptographic HMAC signature across serverless instances
    const secret = settings.adminSecret || 'dhani_super_admin_secure_key_9921';
    const hmacSig = crypto.createHmac('sha256', secret)
      .update(`${inputEmail}:${generatedOtp}:${expiresAt}`)
      .digest('hex');
    const token = `${expiresAt}.${hmacSig}`;

    try {
      const nodemailer = loadMailer();
      if (!nodemailer) {
        return res.status(500).json({ success: false, error: 'Mailer service unavailable on server.' });
      }
      const transporter = nodemailer.createTransport({
        host: String(settings.smtpHost || 'smtp.gmail.com').trim(),
        port: parseInt(settings.smtpPort || '465', 10),
        secure: settings.smtpSecure !== false,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${smtpUser}>`,
        to: inputEmail,
        subject: `Super Admin Password Reset OTP: ${generatedOtp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #d5cdca; border-radius: 12px; background: #faf9f6; color: #1a1818;">
            <h2 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #e0deda; padding-bottom: 12px;">
              Super Admin Password Recovery
            </h2>
            <p style="font-size: 14px; color: #334155;">You requested a password reset for the <strong>Super Admin Console</strong> (admin.neerajrawat.dev).</p>
            <div style="background: #ffffff; border: 2px dashed #e8a87c; border-radius: 10px; padding: 22px; text-align: center; margin: 24px 0;">
              <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; font-weight: bold; display: block; margin-bottom: 8px;">Your 6-Digit OTP</span>
              <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${generatedOtp}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">This OTP is valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e0deda; margin: 20px 0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">Neeraj Rawat · Dhani Tech Control Studio</p>
          </div>
        `
      });

      return res.status(200).json({
        success: true,
        message: `A 6-digit OTP has been sent to ${inputEmail}. Please check your inbox and spam folder.`,
        resetToken: token,
        email: inputEmail
      });
    } catch (err) {
      console.error('[Forgot Password OTP Error]:', err.message);
      const isAuthErr = /Username and Password not accepted|BadCredentials|Invalid login/i.test(err.message);
      return res.status(500).json({
        success: false,
        error: isAuthErr
          ? 'Gmail rejected SMTP_USER / SMTP_PASS credentials. Please generate a valid 16-character Gmail App Password.'
          : 'Failed to send OTP email: ' + err.message
      });
    }
  }

  // ==========================================
  // 2. STEP 2: VERIFY OTP & SET NEW PASSWORD
  // ==========================================
  if (action === 'verify-otp') {
    const inputEmail = String(email || '').toLowerCase().trim();
    const inputOtp = String(otp || '').trim();
    const newPass = String(newPassword || '').trim();

    if (!inputOtp || inputOtp.length !== 6) {
      return res.status(400).json({ success: false, error: 'Please enter the valid 6-digit OTP sent to your email.' });
    }

    if (!newPass || newPass.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }

    if (!resetToken || !resetToken.includes('.')) {
      return res.status(400).json({ success: false, error: 'Security reset token missing. Please request a new OTP.' });
    }

    const [expStr, clientSig] = resetToken.split('.');
    const expiresAt = parseInt(expStr, 10);

    if (Date.now() > expiresAt) {
      return res.status(400).json({ success: false, error: 'OTP expired (15-minute limit). Please request a new OTP.' });
    }

    const secret = settings.adminSecret || 'dhani_super_admin_secure_key_9921';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(`${inputEmail}:${inputOtp}:${expStr}`)
      .digest('hex');

    if (clientSig !== expectedSig) {
      return res.status(400).json({ success: false, error: 'Incorrect OTP. Please double-check the 6-digit code in your email.' });
    }

    saveSettings({
      adminPassword: newPass,
      adminEmail: inputEmail
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now sign in with your new password.'
    });
  }

  return res.status(400).json({ success: false, error: 'Invalid action.' });
};
