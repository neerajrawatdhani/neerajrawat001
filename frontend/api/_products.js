const fs = require('fs');

const PRODUCTS_FILE = '/tmp/digital_products.json';

let memoryProducts = [
  {
    id: 'prod_edudhani_erp',
    title: 'EduDhani — Complete School ERP & Student Management System',
    category: 'SaaS Software',
    price: 65000,
    currency: 'INR',
    period: 'One-Time License',
    badge: 'Flagship ERP',
    desc: 'Complete institutional operating system for 1000+ students: Admissions, Fee Receipts, Attendance, Report Cards & Staff Payroll.',
    features: [
      'Multi-user Roles: Admin, Principal, Teacher, Accountant & Parent',
      'Automated Fee Management & Instant WhatsApp Fee Receipts',
      'Exam Marksheets & Automated CBSE / State Board Grade Generation',
      'Staff Attendance & Biometric / QR Code Integration',
      'Cloud Backups with 99.9% High Availability'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev/work',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_mobile_app_module',
    title: 'EduDhani Parent & Staff Mobile App (Android & iOS)',
    category: 'Mobile Applications',
    price: 15000,
    currency: 'INR',
    period: 'One-Time License',
    badge: 'Mobile App',
    desc: 'Cross-platform native mobile application for parents to check real-time attendance, daily homework, pay fees, and receive push notifications.',
    features: [
      'Real-time Absent / Present Push Notifications',
      'Online Fee Payment via UPI, Cards & Netbanking',
      'Digital Homework & Teacher Communication Desk',
      'Student Academic Progress & Report Cards'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_whatsapp_engine',
    title: 'Automated WhatsApp & SMS Business Notification Engine',
    category: 'API & Automation',
    price: 6500,
    currency: 'INR',
    period: 'One-Time Setup',
    badge: 'Automation',
    desc: 'Automated trigger engine that connects to your database to send payment confirmations, lead notifications, and reminders directly on WhatsApp.',
    features: [
      'Official Meta WhatsApp Business Cloud API Integration',
      'Automatic Delivery of Invoices, PDF Reports & OTPs',
      'Zero-delay Instant Serverless Webhook Triggers',
      'Delivery Status Logs & Failed Retries Mechanism'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_payment_gateway',
    title: 'Razorpay / Cashfree Smart Payment Integration Kit',
    category: 'Fintech & Checkout',
    price: 4500,
    currency: 'INR',
    period: 'One-Time Setup',
    badge: 'Fintech',
    desc: 'Production-ready payment checkout integration with webhook signature verification, automatic ledger entry, and instant customer receipts.',
    features: [
      'Supports all UPI apps (GPay, PhonePe, Paytm, BHIM)',
      'Credit/Debit Cards, Netbanking & EMI',
      'Instant Auto-Refund & Webhook Reconciliation Engine',
      'GST Invoice Auto-Generation on Payment'
    ],
    status: 'Active',
    demoUrl: 'https://neerajrawat.dev',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod_amc_support',
    title: 'Annual Technical Maintenance Contract (Priority AMC)',
    category: 'Support & Maintenance',
    price: 12000,
    currency: 'INR',
    period: 'Per Year',
    badge: 'Priority Support',
    desc: '24/7 server health monitoring, monthly database optimization, security patch updates, daily cloud backups, and on-call developer support.',
    features: [
      'Proactive Server Uptime & Latency Monitoring',
      'Weekly Database Defragmentation & Automated Daily Backups',
      'Security Patching, SSL Renewals & Bug Fixes',
      'Priority Phone & WhatsApp Direct Developer Support'
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
      if (Array.isArray(data) && data.length) return data;
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
