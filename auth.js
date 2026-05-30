/* ShopVerse authentication (client-side demo) */
const USERS_KEY = "shopverse_users";
const SESSION_KEY = "shopverse_session";
const ORDERS_KEY = "shopverse_orders";

function hashPassword(pw) {
  return btoa(unescape(encodeURIComponent(pw)));
}

function initDefaultUsers() {
  const users = getUsers();
  if (users.length > 0) return;
  const defaults = [
    { name: "Admin", email: "admin@shopverse.com", password: hashPassword("admin123"), role: "admin" },
    { name: "Demo User", email: "user@shopverse.com", password: hashPassword("user123"), role: "user" }
  ];
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!s || !s.email) return null;
    return {
      email: s.email,
      name: s.name || "User",
      role: s.role || "user"
    };
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ email: user.email, name: user.name, role: user.role })
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function registerUser(name, email, password) {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, message: "Email already registered" };
  }
  users.push({
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role: "user"
  });
  saveUsers(users);
  return { ok: true };
}

function loginUser(email, password, expectedRole) {
  const user = getUsers().find((u) => u.email === email.toLowerCase());
  if (!user || user.password !== hashPassword(password)) {
    return { ok: false, message: "Invalid email or password" };
  }
  if (expectedRole && user.role !== expectedRole) {
    return {
      ok: false,
      message: expectedRole === "admin" ? "Not an admin account" : "Use the customer login"
    };
  }
  setSession(user);
  return { ok: true, user };
}

function logoutUser() {
  clearSession();
  window.location.href = "index.html";
}

window.logoutUser = logoutUser;

function requireLogin(redirectPage) {
  if (!getSession()) {
    window.location.href = "login.html?redirect=" + encodeURIComponent(redirectPage || "index.html");
    return false;
  }
  return true;
}

function requireAdmin() {
  const session = getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "login.html?role=admin&redirect=admin.html";
    return false;
  }
  return true;
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function getOrdersForUser(email) {
  return getOrders().filter((o) => o.userEmail === email);
}

function cancelOrder(orderId, userEmail) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId && o.userEmail === userEmail);
  if (!order) {
    return { ok: false, message: "Order not found" };
  }
  if (order.status === "cancelled") {
    return { ok: false, message: "Order is already cancelled" };
  }
  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return { ok: true };
}

window.cancelOrder = cancelOrder;

initDefaultUsers();
