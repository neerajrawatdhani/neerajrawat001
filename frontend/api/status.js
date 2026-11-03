module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    available: true,
    statusMessage: "Available for enterprise inquiries and product collaborations",
    responseTime: "Replies within 5 hours",
    serverTime: new Date().toISOString()
  });
};
