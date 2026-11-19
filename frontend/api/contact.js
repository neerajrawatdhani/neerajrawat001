const nodemailer = require('nodemailer');
const { addLead } = require('./_leads');

const SMTP_USER = process.env.SMTP_USER || 'neerajrawatdhani@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SMTP_USER;

let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  } catch (e) {
    console.error('[SMTP Init Error]:', e.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const name = (body.name || '').trim();
  const mobile = (body.mobile || body.phone || '').trim();
  const email = (body.email || body.mail || '').trim();
  const country = (body.country || 'India (+91)').trim();
  const countryCode = (body.countryCode || 'IN').trim();
  const budget = (body.budget || 'Flexible / To be discussed').trim();
  const service = (body.service || 'Web & Custom Solutions').trim();
  const channel = (body.channel || 'Website Form').trim();
  const message = (body.message || body.project || '').trim();
  const consent = body.consent === true || body.consent === 'true' || body.consent === 'on' || body.consent === 1;

  if (!name) return res.status(400).json({ success: false, error: "Please enter your name." });
  if (!mobile) return res.status(400).json({ success: false, error: "Please provide your mobile number." });
  if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: "Please provide a valid email ID." });
  if (!message) return res.status(400).json({ success: false, error: "Please provide a brief description of your project." });
  if (!consent) {
    return res.status(400).json({
      success: false,
      error: "Consent is required: please confirm that your details will not be shared with any third party."
    });
  }

  const inquiry = {
    id: 'inq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: new Date().toISOString(),
    channel,
    name,
    country,
    countryCode,
    mobile,
    email,
    service,
    budget,
    message,
    status: 'New',
    followUpDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: `Inquiry submitted via ${channel}. Consent confirmed.`,
    consent: true
  };

  // 1. Add to leads database
  try {
    addLead(inquiry);
  } catch (err) {
    console.error('[Leads Store Error]:', err.message);
  }

  // 2. Send email notification if SMTP is configured
  if (transporter && SMTP_USER && SMTP_PASS) {
    try {
      const fromAddress = `"Neeraj Rawat | Dhani Tech" <${SMTP_USER}>`;

      // Admin notification
      await transporter.sendMail({
        from: fromAddress,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `🚀 New Project Lead: ${name} (${budget})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e0deda; border-radius: 12px; background: #faf9f6; color: #1a1818;">
            <h2 style="margin-top: 0; color: #1a1818; border-bottom: 2px solid #d5cdca; padding-bottom: 12px;">
              🚀 New Project Inquiry Received
            </h2>
            <p><strong>Client Name:</strong> ${name}</p>
            <p><strong>Country:</strong> ${country}</p>
            <p><strong>Channel:</strong> ${channel}</p>
            <p><strong>Mobile Number:</strong> ${mobile} &nbsp; (<a href="https://wa.me/${mobile.replace(/[^0-9]/g, '')}">WhatsApp</a> | <a href="tel:${mobile}">Call</a>)</p>
            <p><strong>Email ID:</strong> ${email}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Budget:</strong> ${budget}</p>
            <p><strong>Data Privacy Consent:</strong> Confirmed (Client approved)</p>
            <div style="margin-top: 16px; padding: 16px; background: #ffffff; border: 1px solid #d5cdca; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0;">Project Description:</h4>
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <div style="margin-top: 20px;">
              <a href="https://admin.neerajrawat.dev" style="display: inline-block; background: #1a1818; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Super Admin Panel →</a>
            </div>
          </div>
        `
      });

      // Client auto-reply
      await transporter.sendMail({
        from: fromAddress,
        to: email,
        replyTo: ADMIN_EMAIL,
        subject: `Thank you for reaching out, ${name} | Neeraj Rawat (Dhani Tech)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0deda; border-radius: 12px; background: #ffffff; color: #1a1818;">
            <h2>Hello ${name},</h2>
            <p>Thank you for reaching out regarding your project. I have received your submission and will review it promptly.</p>
            <p>I typically respond within <strong>5 hours</strong> directly from this email (${ADMIN_EMAIL}) or via phone/WhatsApp.</p>
            <div style="margin-top: 20px; padding: 12px; background: #f0f7ff; border-left: 4px solid #2196f3; font-size: 13px; color: #0d47a1;">
              🔒 <strong>Privacy Assurance:</strong> Your contact details and project requirements are strictly confidential.
            </div>
            <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #eee;">
              <p style="margin: 0; font-weight: bold;">Neeraj Rawat</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b5c5c;">Founder & CEO · EduDhani (School ERP)<br>Dhani Tech · <a href="https://neerajrawat.dev" style="color: #6b5c5c;">neerajrawat.dev</a></p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error('[SMTP Send Error]:', err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: `Thank you, ${name}! Your inquiry has been received. I will reply to ${email} within 5 hours.`,
    inquiry
  });
};
