const crypto = require('crypto');
const { getRazorpayCredentials } = require('./_razorpay');

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: ''
    };
  }

  if (httpMethod !== 'POST') {
    return json(405, { success: false, verified: false, error: 'Method not allowed' });
  }

  const creds = getRazorpayCredentials();
  const keySecret = process.env.RAZORPAY_KEY_SECRET || creds.keySecret;
  if (!keySecret) {
    console.error('RAZORPAY_KEY_SECRET missing in environment');
    return json(500, { success: false, verified: false, error: 'Payment verification is not configured' });
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch {
    return json(400, { success: false, verified: false, error: 'Invalid JSON body' });
  }

  const orderId = body.razorpay_order_id || body.order_id || body.orderId;
  const paymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
  const signature = body.razorpay_signature || body.signature;

  if (!orderId || !paymentId || !signature) {
    return json(400, { success: false, verified: false, error: 'Missing payment fields' });
  }

  // HMAC-SHA256 of "order_id|payment_id" using the key secret
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    console.warn('Signature mismatch for order', orderId);
    return json(400, { success: false, verified: false, error: 'Payment signature verification failed' });
  }

  // Signature is valid: the payment is genuine.
  return json(200, {
    success: true,
    verified: true,
    message: 'Payment verified successfully',
    order_id: orderId,
    payment_id: paymentId
  });
}

// Vercel / Express / Node.js HTTP Handler
async function nodeHandler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
