const jwt = require("jsonwebtoken");

const revokedTokens = new Set();

const getTokenFromRequest = (req) => {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  const cookieHeader = req.headers && req.headers.cookie;

  if (typeof cookieHeader !== "string") {
    return null;
  }

  const tokenEntry = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("token="));

  if (!tokenEntry) {
    return null;
  }

  return decodeURIComponent(tokenEntry.split("=").slice(1).join("="));
};

const revokeToken = (token) => {
  if (token) {
    revokedTokens.add(token);
  }
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      userId: decoded.userId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
module.exports.revokeToken = revokeToken;
