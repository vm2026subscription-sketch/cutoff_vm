require("express-async-errors"); // lets async route handlers throw without try/catch boilerplate

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

const authRoutes = require("./routes/authRoutes");
const metaRoutes = require("./routes/metaRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.set("trust proxy", 1); // needed behind Render/Railway/other reverse proxies

// ---------- Security ----------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "*",
    credentials: true,
  })
);

// ---------- Webhook route FIRST, with its own raw-body-capturing parser ----------
// Razorpay signs the exact raw bytes of the payload, so this route needs the
// unmodified buffer — it must NOT go through the general JSON parser below.
app.use(
  "/api/webhooks",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  webhookRoutes
);

// ---------- Standard body parsing for every other route ----------
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(compression());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", apiLimiter);

// ---------- Routes ----------
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok", time: new Date() }));
app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// ---------- 404 + error handling ----------
app.all("*", (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});
app.use(errorHandler);

module.exports = app;
