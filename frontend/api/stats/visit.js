let memVisits = 17;

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    memVisits++;
  }
  res.status(200).json({ success: true, visits: memVisits });
};
