const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

module.exports = auth;
