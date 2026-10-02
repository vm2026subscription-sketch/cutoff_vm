const mongoose = require("mongoose");
const { getStreams } = require("../config/courseTaxonomy");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stream: { type: String, required: true, enum: getStreams() },
    course: { type: String, required: true, trim: true },
    category: { type: String, required: true, uppercase: true, trim: true },
    branches: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 3,
        message: "Select between 1 and 3 branches",
      },
    },
    year: { type: Number, required: true },

    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },

    razorpay_order_id: { type: String, required: true, unique: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
