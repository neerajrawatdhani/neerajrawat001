const { loadProducts, saveProducts, addProduct, updateProduct, deleteProduct, clearProducts } = require('./_products');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Public list of active digital products
  if (req.method === 'GET') {
    const products = loadProducts();
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || 'rzp_test_U3llbPWXVPP7tf';
    return res.status(200).json({
      success: true,
      count: products.length,
      products,
      paymentConfig: {
        mode: 'test',
        keyId: keyId
      }
    });
  }

  // PUT: Replace full product list (Bulk Sync from Super Admin)
  if (req.method === 'PUT') {
    const body = req.body || {};
    const prods = Array.isArray(body) ? body : (Array.isArray(body.products) ? body.products : []);
    saveProducts(prods);
    return res.status(200).json({
      success: true,
      message: 'Products synced successfully',
      count: prods.length,
      products: prods
    });
  }

  // POST: Add or update digital product
  if (req.method === 'POST') {
    const body = req.body || {};
    const {
      id,
      title,
      name,
      desc,
      price,
      priceNum,
      img,
      image,
      fileUrl,
      downloadUrl,
      razorpayUrl,
      category,
      badge,
      sales,
      features
    } = body;

    const prodTitle = (title || name || '').trim();
    if (!prodTitle) {
      return res.status(400).json({ success: false, error: 'Product Title is required.' });
    }

    const numericPrice = typeof priceNum === 'number' ? priceNum : (parseInt(String(price).replace(/[^0-9]/g, '')) || 0);

    const newProd = {
      id: id || ('prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      title: prodTitle,
      name: prodTitle,
      desc: (desc || '').trim(),
      price: '₹' + numericPrice.toLocaleString('en-IN'),
      priceNum: numericPrice,
      img: (img || image || 'frontend/apple-touch-icon.png').trim(),
      image: (img || image || 'frontend/apple-touch-icon.png').trim(),
      fileUrl: (fileUrl || downloadUrl || '').trim(),
      downloadUrl: (downloadUrl || fileUrl || '').trim(),
      razorpayUrl: (razorpayUrl || '').trim(),
      category: (category || 'Excel Sheets').trim(),
      badge: (badge || 'Instant Download').trim(),
      sales: sales || '0 sales',
      features: Array.isArray(features) ? features : [],
      status: 'Active',
      updatedAt: new Date().toISOString()
    };

    addProduct(newProd);

    return res.status(200).json({
      success: true,
      message: 'Product saved successfully!',
      product: newProd
    });
  }

  // PATCH: Update specific fields
  if (req.method === 'PATCH') {
    const body = req.body || {};
    const { id, ...updates } = body;
    if (!id) return res.status(400).json({ success: false, error: 'Product ID is required.' });

    const updated = updateProduct(id, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'Product not found.' });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully!',
      product: updated
    });
  }

  // DELETE: Remove single product or clear all sample products
  if (req.method === 'DELETE') {
    const body = req.body || {};
    const urlParams = new URL(req.url, 'http://localhost').searchParams;
    const action = body.action || urlParams.get('action');
    const deleteId = body.id || urlParams.get('id');

    if (action === 'clear' || (!deleteId && body.clearAll)) {
      clearProducts();
      return res.status(200).json({
        success: true,
        message: 'All sample products have been cleared successfully!',
        products: []
      });
    }

    if (deleteId) {
      deleteProduct(deleteId);
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully!',
        id: deleteId,
        products: loadProducts()
      });
    }

    return res.status(400).json({ success: false, error: 'Product ID or action=clear required.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
