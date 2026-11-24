const Razorpay = require('razorpay');

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

exports.handler = async (event) => {
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
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || 'rzp_test_U3llbPWXVPP7tf';
    return json(200, { success: true, key_id: keyId });
  }

  if (httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || 'rzp_test_U3llbPWXVPP7tf';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || '2xgESwi0lC2dleQyqKyD6Zq3';
  if (!keyId || !keySecret) {
    console.error('Razorpay keys missing in environment');
    return json(500, { error: 'Payment is not configured' });
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const amount = Number(body.amount); // amount in paise
  const currency = (body.currency || 'INR').toUpperCase();
  const receipt = String(body.receipt || `rcpt_${Date.now()}`).slice(0, 40);

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT_PAISE) {
    return json(400, { error: `Amount must be an integer of at least ${MIN_AMOUNT_PAISE} paise` });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const orderOptions = { amount, currency, receipt };
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
      error: status === 401 ? 'Razorpay authentication failed' : 'Could not create order. Please try again.',
    });
  }
};
