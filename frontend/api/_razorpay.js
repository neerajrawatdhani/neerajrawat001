const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Native .env parser if not already populated in process.env
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        break;
      } catch (e) {}
    }
  }
}

loadEnv();

function getRazorpayCredentials() {
  loadEnv();
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || '';
  return { keyId, keySecret };
}

function getRazorpayInstance() {
  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) {
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
}

function verifySignature(orderId, paymentId, signature) {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret || !orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (e) {
    return false;
  }
}

module.exports = {
  loadEnv,
  getRazorpayCredentials,
  getRazorpayInstance,
  verifySignature
};
