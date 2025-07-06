const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    console.log('Token received:', token);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-change-this-in-production"
    );
    console.log('Decoded:', decoded);
    if (!decoded.id) {
      console.error('Decoded token missing id:', decoded);
      return res.status(401).json({ error: "Token is not valid (no id)" });
    }
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error('JWT error:', error.message);
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;
