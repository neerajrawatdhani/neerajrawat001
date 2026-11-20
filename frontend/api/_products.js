const fs = require('fs');

const PRODUCTS_FILE = '/tmp/digital_products.json';

// Authentic Digital Products: Excel Spreadsheets, Downloadable Files, Templates & Scripts
let memoryProducts = [
  {
    id: 'prod_gst_invoice_excel',
    title: 'Automated GST Billing & Tax Invoicing Excel Spreadsheet',
    category: 'Excel Sheets',
    fileFormat: 'Microsoft Excel (.xlsx)',
    price: 499,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Best Seller Excel',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_gst_invoicing',
    desc: 'Pre-configured automated Excel workbook with dynamic CGST, SGST & IGST calculation, automated tax invoice generator, client ledger, and one-click printable PDF layout.',
    features: [
      'Automated CGST (9%), SGST (9%), and IGST (18%) auto-detection',
      'One-click Printable & PDF Invoice generator format',
      'Client Outstanding Balance & Payment Ledger tracker',
      'Fully unlocked formulas — 100% customizable for any business',
      'Instant digital file download (.xlsx) with lifetime access'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_profit_expense_tracker',
    title: 'Business Income, Expense & Profit-Loss Dashboard',
    category: 'Excel Sheets',
    fileFormat: 'Excel (.xlsx) + Google Sheets',
    price: 399,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Popular Sheet',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_profit_tracker',
    desc: 'Visual financial management dashboard in Excel & Google Sheets to track daily revenue, operating expenses, vendor payments, and monthly net profit with automated charts.',
    features: [
      'Visual interactive dashboard with automatic monthly charts & graphs',
      'Monthly & Annual P&L (Profit & Loss) breakdown summary',
      'Cash flow projections & vendor payment status tracker',
      'Compatible with MS Excel 2016, 2019, 2021, Office 365 & Google Sheets',
      'Includes pre-filled sample data sheet for easy understanding'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_social_media_graphics_pack',
    title: '1500+ Social Media Posts & Banner Graphic Design Bundle',
    category: 'Digital Files',
    fileFormat: 'Canva & PSD (.zip)',
    price: 699,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Mega Bundle',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_graphic_bundle',
    desc: 'High-converting social media marketing templates for Instagram, Facebook, LinkedIn & WhatsApp promotion. Fully customizable in Canva (Free version) and Photoshop.',
    features: [
      '1,500+ modern design templates for sales, festivals, quotes & offers',
      'Ready-to-post square (1080x1080) and Story/Reel (1080x1920) sizes',
      'Works seamlessly with Canva Free Account — no Pro required',
      'High-resolution vector assets, background textures & icons included',
      'Direct cloud storage download link with lifetime updates'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_client_agreement_pack',
    title: 'Client Onboarding, Proposal & Legal Contract Toolkit',
    category: 'Templates & Files',
    fileFormat: 'Word (.docx) + PDF + Excel',
    price: 599,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Agency Toolkit',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_contract_pack',
    desc: 'Professional service contracts, client intake questionnaires, scope of work templates, and payment terms agreements drafted for freelancers and agencies.',
    features: [
      'Legally structured Client Service Agreement with milestone protection',
      'Client Onboarding Questionnaire to capture project requirements',
      'Payment Milestones, Delay Clauses & Intellectual Property Transfer',
      'Editable Word (.docx), Google Docs and ready-to-use PDF formats'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_portfolio_source_code',
    title: 'Modern Full-Stack Dark Theme Portfolio & Agency Web Kit',
    category: 'Code & Scripts',
    fileFormat: 'Full Source Code (.zip)',
    price: 999,
    currency: 'INR',
    period: 'Instant Download',
    badge: 'Developer Kit',
    downloadUrl: 'https://drive.google.com/drive/folders/neerajrawat_source_code',
    desc: 'Clean, performant HTML5/CSS3/JavaScript dark portfolio website template with responsive navigation, micro-interactions, contact backend, and 99+ Lighthouse score.',
    features: [
      'Clean handwritten HTML5/CSS3 with zero heavy dependencies',
      'Interactive project showcase modal & lead capture contact forms',
      'SEO friendly with schema metadata and open-graph social previews',
      'Includes deploy guide for Vercel, Netlify, or Apache/cPanel'
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
        // If file contains obsolete school ERP mock data, migrate to new digital products
        if (data.some(p => p.id === 'prod_edudhani_erp' || (p.title && p.title.includes('School ERP')))) {
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
