const Razorpay = require('razorpay');
const { getRazorpayCredentials } = require('./_razorpay');

const MIN_AMOUNT_PAISE = 100;

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  },
  body: JSON.stringify(body),
});

// Netlify / AWS Lambda Handler
async function lambdaHandler(event) {
  if (!event) event = {};
  const httpMethod = (event.httpMethod || 'POST').toUpperCase();

  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  // Allow GET to fetch public Key ID safely (never KEY_SECRET)
  if (httpMethod === 'GET') {
    const creds = getRazorpayCredentials();
    const keyId = process.env.RAZORPAY_KEY_ID || creds.keyId;
    return json(200, { success: true, key_id: keyId });
  }

  if (httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed' });
  }

  const creds = getRazorpayCredentials();
  const keyId = process.env.RAZORPAY_KEY_ID || creds.keyId;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || creds.keySecret;

  if (!keyId || !keySecret) {
    console.error('Razorpay keys missing in environment');
    return json(500, { success: false, error: 'Payment is not configured' });
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch {
    return json(400, { success: false, error: 'Invalid JSON body' });
  }

  const amount = Math.round(Number(body.amount)); // amount in paise
  const currency = (body.currency || 'INR').toUpperCase();
  const receipt = String(body.receipt || `rcpt_${Date.now()}`).slice(0, 40);

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT_PAISE) {
    return json(400, { success: false, error: `Amount must be an integer of at least ${MIN_AMOUNT_PAISE} paise` });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const orderOptions = {
      amount,
      currency,
      receipt
    };
    if (body.notes && typeof body.notes === 'object') {
      orderOptions.notes = body.notes;
    }
    const order = await razorpay.orders.create(orderOptions);

    return json(200, {
      success: true,
      key_id: keyId, // public key, safe to send to the browser
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (err) {
    const status = err && (err.statusCode === 401 || err.statusCode === 403) ? 401 : 500;
    console.error('Razorpay create order failed:', err && err.error ? err.error : err);
    return json(status, {
      success: false,
      error: status === 401 ? 'Razorpay authentication failed' : 'Could not create order. Please try again.',
    });
  }
}

// Vercel / Express / Node.js HTTP Handler
async function nodeHandler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    if (res.writeHead) res.writeHead(200);
    else if (res.status) res.status(200);
    return res.end();
  }

  const event = {
    httpMethod: req.method,
    body: req.body,
    headers: req.headers
  };

  const result = await lambdaHandler(event);
  const status = result.statusCode || 200;
  const payload = JSON.parse(result.body);

  if (res.status && res.json) {
    return res.status(status).json(payload);
  }
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  return res.end(result.body);
}

// Dual Handler: supports Vercel / Express (req, res) AND AWS Lambda / Netlify (event)
module.exports = async function handler(reqOrEvent, resOrContext) {
  if (resOrContext && typeof resOrContext.end === 'function') {
    return nodeHandler(reqOrEvent, resOrContext);
  }
  return lambdaHandler(reqOrEvent);
};

module.exports.handler = lambdaHandler;
exports.handler = lambdaHandler;
