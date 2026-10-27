const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Biblioverse API is running",
  });
};

module.exports = {
  getHealthStatus,
};
