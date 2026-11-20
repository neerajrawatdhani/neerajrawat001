const { loadProducts, addProduct, updateProduct, deleteProduct } = require('./_products');
const { getSettings } = require('./_settings');

function checkAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const settings = getSettings();
  return token === settings.adminSecret;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Public list of active digital products + active payment gateway config
  if (req.method === 'GET') {
    const products = loadProducts();
    const settings = getSettings();
    const pg = settings.paymentGateway || {};
    const isLive = pg.mode === 'live';
    const paymentConfig = {
      mode: pg.mode || 'test',
      keyId: isLive ? (pg.liveKeyId || '') : (pg.testKeyId || 'rzp_test_51aBCD12345678'),
      upiId: pg.upiId || '8708167959@paytm',
      upiName: pg.upiName || 'Neeraj Rawat | Dhani Tech'
    };
    return res.status(200).json({
      success: true,
      products,
      paymentConfig
    });
  }

  // Admin routes require authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: कृपया लॉगिन करें।' });
  }

  // POST: Add new digital product
  if (req.method === 'POST') {
    const body = req.body || {};
    const { title, category, price, period, badge, desc, features = [], demoUrl } = body;

    if (!title || !price) {
      return res.status(400).json({ success: false, error: 'Product Title और Price आवश्यक हैं।' });
    }

    const newProd = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      category: (category || 'Digital Product').trim(),
      price: Number(price) || 0,
      currency: 'INR',
      period: (period || 'One-Time License').trim(),
      badge: (badge || 'New').trim(),
      desc: (desc || '').trim(),
      features: Array.isArray(features) ? features : (features ? features.split('\n').filter(Boolean) : []),
      demoUrl: (demoUrl || '').trim(),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    addProduct(newProd);

    return res.status(201).json({
      success: true,
      message: 'डिजिटल प्रोडक्ट सफलतापूर्वक जोड़ दिया गया!',
      product: newProd
    });
  }

  // PATCH: Update digital product
  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { id, ...updates } = body;

    if (!id) return res.status(400).json({ success: false, error: 'Product ID आवश्यक है।' });

    const updated = updateProduct(id, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'Product नहीं मिला।' });

    return res.status(200).json({
      success: true,
      message: 'Product अपडेट हो गया!',
      product: updated
    });
  }

  // DELETE: Remove product
  if (req.method === 'DELETE') {
    const body = req.body || {};
    const { id } = body;

    if (!id) return res.status(400).json({ success: false, error: 'Product ID आवश्यक है।' });

    deleteProduct(id);
    return res.status(200).json({
      success: true,
      message: 'Product डिलीट हो गया!'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
