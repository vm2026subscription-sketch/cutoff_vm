const mongoose = require("mongoose");

async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("[db] MongoDB connection error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected");
    });
  } catch (err) {
    console.error("[db] Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
