const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

// Verifies the JWT (from cookie or Authorization header) and attaches req.user.
// Use on routes that require any logged-in user.
async function protect(req, res, next) {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError("You must be logged in to access this.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError("This account no longer exists or is disabled.", 401));
  }

  req.user = user;
  next();
}

// Optional auth — attaches req.user if a valid token is present, but never blocks.
// Used on the order-creation route so guest checkout still works.
async function optionalAuth(req, res, next) {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user?.isActive) req.user = user;
  } catch (_) {
    // invalid/expired token on an optional route — just proceed as guest
  }
  next();
}

// Restricts a route to specific roles, e.g. restrictTo('admin').
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
}

module.exports = { protect, optionalAuth, restrictTo };
