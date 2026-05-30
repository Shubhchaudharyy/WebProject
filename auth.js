/* ShopVerse authentication backed by MySQL API */
let currentSession = null;
let sessionLoaded = false;

const DEMO_USERS = [
  {
    id: 1,
    name: "ShopVerse Admin",
    email: "admin@shopverse.com",
    password: "admin123",
    role: "admin"
  },
  {
    id: 2,
    name: "Demo User",
    email: "user@shopverse.com",
    password: "user123",
    role: "user"
  }
];

function readDemoSession() {
  const match = document.cookie.match(/(?:^|; )shopverse_demo_session=([^;]+)/);
  if (!match) return null;

  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function setDemoSession(user) {
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  document.cookie =
    "shopverse_demo_session="
    + encodeURIComponent(JSON.stringify(session))
    + "; path=/; max-age=604800; SameSite=Lax";

  currentSession = session;
  sessionLoaded = true;
}

function clearDemoSession() {
  document.cookie = "shopverse_demo_session=; path=/; max-age=0; SameSite=Lax";
}

async function getSession() {
  if (sessionLoaded) return currentSession;

  try {
    const data = await apiFetch("/api/auth/session");
    currentSession = data.user || null;
  } catch {
    currentSession = readDemoSession();
  }

  sessionLoaded = true;
  return currentSession;
}

async function refreshSession() {
  sessionLoaded = false;
  return getSession();
}

async function registerUser(name, email, password) {
  try {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    currentSession = data.user;
    sessionLoaded = true;
    return { ok: true, user: data.user };
  } catch (err) {
    if (
      err.message.includes("Backend") ||
      err.message.includes("configured") ||
      err.message.includes("Request failed")
    ) {
      return {
        ok: false,
        message:
          "Backend is offline. Use demo admin: admin@shopverse.com / admin123, or start the MySQL server."
      };
    }

    return { ok: false, message: err.message };
  }
}

async function loginUser(email, password, expectedRole) {
  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, expectedRole })
    });
    currentSession = data.user;
    sessionLoaded = true;
    return { ok: true, user: data.user };
  } catch (err) {
    const demoUser = DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === String(email || "").trim().toLowerCase() &&
        u.password === password &&
        (!expectedRole || u.role === expectedRole)
    );

    if (demoUser) {
      setDemoSession(demoUser);
      return {
        ok: true,
        user: currentSession,
        demo: true
      };
    }

    return { ok: false, message: err.message };
  }
}

async function changePassword(email, currentPassword, newPassword) {
  try {
    const data = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return { ok: true, message: data.message };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

async function logoutUser() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    currentSession = null;
    sessionLoaded = true;
    clearDemoSession();
    window.location.href = "index.html";
  }
}

async function requireLogin(redirectPage) {
  if (!(await getSession())) {
    window.location.href =
      "login.html?redirect="
      + encodeURIComponent(redirectPage || "index.html");

    return false;
  }

  return true;
}

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    window.location.href =
      "login.html?role=admin&redirect=admin.html";

    return false;
  }

  return true;
}

async function getUsers() {
  try {
    const data = await apiFetch("/api/admin/users");
    return data.users || [];
  } catch {
    return DEMO_USERS.map(({ password, ...user }) => user);
  }
}

async function getOrders() {
  try {
    const data = await apiFetch("/api/admin/orders");
    return data.orders || [];
  } catch {
    return [];
  }
}

async function getOrdersForUser() {
  try {
    const data = await apiFetch("/api/orders");
    return data.orders || [];
  } catch {
    return [];
  }
}

async function saveOrder(order) {
  const data = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });

  return data.id;
}

async function cancelOrder(orderId) {
  try {
    await apiFetch("/api/orders/" + encodeURIComponent(orderId) + "/cancel", {
      method: "POST"
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

window.getSession = getSession;
window.refreshSession = refreshSession;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.changePassword = changePassword;
window.logoutUser = logoutUser;
window.requireLogin = requireLogin;
window.requireAdmin = requireAdmin;
window.getUsers = getUsers;
window.getOrders = getOrders;
window.getOrdersForUser = getOrdersForUser;
window.saveOrder = saveOrder;
window.cancelOrder = cancelOrder;
