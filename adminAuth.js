const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Dedicated admin accounts. Kept separate from the shared "Userdetails" collection so that
// customers of the other apps can never sign in to the admin area.
const AdminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    Void: { type: String, maxlength: 1, default: "N" },
  },
  { collection: "AvemsAdmin", timestamps: true }
);
const AdminUser = mongoose.models.AvemsAdmin || mongoose.model("AvemsAdmin", AdminUserSchema);

// Prefer an explicit secret. Without one, derive a stable secret from the DB connection string
// (stable across serverless instances, never present in the source code).
const SECRET =
  process.env.ADMIN_JWT_SECRET ||
  crypto.createHash("sha256").update("avems-admin:" + (process.env.MONGO_URL || "")).digest("hex");
const TOKEN_TTL = process.env.ADMIN_TOKEN_TTL || "8h";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function createAdmin(username, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return AdminUser.create({ username, salt, passwordHash: hashPassword(password, salt) });
}

function safeEqual(a, b) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ---- small in-memory throttle: 8 failed attempts / 15 min per IP + username ----
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
function throttleKey(req, username) {
  return (req.ip || "") + "|" + username;
}
function isBlocked(key) {
  const e = attempts.get(key);
  if (!e) return false;
  if (Date.now() - e.first > WINDOW_MS) { attempts.delete(key); return false; }
  return e.count >= MAX_FAILS;
}
function recordFail(key) {
  const e = attempts.get(key);
  if (!e || Date.now() - e.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else e.count += 1;
}

// POST /api/admin/login   { username, password }
router.post("/login", async (req, res) => {
  const username = String((req.body && req.body.username) || "").trim().toLowerCase();
  const password = String((req.body && req.body.password) || "");
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }
  const key = throttleKey(req, username);
  if (isBlocked(key)) {
    return res.status(429).json({ success: false, message: "Too many failed attempts. Please try again later." });
  }
  try {
    const admin = await AdminUser.findOne({ username, Void: { $ne: "Y" } }).lean();
    // Hash even when the user is missing so response time does not reveal valid usernames.
    const salt = admin ? admin.salt : "0".repeat(32);
    const candidate = hashPassword(password, salt);
    if (!admin || !safeEqual(candidate, admin.passwordHash)) {
      recordFail(key);
      return res.status(401).json({ success: false, message: "Incorrect username or password" });
    }
    attempts.delete(key);
    const token = jwt.sign({ sub: String(admin._id), username: admin.username, role: "admin" }, SECRET, { expiresIn: TOKEN_TTL });
    return res.json({ success: true, message: "Login successful", data: { token, username: admin.username } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong", error: err.message });
  }
});

// Express middleware: requires "Authorization: Bearer <token>" of an admin.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== "admin") throw new Error("not admin");
    req.admin = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
  }
}

// GET /api/admin/me  -> validates the stored token
router.get("/me", requireAdmin, (req, res) => {
  res.json({ success: true, message: "Authenticated", data: { username: req.admin.username } });
});

module.exports = { router, requireAdmin, createAdmin, AdminUser };
