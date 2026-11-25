const { loadProducts, saveProducts, addProduct, updateProduct, deleteProduct, clearProducts, resolveCategoryMeta } = require('./_products');

function parseRequestBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  } else if (Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString('utf8')); } catch(e) { body = {}; }
  }
  return body || {};
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Public list of active digital products
  if (req.method === 'GET') {
    const products = loadProducts();
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || '';
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
    const body = parseRequestBody(req);
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
    const body = parseRequestBody(req);
    const {
      id,
      title,
      name,
      desc,
      price,
      priceNum,
      originalPrice,
      originalPriceNum,
      discountPercent,
      img,
      image,
      images,
      fileUrl,
      downloadUrl,
      category,
      categoryKey,
      fileFormat,
      badge,
      sales,
      features
    } = body;

    const prodTitle = (title || name || '').trim();
    if (!prodTitle) {
      return res.status(400).json({ success: false, error: 'Product Title is required.' });
    }

    const numericPrice = typeof priceNum === 'number' ? priceNum : (parseInt(String(price).replace(/[^0-9]/g, '')) || 0);
    const numOrigPrice = typeof originalPriceNum === 'number' ? originalPriceNum : (parseInt(String(originalPrice || '').replace(/[^0-9]/g, '')) || 0);
    const calculatedDiscount = (numOrigPrice > numericPrice && numOrigPrice > 0)
      ? Math.round(((numOrigPrice - numericPrice) / numOrigPrice) * 100)
      : (typeof discountPercent === 'number' ? discountPercent : 0);
    const resolvedMeta = resolveCategoryMeta(category, categoryKey, fileFormat, fileUrl || downloadUrl);

    const savedProd = addProduct({
      id: id || ('prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      title: prodTitle,
      name: prodTitle,
      desc: (desc || '').trim(),
      price: '₹' + numericPrice.toLocaleString('en-IN'),
      priceNum: numericPrice,
      originalPrice: numOrigPrice ? ('₹' + numOrigPrice.toLocaleString('en-IN')) : '',
      originalPriceNum: numOrigPrice,
      discountPercent: calculatedDiscount,
      img: (img || image || '/apple-touch-icon.png').trim().replace(/^\/?frontend\//, '/'),
      image: (img || image || '/apple-touch-icon.png').trim().replace(/^\/?frontend\//, '/'),
      images: Array.isArray(images) && images.length ? images : (Array.isArray(body.images) && body.images.length ? body.images : [(img || image || '/apple-touch-icon.png').trim().replace(/^\/?frontend\//, '/')]),
      fileUrl: (fileUrl || downloadUrl || '').trim(),
      downloadUrl: (downloadUrl || fileUrl || '').trim(),
      category: resolvedMeta.category,
      categoryKey: resolvedMeta.categoryKey,
      fileFormat: resolvedMeta.fileFormat,
      badge: calculatedDiscount > 0 ? `${calculatedDiscount}% OFF` : (badge || 'Instant Download').trim(),
      sales: sales || '0 sales',
      features: Array.isArray(features) ? features : [],
      status: 'Active',
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Product saved and published cleanly!',
      product: savedProd
    });
  }

  // PATCH: Update specific fields
  if (req.method === 'PATCH') {
    const body = parseRequestBody(req);
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
    const body = parseRequestBody(req);
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
