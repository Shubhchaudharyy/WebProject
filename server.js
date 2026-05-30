try {
  require("dotenv").config();
} catch {
  console.warn("dotenv is not installed; using Render environment variables only.");
}

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const sessionSecret = process.env.SESSION_SECRET || "shopverse-dev-secret";
const mongoUri = process.env.MONGODB_URI || "";

let dbReady = false;
let dbLastError = null;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: { type: Array, default: [] },
    address: { type: Object, default: {} },
    payment: { type: String, default: "cod" },
    bill: { type: Object, default: null },
    total: { type: Number, default: 0 },
    status: { type: String, default: "placed" },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : true,
    credentials: true
  })
);
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: dbReady ? "ready" : "not_ready",
    storage: "mongodb-atlas",
    error: dbReady ? null : dbLastError,
    config: {
      mongodbUriSet: Boolean(mongoUri),
      corsOriginSet: Boolean(process.env.CORS_ORIGIN),
      nodeEnv: process.env.NODE_ENV || "development"
    }
  });
});

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, savedHash) {
  const [salt, hash] = String(savedHash || "").split(":");
  if (!salt || !hash) return false;

  const check = hashPassword(password, salt).split(":")[1];

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
  } catch {
    return false;
  }
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt
  };
}

function signSession(user) {
  const payload = Buffer.from(JSON.stringify(publicUser(user))).toString("base64url");
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function readCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function getSession(req) {
  const token = readCookies(req).shopverse_session;
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  const expected = crypto
    .createHmac("sha256", sessionSecret)
    .update(payload)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function setSessionCookie(res, user) {
  const secure = process.env.NODE_ENV === "production";
  res.cookie("shopverse_session", signSession(user), {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie("shopverse_session", { path: "/" });
}

function requireDb(req, res, next) {
  if (!dbReady) {
    res.status(503).json({
      message: "Database is not ready. Check MONGODB_URI on Render."
    });
    return;
  }

  next();
}

function requireUser(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ message: "Login required" });
    return;
  }

  req.user = session;
  next();
}

function requireAdmin(req, res, next) {
  requireUser(req, res, () => {
    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    next();
  });
}

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

async function seedDefaultUsers() {
  const defaults = [
    ["ShopVerse Admin", "admin@shopverse.com", "admin123", "admin"],
    ["Shubh", "shubh.madhyan00@gmail.com", "shubh@123", "admin"],
    ["Demo User", "user@shopverse.com", "user123", "user"]
  ];

  for (const [name, email, password, role] of defaults) {
    const existing = await User.findOne({ email });

    if (!existing) {
      await User.create({
        name,
        email,
        passwordHash: hashPassword(password),
        role
      });
      console.log(`Seeded ${role} user: ${email}`);
    } else if (existing.role !== role) {
      existing.role = role;
      await existing.save();
      console.log(`Updated seeded user role: ${email}`);
    }
  }
}

function mapOrder(order) {
  return {
    id: order.orderId,
    userEmail: order.userEmail,
    userName: order.userName,
    items: order.items || [],
    address: order.address || {},
    payment: order.payment,
    bill: order.bill,
    total: Number(order.total || 0),
    status: order.status,
    cancelledAt: order.cancelledAt,
    date: order.createdAt
  };
}

app.get("/api/auth/session", (req, res) => {
  res.json({ user: getSession(req) });
});

app.post("/api/auth/register", requireDb, asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    res.status(400).json({ message: "Enter name, email and a 6 character password" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: "user"
  });

  setSessionCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

app.post("/api/auth/login", requireDb, asyncRoute(async (req, res) => {
  const { email, password, expectedRole } = req.body;
  const user = await User.findOne({
    email: String(email || "").trim().toLowerCase()
  });

  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (expectedRole && user.role !== expectedRole) {
    res.status(403).json({
      message: expectedRole === "admin" ? "Not an admin account" : "Use the customer login"
    });
    return;
  }

  setSessionCookie(res, user);
  res.json({ user: publicUser(user) });
}));

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post("/api/auth/change-password", requireDb, requireUser, asyncRoute(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (!user || !verifyPassword(currentPassword || "", user.passwordHash)) {
    res.status(400).json({ message: "Current password is incorrect" });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "New password must be at least 6 characters" });
    return;
  }

  user.passwordHash = hashPassword(newPassword);
  await user.save();
  res.json({ message: "Password changed successfully" });
}));

app.get("/api/admin/users", requireDb, requireAdmin, asyncRoute(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
}));

app.get("/api/admin/orders", requireDb, requireAdmin, asyncRoute(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json({ orders: orders.map(mapOrder) });
}));

app.get("/api/orders", requireDb, requireUser, asyncRoute(async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ orders: orders.map(mapOrder) });
}));

app.post("/api/orders", requireDb, requireUser, asyncRoute(async (req, res) => {
  const order = req.body;
  const orderId = "SV" + Date.now().toString(36).toUpperCase();

  await Order.create({
    orderId,
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
    items: order.items || [],
    address: order.address || {},
    payment: order.payment || "cod",
    bill: order.bill || null,
    total: Number(order.total || 0)
  });

  res.status(201).json({ id: orderId });
}));

app.post("/api/orders/:id/cancel", requireDb, requireUser, asyncRoute(async (req, res) => {
  const order = await Order.findOne({
    orderId: req.params.id,
    userId: req.user.id,
    status: { $ne: "cancelled" }
  });

  if (!order) {
    res.status(404).json({ message: "Order not found or already cancelled" });
    return;
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  await order.save();
  res.json({ ok: true });
}));

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  if (err.code === 11000) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  res.status(500).json({ message: "Server error" });
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

async function connectDatabase() {
  if (!mongoUri) {
    dbReady = false;
    dbLastError = "MONGODB_URI is missing";
    console.error(dbLastError);
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    dbReady = true;
    dbLastError = null;
    console.log("MongoDB connected.");
    await seedDefaultUsers();
  } catch (err) {
    dbReady = false;
    dbLastError = err.message;
    console.error("MongoDB connection failed:", err.message);
  }
}

mongoose.connection.on("disconnected", () => {
  dbReady = false;
  dbLastError = "MongoDB disconnected";
  console.warn("MongoDB disconnected.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ShopVerse running on port ${port}`);
  connectDatabase();
});
