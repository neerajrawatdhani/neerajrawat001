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

function getStorageFile() {
  for (const f of CANDIDATE_FILES) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

let memoryProducts = [];

function loadProducts() {
  try {
    const file = getStorageFile();
    if (file) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) {
        memoryProducts = data;
        return data;
      }
    }
  } catch (e) {}
  return memoryProducts;
}

function saveProducts(products) {
  memoryProducts = Array.isArray(products) ? products : [];

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
  const products = loadProducts();
  const existingIdx = products.findIndex(p => p.id === prod.id);
  if (existingIdx !== -1) {
    products[existingIdx] = { ...products[existingIdx], ...prod, updatedAt: new Date().toISOString() };
  } else {
    products.unshift(prod);
  }
  saveProducts(products);
  return prod;
}

function updateProduct(id, updates) {
  const products = loadProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
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
  loadProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  clearProducts
};
