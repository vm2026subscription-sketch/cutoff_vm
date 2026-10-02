const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sendOtpEmail } = require("../utils/sendEmail");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function sendAuthResponse(user, statusCode, res) {
  const token = signToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie("token", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
}

// OTP is hashed before storage (same idea as a password) so that a leaked
// database dump doesn't hand out valid, usable OTPs directly.
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

async function issueAndSendOtp(user) {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpires = new Date(Date.now() + Number(process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000);
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(user.email, otp);
}

// POST /api/auth/signup
// Creates the account as unverified and emails a 6-digit OTP.
// No token is issued yet — the frontend should route to /verify-otp next.
exports.signup = async (req, res, next) => {
  const { name, email, password, category } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required.", 400));
  }
  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters.", 400));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing && existing.isVerified) {
    return next(new AppError("An account with this email already exists.", 400));
  }

  // If a previous signup attempt was never verified, reuse that document
  // instead of erroring — re-signing up is how a user retries.
  const user = existing || new User({ name, email, password, category });
  if (existing) {
    existing.name = name;
    existing.password = password; // pre-save hook re-hashes it
    existing.category = category;
  }
  await user.save();
  await issueAndSendOtp(user);

  res.status(201).json({
    status: "success",
    message: "Account created. Check your email for a verification code.",
    data: { email: user.email, needsVerification: true },
  });
};

// POST /api/auth/verify-otp
// Body: { email, otp }
exports.verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new AppError("Email and OTP are required.", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+otpHash +otpExpires +otpAttempts",
  );
  if (!user) return next(new AppError("No account found for this email.", 404));
  if (user.isVerified) {
    return sendAuthResponse(user, 200, res); // already verified — just log them in
  }
  if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
    return next(new AppError("This code has expired. Please request a new one.", 400));
  }
  if (user.otpAttempts >= 5) {
    return next(new AppError("Too many incorrect attempts. Please request a new code.", 429));
  }

  if (hashOtp(otp) !== user.otpHash) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Incorrect code. Please try again.", 400));
  }

  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  sendAuthResponse(user, 200, res);
};

// POST /api/auth/resend-otp
// Body: { email }
exports.resendOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required.", 400));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return next(new AppError("No account found for this email.", 404));
  if (user.isVerified) {
    return next(new AppError("This account is already verified. Please log in.", 400));
  }

  await issueAndSendOtp(user);
  res.status(200).json({ status: "success", message: "A new code has been sent." });
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Email and password are required.", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }
  if (!user.isActive) {
    return next(new AppError("This account has been disabled.", 401));
  }
  if (!user.isVerified) {
    return next(
      new AppError("Please verify your email before logging in. Check your inbox for the code.", 403),
    );
  }

  sendAuthResponse(user, 200, res);
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ status: "success", message: "Logged out." });
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
};
