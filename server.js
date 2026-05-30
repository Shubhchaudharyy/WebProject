try {
  require("dotenv").config();
} catch {
  console.warn("dotenv is not installed; using Render environment variables only.");
}

const crypto = require("crypto");
const cors = loadRequiredPackage("cors");
const express = loadRequiredPackage("express");
const mysql = loadRequiredPackage("mysql2/promise");

function loadRequiredPackage(name) {
  try {
    return require(name);
  } catch (err) {
    console.error(`Missing required package "${name}". Check Render Build Command and service root.`);
    throw err;
  }
}

const app = express();
const port = parsePositiveInt(process.env.PORT, 3000);
const sessionSecret = process.env.SESSION_SECRET || "shopverse-dev-secret";
const dbRetryMs = parsePositiveInt(process.env.DB_RETRY_MS, 15000);

let db = null;
let dbReady = false;
let dbLastError = null;
let dbInitInProgress = false;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDbConfig() {
  const config = {
    host: process.env.MYSQL_HOST || "localhost",
    port: parsePositiveInt(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "shopverse",
    waitForConnections: true,
    connectionLimit: parsePositiveInt(process.env.MYSQL_CONNECTION_LIMIT, 10),
    connectTimeout: parsePositiveInt(process.env.MYSQL_CONNECT_TIMEOUT_MS, 10000)
  };

  if (process.env.MYSQL_SSL === "true") {
    config.ssl = {
      rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === "true"
    };
  }

  return config;
}

function getDb() {
  if (!db) {
    const config = getDbConfig();
    console.log("Creating MySQL pool:", {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      ssl: Boolean(config.ssl),
      hasPassword: Boolean(config.password)
    });
    db = mysql.createPool(config);
  }

  return db;
}

function logStartupConfig() {
  console.log("Startup config:", {
    nodeEnv: process.env.NODE_ENV || "development",
    port,
    dbRetryMs,
    mysqlHost: process.env.MYSQL_HOST || "localhost",
    mysqlPort: parsePositiveInt(process.env.MYSQL_PORT, 3306),
    mysqlUserSet: Boolean(process.env.MYSQL_USER),
    mysqlPasswordSet: Boolean(process.env.MYSQL_PASSWORD),
    mysqlDatabase: process.env.MYSQL_DATABASE || "shopverse",
    mysqlSsl: process.env.MYSQL_SSL === "true",
    corsOrigin: process.env.CORS_ORIGIN || "any"
  });
}

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
    error: dbReady || !dbLastError ? null : dbLastError,
    config: {
      mysqlHostSet: Boolean(process.env.MYSQL_HOST),
      mysqlUserSet: Boolean(process.env.MYSQL_USER),
      mysqlPasswordSet: Boolean(process.env.MYSQL_PASSWORD),
      mysqlDatabaseSet: Boolean(process.env.MYSQL_DATABASE),
      corsOriginSet: Boolean(process.env.CORS_ORIGIN)
    }
  });
});

function asyncRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function requireDb(req, res, next) {
  if (!dbReady) {
    res.status(503).json({
      message:
        "Database is not ready. Check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE on Render."
    });
    return;
  }

  next();
}

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

function signSession(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
  ).toString("base64url");

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

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
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

async function seedDefaultUsers() {
  const defaults = [
    ["ShopVerse Admin", "admin@shopverse.com", "admin123", "admin"],
    ["Shubh", "shubh.madhyan00@gmail.com", "shubh@123", "admin"],
    ["Demo User", "user@shopverse.com", "user123", "user"]
  ];

  for (const [name, email, password, role] of defaults) {
    await getDb().query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [name, email, hashPassword(password), role]
    );
  }
}

async function ensureTables() {
  await getDb().query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await getDb().query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(40) PRIMARY KEY,
      user_id INT NOT NULL,
      user_email VARCHAR(190) NOT NULL,
      user_name VARCHAR(120) NOT NULL,
      items_json JSON NOT NULL,
      address_json JSON NOT NULL,
      payment VARCHAR(40) NOT NULL,
      bill_json JSON NULL,
      total DECIMAL(12, 2) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'placed',
      cancelled_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

async function initializeDatabase() {
  if (dbInitInProgress) return;

  dbInitInProgress = true;
  console.log("Checking MySQL connection...");

  try {
    await getDb().query("SELECT 1");
    console.log("MySQL connection check passed.");
    await ensureTables();
    console.log("MySQL tables are ready.");
    await seedDefaultUsers();
    dbReady = true;
    dbLastError = null;
    console.log("Default users seeded. MySQL connected and initialized.");
  } catch (err) {
    dbReady = false;
    dbLastError = err.message;
    console.error("MySQL is not ready yet:", {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      host: process.env.MYSQL_HOST || "localhost",
      port: parsePositiveInt(process.env.MYSQL_PORT, 3306),
      database: process.env.MYSQL_DATABASE || "shopverse"
    });
  } finally {
    dbInitInProgress = false;
  }
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

  try {
    const [result] = await getDb().query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
      [name.trim(), email.trim().toLowerCase(), hashPassword(password)]
    );
    const user = {
      id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "user"
    };
    setSessionCookie(res, user);
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
    res.status(500).json({ message: "Could not register user" });
  }
}));

