try {
  require("dotenv").config();
} catch {
  console.warn("dotenv is not installed; using Render environment variables only.");
}

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const sessionSecret = process.env.SESSION_SECRET || "shopverse-dev-secret";

let nextUserId = 4;
const users = [
  {
    id: 1,
    name: "ShopVerse Admin",
    email: "admin@shopverse.com",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Shubh",
    email: "shubh.madhyan00@gmail.com",
    passwordHash: hashPassword("shubh@123"),
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Demo User",
    email: "user@shopverse.com",
    passwordHash: hashPassword("user123"),
    role: "user",
    createdAt: new Date().toISOString()
  }
];

const orders = [];

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
    database: "disabled",
    storage: "temporary-memory",
    users: users.length,
    orders: orders.length
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
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}

function publicUser(user) {
  return {
    id: user.id,
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

function findUserByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email || "").trim().toLowerCase());
}

app.get("/api/auth/session", (req, res) => {
  res.json({ user: getSession(req) });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password || password.length < 6) {
    res.status(400).json({ message: "Enter name, email and a 6 character password" });
    return;
  }

  if (findUserByEmail(email)) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const user = {
    id: nextUserId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    role: "user",
    createdAt: new Date().toISOString()
  };

  users.push(user);
  setSessionCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password, expectedRole } = req.body;
  const user = findUserByEmail(email);

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
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.post("/api/auth/change-password", requireUser, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = users.find((item) => item.id === req.user.id);

  if (!user || !verifyPassword(currentPassword || "", user.passwordHash)) {
    res.status(400).json({ message: "Current password is incorrect" });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "New password must be at least 6 characters" });
    return;
  }

  user.passwordHash = hashPassword(newPassword);
  res.json({ message: "Password changed successfully" });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json({
    users: users
      .map(publicUser)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  });
});

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  res.json({ orders });
});

app.get("/api/orders", requireUser, (req, res) => {
  res.json({
    orders: orders.filter((order) => order.userEmail === req.user.email)
  });
});

app.post("/api/orders", requireUser, (req, res) => {
  const order = req.body;
  const id = "SV" + Date.now().toString(36).toUpperCase();

  orders.unshift({
    id,
    userEmail: req.user.email,
    userName: req.user.name,
    items: order.items || [],
    address: order.address || {},
    payment: order.payment || "cod",
    bill: order.bill || null,
    total: Number(order.total || 0),
    status: "placed",
    date: new Date().toISOString()
  });

  res.status(201).json({ id });
});

app.post("/api/orders/:id/cancel", requireUser, (req, res) => {
  const order = orders.find(
    (item) => item.id === req.params.id && item.userEmail === req.user.email
  );

  if (!order || order.status === "cancelled") {
    res.status(404).json({ message: "Order not found or already cancelled" });
    return;
  }

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Server error" });
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ShopVerse running on port ${port}`);
  console.log("MySQL disabled temporarily. Using in-memory users/orders.");
});
