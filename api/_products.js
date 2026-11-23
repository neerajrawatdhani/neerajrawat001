const path = require('path');
const fs = require('fs');

const TMP_FILE = '/tmp/digital_products.json';
const BACKEND_PROD_FILE = path.resolve(__dirname, '..', 'backend', 'data', 'products.json');

function getStorageFile() {
  if (fs.existsSync(TMP_FILE)) return TMP_FILE;
  if (fs.existsSync(BACKEND_PROD_FILE)) return BACKEND_PROD_FILE;
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
  
  try {
    const backendDir = path.dirname(BACKEND_PROD_FILE);
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }
    fs.writeFileSync(BACKEND_PROD_FILE, JSON.stringify(memoryProducts, null, 2), 'utf8');
  } catch (e) {}

  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(memoryProducts, null, 2), 'utf8');
  } catch (e) {}
  
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
