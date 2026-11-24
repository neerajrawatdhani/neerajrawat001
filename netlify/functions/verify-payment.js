const crypto = require('crypto');

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

exports.handler = async (event) => {
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
    return json(405, { error: 'Method not allowed' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET;
  if (!keySecret) {
    console.error('RAZORPAY_KEY_SECRET missing in environment');
    return json(500, { error: 'Payment verification is not configured' });
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const orderId = body.razorpay_order_id || body.order_id || body.orderId;
  const paymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
  const signature = body.razorpay_signature || body.signature;

  if (!orderId || !paymentId || !signature) {
    return json(400, { error: 'Missing payment fields' });
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
  return json(200, { success: true, verified: true, order_id: orderId, payment_id: paymentId });
};
