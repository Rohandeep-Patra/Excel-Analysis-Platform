const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production"
    );

    req.user = decoded.user; // <--- This is critical!

    next();
  } catch (error) {
    console.error("Token error:", error.message);
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;
