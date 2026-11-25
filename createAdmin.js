// Usage:  node createAdmin.js <username> <password>
// Creates an admin account (or resets the password if the username already exists).
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const { AdminUser } = require("./adminAuth");

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username || !password || password.length < 8) {
    console.error("Usage: node createAdmin.js <username> <password>   (password: at least 8 characters)");
    process.exit(1);
  }
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL is missing in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URL);
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  await AdminUser.updateOne(
    { username: username.trim().toLowerCase() },
    { $set: { salt, passwordHash, Void: "N" } },
    { upsert: true }
  );
  console.log("Admin account saved for: " + username.trim().toLowerCase());
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
