const rateLimit = require("express-rate-limit");

// General API traffic
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many requests. Please try again later." },
});

// Tighter limit on auth routes to slow down credential-stuffing/brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many attempts. Please try again in a few minutes." },
});

module.exports = { apiLimiter, authLimiter };
