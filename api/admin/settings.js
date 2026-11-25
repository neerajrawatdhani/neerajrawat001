const { getSettings, saveSettings } = require('../_settings');
const { loadMailer, checkAdminAuth } = require('../_mailer');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAdminAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Please sign in first.' });
  }

  const settings = getSettings();

  if (req.method === 'GET') {
    const pass = settings.smtpPass || '';
    const maskedPass = pass.length > 4 ? `${pass.slice(0, 4)} **** **** ${pass.slice(-4)}` : '••••••••••••';
    return res.status(200).json({
      success: true,
      settings: {
        smtpHost: settings.smtpHost || 'smtp.gmail.com',
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpUser: settings.smtpUser,
        smtpPassMasked: maskedPass,
        isConfigured: Boolean(settings.smtpUser && settings.smtpPass),
        adminEmail: settings.adminEmail,
        fromName: settings.fromName,
        operatingCosts: settings.operatingCosts,
        implementationItems: settings.implementationItems,
        scalingBands: settings.scalingBands,
        metaPricingIndia: settings.metaPricingIndia,
        paymentGateway: {
          mode: (settings.paymentGateway && settings.paymentGateway.mode) || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.startsWith('rzp_live') ? 'live' : 'test'),
          testKeyId: process.env.RAZORPAY_KEY_ID || (settings.paymentGateway && settings.paymentGateway.testKeyId) || '',
          razorpayConfigured: Boolean((process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) || (settings.paymentGateway && settings.paymentGateway.testKeyId)),
          upiId: (settings.paymentGateway && settings.paymentGateway.upiId) || '',
          upiName: (settings.paymentGateway && settings.paymentGateway.upiName) || 'Neeraj Rawat | Dhani Tech'
        }
      }
    });
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    const body = req.body || {};

    if (body.action === 'test') {
      const testUser = String(body.smtpUser || settings.smtpUser || '').trim();
      const testPass = String(body.smtpPass || settings.smtpPass || '').trim();
      const testTo = String(body.adminEmail || settings.adminEmail || testUser || '').trim();

      if (!testUser || !testPass) {
        return res.status(400).json({
          success: false,
          error: 'Both Gmail Address (SMTP_USER) and App Password (SMTP_PASS) are required.'
        });
      }

      try {
        const nodemailer = loadMailer();
        if (!nodemailer) {
          return res.status(500).json({ success: false, error: 'Nodemailer package unavailable on server.' });
        }
        const testTransporter = nodemailer.createTransport({
          host: String(settings.smtpHost || 'smtp.gmail.com').trim(),
          port: parseInt(settings.smtpPort || '465', 10),
          secure: settings.smtpSecure !== false,
          auth: {
            user: testUser,
            pass: testPass
          }
        });

        await testTransporter.verify();

        await testTransporter.sendMail({
          from: `"${settings.fromName || 'Neeraj Rawat | Dhani Tech'}" <${testUser}>`,
          to: testTo,
          subject: 'Gmail SMTP Connection Verified — Control Studio',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #d5cdca; border-radius: 12px; background: #faf9f6;">
              <h2 style="color: #1a1818; margin-top: 0;">Gmail SMTP Successfully Connected</h2>
              <p>Your Gmail SMTP credentials and App Password are verified and active.</p>
              <div style="background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid #e0deda; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Sender Account:</strong> ${testUser}</p>
                <p style="margin: 4px 0;"><strong>Recipient:</strong> ${testTo}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> Active &amp; Verified</p>
                <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
              <p style="color: #6b5c5c; font-size: 13px;">Contact notifications, OTP password resets, and quotation proposals are ready to dispatch.</p>
            </div>
          `
        });

        return res.status(200).json({
          success: true,
          message: `Verification test email delivered to ${testTo}.`
        });
      } catch (err) {
        console.error('[SMTP Test Error]:', err.message);
        let errorMsg = err.message;
        if (/Username and Password not accepted|BadCredentials/i.test(err.message)) {
          errorMsg = 'Invalid Gmail address or App Password. Please generate a 16-character App Password in your Google Account.';
        }
        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      }
    }

    const updates = {};
    if (body.smtpUser) updates.smtpUser = String(body.smtpUser).trim();
    if (body.smtpPass) updates.smtpPass = String(body.smtpPass).trim();
    if (body.adminEmail) updates.adminEmail = String(body.adminEmail).trim();
    if (body.fromName) updates.fromName = String(body.fromName).trim();
    if (body.adminPassword) updates.adminPassword = String(body.adminPassword).trim();
    if (body.operatingCosts) updates.operatingCosts = body.operatingCosts;
    if (body.implementationItems) updates.implementationItems = body.implementationItems;
    if (body.paymentGateway) updates.paymentGateway = body.paymentGateway;

    saveSettings(updates);

    return res.status(200).json({
      success: true,
      message: 'Settings saved successfully.',
      settings: updates
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
