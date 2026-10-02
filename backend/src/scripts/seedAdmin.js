/**
 * Creates (or resets) the first admin account, using ADMIN_EMAIL /
 * ADMIN_PASSWORD from .env. Run once after deployment:
 *   node src/scripts/seedAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  let admin = await User.findOne({ email });
  if (admin) {
    admin.password = password;
    admin.role = "admin";
    await admin.save();
    console.log(`Existing admin ${email} updated.`);
  } else {
    admin = await User.create({ name: "Admin", email, password, role: "admin" });
    console.log(`Admin account created: ${email}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
