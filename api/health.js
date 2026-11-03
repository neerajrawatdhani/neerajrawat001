module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: "ok",
    environment: "vercel-serverless",
    timestamp: new Date().toISOString(),
    service: "Dhani Tech Portfolio & EduDhani API"
  });
};
