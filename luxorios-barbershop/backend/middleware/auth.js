// middleware/auth.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.tenantId) {
      return res.status(401).json({ message: "Please sign in again for this business" });
    }
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
