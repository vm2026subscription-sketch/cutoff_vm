const nodemailer = require("nodemailer");

/**
 * Works with Gmail SMTP out of the box (easiest for local dev/small scale —
 * see README section "Email OTP setup" for the Gmail App Password steps),
 * or any standard SMTP provider (Brevo, SendGrid, Resend's SMTP endpoint,
 * etc.) by just changing SMTP_HOST/PORT in .env — nothing else in this
 * file needs to change either way.
 */
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  // In development, if SMTP isn't configured yet, log the email instead of
  // crashing — lets you test the rest of the signup flow before setting up
  // a real mail provider.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn(
      `[email] SMTP not configured — would have sent to ${to}: "${subject}"\n${html}`,
    );
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"CutoffSaathi" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendOtpEmail(to, otp) {
  await sendEmail({
    to,
    subject: "Your CutoffSaathi verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color:#142850;">Verify your email</h2>
        <p style="color:#444; font-size:14px;">Use this code to verify your CutoffSaathi account. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
        <div style="background:#FBEBD3; color:#142850; font-size:28px; font-weight:800; letter-spacing:6px; padding:16px; text-align:center; border-radius:10px; margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#888; font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendOtpEmail };
