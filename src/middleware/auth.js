const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET || "development_secret",
    { expiresIn: "7d" }
  );
}

async function attachUserFromToken(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development_secret");
    const user = await User.findById(payload.userId).select("-passwordHash");

    req.user = user || null;
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ message: "Authentication required." });
    }
    return res.redirect("/login");
  }

  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }

    return next();
  };
}

function guestOnly(req, res, next) {
  if (req.user) {
    return res.redirect("/app/dashboard");
  }
  return next();
}

module.exports = {
  signToken,
  attachUserFromToken,
  requireAuth,
  requireRole,
  guestOnly
};
