const { getRazorpayCredentials, getRazorpayInstance } = require('./_razorpay');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead ? res.writeHead(200) : res.status(200);
    return res.end();
  }

  // Allow GET to fetch public Key ID safely (never KEY_SECRET)
  if (req.method === 'GET') {
    const { keyId } = getRazorpayCredentials();
    const data = { success: true, key_id: keyId };
    if (res.status && res.json) return res.status(200).json(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(data));
  }

  if (req.method !== 'POST') {
    const err = { success: false, error: 'Method not allowed. Use POST.' };
    if (res.status && res.json) return res.status(405).json(err);
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  let { amount, currency, receipt, notes } = body;

  // Validation: Amount in paise (minimum 100 paise = ₹1)
  const amt = Math.round(Number(amount));
  if (!amt || isNaN(amt) || amt < 100) {
    const err = {
      success: false,
      error: 'Invalid amount. Minimum amount is 100 paise (₹1).'
    };
    if (res.status && res.json) return res.status(400).json(err);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) {
    const err = {
      success: false,
      error: 'Razorpay credentials not configured. Please check environment variables.'
    };
    if (res.status && res.json) return res.status(401).json(err);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    const err = { success: false, error: 'Failed to initialize Razorpay instance' };
    if (res.status && res.json) return res.status(500).json(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  const curr = (currency || 'INR').toUpperCase();
  const rcpt = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const orderOptions = {
      amount: amt,
      currency: curr,
      receipt: String(rcpt).substring(0, 40),
      notes: notes || {}
    };

    const order = await razorpay.orders.create(orderOptions);

    const responsePayload = {
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: keyId // Public key only, safe for client
    };

    if (res.status && res.json) {
      return res.status(200).json(responsePayload);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(responsePayload));
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);

    const statusCode = error.statusCode === 401 ? 401 : 500;
    const errPayload = {
      success: false,
      error: error.error ? error.error.description || error.error.code : error.message || 'Failed to create Razorpay order'
    };

    if (res.status && res.json) {
      return res.status(statusCode).json(errPayload);
    }
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(errPayload));
  }
};
