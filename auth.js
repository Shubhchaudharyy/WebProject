/* ShopVerse authentication backed by the persistent API */
let currentSession = null;
let sessionLoaded = false;

async function getSession() {
  if (sessionLoaded) return currentSession;

  try {
    const data = await apiFetch("/api/auth/session");
    currentSession = data.user || null;
  } catch {
    currentSession = null;
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
  const data = await apiFetch("/api/admin/users");
  return data.users || [];
}

async function getOrders() {
  const data = await apiFetch("/api/admin/orders");
  return data.orders || [];
}

async function getOrdersForUser() {
  const data = await apiFetch("/api/orders");
  return data.orders || [];
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
