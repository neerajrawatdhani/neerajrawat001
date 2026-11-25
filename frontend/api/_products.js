const path = require('path');
const fs = require('fs');

const TMP_FILE = '/tmp/digital_products.json';
const CANDIDATE_FILES = [
  TMP_FILE,
  path.resolve(__dirname, '..', 'backend', 'data', 'products.json'),
  path.resolve(__dirname, '..', '..', 'backend', 'data', 'products.json'),
  path.resolve(process.cwd(), 'backend', 'data', 'products.json'),
  path.resolve(process.cwd(), 'frontend', 'backend', 'data', 'products.json')
];

const CATEGORY_MAP = {
  excel: { key: 'excel', label: 'Excel & Sheets', defaultFormat: '.XLSX' },
  file: { key: 'file', label: 'Digital Files', defaultFormat: '.PDF' },
  project: { key: 'project', label: 'Project Templates', defaultFormat: '.ZIP' },
  portfolio: { key: 'portfolio', label: 'Portfolio Templates', defaultFormat: '.ZIP' },
  design: { key: 'design', label: 'Design & UI Kits', defaultFormat: '.FIG' }
};

function resolveCategoryMeta(category, categoryKey, fileFormat, fileUrl) {
  const rawKey = String(categoryKey || '').trim().toLowerCase();
  const rawCat = String(category || '').trim().toLowerCase();

  let meta = CATEGORY_MAP[rawKey] || null;
  if (!meta) {
    if (rawCat.includes('excel') || rawCat.includes('sheet') || rawCat.includes('csv')) meta = CATEGORY_MAP.excel;
    else if (rawCat.includes('portfolio')) meta = CATEGORY_MAP.portfolio;
    else if (rawCat.includes('project') || rawCat.includes('code') || rawCat.includes('boilerplate') || rawCat.includes('starter') || rawCat.includes('app')) meta = CATEGORY_MAP.project;
    else if (rawCat.includes('design') || rawCat.includes('ui') || rawCat.includes('figma') || rawCat.includes('graphic') || rawCat.includes('brand')) meta = CATEGORY_MAP.design;
    else if (rawCat.includes('file') || rawCat.includes('pdf') || rawCat.includes('doc') || rawCat.includes('ebook') || rawCat.includes('guide')) meta = CATEGORY_MAP.file;
    else meta = CATEGORY_MAP.excel;
  }

  let fmt = String(fileFormat || '').trim().toUpperCase();
  if (!fmt && typeof fileUrl === 'string') {
    const extMatch = fileUrl.split('?')[0].match(/\.(xlsx|xlsm|xls|csv|pdf|docx?|pptx?|zip|rar|fig|psd|ai|sketch|html)$/i);
    if (extMatch) fmt = '.' + extMatch[1].toUpperCase();
  }
  if (!fmt) fmt = meta.defaultFormat;

  return {
    categoryKey: meta.key,
    category: (category && String(category).trim() && rawCat !== 'excel sheets') ? String(category).trim() : meta.label,
    fileFormat: fmt
  };
}

function getStorageFile() {
  for (const f of CANDIDATE_FILES) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

let memoryProducts = [];

function normalizeProductUrl(u) {
  if (!u || typeof u !== 'string') return '/apple-touch-icon.png';
  return u.replace(/^\/?frontend\//, '/');
}

function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return p;
  const img = normalizeProductUrl(p.img || p.image || '/apple-touch-icon.png');
  const images = Array.isArray(p.images) && p.images.length
    ? p.images.map(normalizeProductUrl)
    : [img];
  const catMeta = resolveCategoryMeta(p.category, p.categoryKey, p.fileFormat, p.fileUrl || p.downloadUrl);
  const priceNum = typeof p.priceNum === 'number' ? p.priceNum : (parseInt(String(p.price || '').replace(/[^0-9]/g, ''), 10) || 0);
  const origNum = typeof p.originalPriceNum === 'number' ? p.originalPriceNum : (parseInt(String(p.originalPrice || '').replace(/[^0-9]/g, ''), 10) || 0);
  return {
    ...p,
    price: '₹' + priceNum.toLocaleString('en-IN'),
    priceNum,
    originalPrice: origNum ? ('₹' + origNum.toLocaleString('en-IN')) : '',
    originalPriceNum: origNum,
    img,
    image: img,
    images,
    categoryKey: catMeta.categoryKey,
    category: catMeta.category,
    fileFormat: catMeta.fileFormat
  };
}

function loadProducts() {
  try {
    const file = getStorageFile();
    if (file) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) {
        memoryProducts = data.map(normalizeProduct);
        return memoryProducts;
      }
    }
  } catch (e) {}
  return memoryProducts.map(normalizeProduct);
}

function saveProducts(products) {
  memoryProducts = (Array.isArray(products) ? products : []).map(normalizeProduct);

  for (const f of CANDIDATE_FILES) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(f, JSON.stringify(memoryProducts, null, 2), 'utf8');
    } catch (e) {}
  }

  return memoryProducts;
}

function addProduct(prod) {
  const normalized = normalizeProduct(prod);
  const products = loadProducts();
  const existingIdx = products.findIndex(p => p.id === normalized.id);
  if (existingIdx !== -1) {
    products[existingIdx] = { ...products[existingIdx], ...normalized, updatedAt: new Date().toISOString() };
  } else {
    products.unshift(normalized);
  }
  saveProducts(products);
  return normalized;
}

function updateProduct(id, updates) {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = normalizeProduct({ ...products[idx], ...updates, updatedAt: new Date().toISOString() });
    saveProducts(products);
    return products[idx];
  }
  return null;
}

function deleteProduct(id) {
  const products = loadProducts();
  const filtered = products.filter(p => p.id !== id);
  saveProducts(filtered);
  return true;
}

function clearProducts() {
  saveProducts([]);
  return true;
}

module.exports = {
  CATEGORY_MAP,
  resolveCategoryMeta,
  normalizeProduct,
  loadProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  clearProducts
};