app.post("/api/auth/login", requireDb, asyncRoute(async (req, res) => {
  const { email, password, expectedRole } = req.body;
  const [rows] = await getDb().query("SELECT * FROM users WHERE email = ?", [
    String(email || "").trim().toLowerCase()
  ]);
  const user = rows[0];

  if (!user || !verifyPassword(password || "", user.password_hash)) {
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

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "New password must be at least 6 characters" });
    return;
  }

  const [rows] = await getDb().query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  const user = rows[0];

  if (!user || !verifyPassword(currentPassword || "", user.password_hash)) {
    res.status(400).json({ message: "Current password is incorrect" });
    return;
  }

  await getDb().query("UPDATE users SET password_hash = ? WHERE id = ?", [
    hashPassword(newPassword),
    req.user.id
  ]);
  res.json({ message: "Password changed successfully" });
}));

app.get("/api/admin/users", requireDb, requireAdmin, asyncRoute(async (req, res) => {
  const [rows] = await getDb().query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ users: rows });
}));

app.get("/api/admin/orders", requireDb, requireAdmin, asyncRoute(async (req, res) => {
  const [rows] = await getDb().query("SELECT * FROM orders ORDER BY created_at DESC");
  res.json({ orders: rows.map(mapOrder) });
}));

app.get("/api/orders", requireDb, requireUser, asyncRoute(async (req, res) => {
  const [rows] = await getDb().query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json({ orders: rows.map(mapOrder) });
}));

app.post("/api/orders", requireDb, requireUser, asyncRoute(async (req, res) => {
  const order = req.body;
  const id = "SV" + Date.now().toString(36).toUpperCase();

  await getDb().query(
    `INSERT INTO orders
      (id, user_id, user_email, user_name, items_json, address_json, payment, bill_json, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.user.id,
      req.user.email,
      req.user.name,
      JSON.stringify(order.items || []),
      JSON.stringify(order.address || {}),
      order.payment || "cod",
      JSON.stringify(order.bill || null),
      Number(order.total || 0)
    ]
  );

  res.status(201).json({ id });
}));

app.post("/api/orders/:id/cancel", requireDb, requireUser, asyncRoute(async (req, res) => {
  const [result] = await getDb().query(
    `UPDATE orders
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE id = ? AND user_id = ? AND status <> 'cancelled'`,
    [req.params.id, req.user.id]
  );

  if (!result.affectedRows) {
    res.status(404).json({ message: "Order not found or already cancelled" });
    return;
  }

  res.json({ ok: true });
}));

function mapOrder(row) {
  return {
    id: row.id,
    userEmail: row.user_email,
    userName: row.user_name,
    items: typeof row.items_json === "string" ? JSON.parse(row.items_json) : row.items_json,
    address:
      typeof row.address_json === "string" ? JSON.parse(row.address_json) : row.address_json,
    payment: row.payment,
    bill: typeof row.bill_json === "string" ? JSON.parse(row.bill_json) : row.bill_json,
    total: Number(row.total),
    status: row.status,
    cancelledAt: row.cancelled_at,
    date: row.created_at
  };
}

app.use((err, req, res, next) => {
  console.error(err);
  const dbErrorCodes = new Set([
    "PROTOCOL_CONNECTION_LOST",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ECONNRESET"
  ]);

  if (dbErrorCodes.has(err.code)) {
    dbReady = false;
    dbLastError = err.message;
    res.status(503).json({ message: "Database connection failed. Retrying shortly." });
    return;
  }

  res.status(500).json({ message: "Server error" });
});

function startServer() {
  try {
    logStartupConfig();

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`ShopVerse running on port ${port}`);
      initializeDatabase();
      setInterval(() => {
        if (!dbReady) initializeDatabase();
      }, dbRetryMs);
    });

    server.on("error", (err) => {
      console.error("HTTP server failed to start:", {
        message: err.message,
        code: err.code,
        port
      });
    });
  } catch (err) {
    console.error("Startup failed before app.listen completed:", err);
  }
}

startServer();
