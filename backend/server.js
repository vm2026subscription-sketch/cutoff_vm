require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] CutoffSaathi API running on port ${PORT} (${process.env.NODE_ENV})`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => console.log("Process terminated."));
  });
}

start();
