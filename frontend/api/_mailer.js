const path = require('path');
const { getSettings } = require('./_settings');

/**
 * Safely resolve nodemailer across local server and Vercel serverless bundles.
 * @returns {import('nodemailer')|null}
 */
function loadMailer() {
  const candidates = [
    'nodemailer',
    path.resolve(__dirname, '..', 'node_modules', 'nodemailer'),
    path.resolve(__dirname, '..', '..', 'node_modules', 'nodemailer'),
    path.resolve(__dirname, '..', '..', 'backend', 'node_modules', 'nodemailer')
  ];
  for (const mod of candidates) {
    try { return require(mod); } catch (e) {}
  }
  return null;
}

/**
 * Verify Bearer authorization header against active adminSecret.
 * @param {import('http').IncomingMessage} req
 * @returns {boolean}
 */
function checkAdminAuth(req) {
  const auth = (req.headers && req.headers.authorization) || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const settings = getSettings();
  return Boolean(token && token === settings.adminSecret);
}

module.exports = { loadMailer, checkAdminAuth };
