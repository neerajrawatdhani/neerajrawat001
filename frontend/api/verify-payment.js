const { verifySignature, getRazorpayCredentials } = require('./_razorpay');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead ? res.writeHead(200) : res.status(200);
    return res.end();
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

  const orderId = body.razorpay_order_id || body.order_id || body.orderId;
  const paymentId = body.razorpay_payment_id || body.payment_id || body.paymentId;
  const signature = body.razorpay_signature || body.signature;

  // Validation: Missing fields
  if (!orderId || !paymentId || !signature) {
    const err = {
      success: false,
      error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.'
    };
    if (res.status && res.json) return res.status(400).json(err);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) {
    const err = {
      success: false,
      error: 'Razorpay Key Secret not configured on server.'
    };
    if (res.status && res.json) return res.status(500).json(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  // Verify HMAC SHA256 Signature
  const isValid = verifySignature(orderId, paymentId, signature);

  if (!isValid) {
    console.warn(`Payment signature verification failed for Order: ${orderId}, Payment: ${paymentId}`);
    const err = {
      success: false,
      verified: false,
      error: 'Payment signature verification failed. Invalid signature.'
    };
    if (res.status && res.json) return res.status(400).json(err);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(err));
  }

  // Success
  const successPayload = {
    success: true,
    verified: true,
    message: 'Payment verified successfully',
    order_id: orderId,
    payment_id: paymentId
  };

  if (res.status && res.json) {
    return res.status(200).json(successPayload);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify(successPayload));
};
