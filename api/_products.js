const fs = require('fs');

const PRODUCTS_FILE = '/tmp/digital_products.json';

// Authentic Digital Products: Excel Spreadsheets, Downloadable Files, Templates & Scripts
let memoryProducts = [
  {
    id: 'prod_gst_invoice_excel',
    title: 'Automated GST Billing & Invoicing Excel Sheet',
    category: 'Excel Sheets',
    fileFormat: 'Microsoft Excel (.xlsx)',
    price: 499,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_gst_invoicing',
    desc: 'Automated CGST/SGST/IGST tax calculation, client ledger & one-click printable PDF invoices.',
    features: [
      'Automated CGST, SGST & IGST tax calculation',
      'One-click Printable PDF Invoice format',
      'Client Outstanding Balance & Ledger tracker',
      '100% unlocked formulas for any business'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_profit_expense_tracker',
    title: 'Business Income, Expense & P&L Dashboard',
    category: 'Excel Sheets',
    fileFormat: 'Excel (.xlsx) + Google Sheets',
    price: 399,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_profit_tracker',
    desc: 'Interactive financial P&L dashboard with automated monthly expense charts & cash flow tracker.',
    features: [
      'Interactive dashboard with automatic charts',
      'Monthly & Annual Profit & Loss summary',
      'Cash flow projections & vendor tracker',
      'MS Excel & Google Sheets compatible'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_social_media_graphics_pack',
    title: '1500+ Social Media Posts & Banner Graphic Bundle',
    category: 'Digital Files',
    fileFormat: 'Canva & PSD (.zip)',
    price: 699,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Mega Pack',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_graphic_bundle',
    desc: 'Editable Canva & Photoshop templates for Instagram, Facebook, LinkedIn & WhatsApp promotion.',
    features: [
      '1,500+ modern design templates & banners',
      'Ready-to-post Square & Story/Reels sizes',
      'Works with Canva Free Account',
      'High-res vectors, textures & icons'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_client_agreement_pack',
    title: 'Client Onboarding, Proposal & Contract Toolkit',
    category: 'Templates & Files',
    fileFormat: 'Word (.docx) + PDF',
    price: 599,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Agency Pro',
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_contract_pack',
    desc: 'Ready-to-use client service agreements, NDA, payment milestone terms, and onboarding documents.',
    features: [
      'Client Service Agreement with milestone protection',
      'Client intake & requirements questionnaire',
      'Milestone payment & copyright clauses',
      'Editable Word (.docx) & PDF formats'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_portfolio_source_code',
    title: 'Modern Full-Stack Dark Portfolio Web Kit',
    category: 'Code & Scripts',
    fileFormat: 'Source Code (.zip)',
    price: 999,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Developer Kit',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_source_code',
    desc: 'High-performance HTML5/CSS3 portfolio codebase with 3D interactions, contact backend & 99+ score.',
    features: [
      'Clean handwritten HTML5/CSS3 codebase',
      'Interactive showcase modal & contact system',
      'SEO friendly with schema metadata',
      'Vercel & Netlify deploy guide included'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  }
];

function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length) {
        // If file contains obsolete school ERP or products without images, refresh with new memoryProducts
        if (data.some(p => p.id === 'prod_edudhani_erp' || !p.image)) {
          saveProducts(memoryProducts);
          return memoryProducts;
        }
        return data;
      }
    }
  } catch (e) {}
  return memoryProducts;
}

function saveProducts(products) {
  memoryProducts = products;
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (e) {}
}

function addProduct(prod) {
  const products = loadProducts();
  products.unshift(prod);
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

module.exports = { loadProducts, saveProducts, addProduct, updateProduct, deleteProduct };
