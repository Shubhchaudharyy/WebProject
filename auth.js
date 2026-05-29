/* ShopVerse authentication (client-side demo) */
const USERS_KEY = "shopverse_users";
const SESSION_KEY = "shopverse_session";
const ORDERS_KEY = "shopverse_orders";

/* Password encode */
function hashPassword(pw) {
  return btoa(unescape(encodeURIComponent(pw)));
}

/* Default Users */
function initDefaultUsers() {

  const defaults = [
    {
      name: "Shubh",
      email: "shubh.madhyan00@gmail.com",
      password: hashPassword("shubh@123"),
      role: "admin"
    },

    {
      name: "Demo User",
      email: "user@shopverse.com",
      password: hashPassword("user123"),
      role: "user"
    }
  ];

  /* FORCE RESET USERS */
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(defaults)
    );
  }
}

/* Get users */
function getUsers() {

  try {
    return JSON.parse(
      localStorage.getItem(USERS_KEY)
    ) || [];

  } catch {

    return [];
  }
}

/* Save users */
function saveUsers(users) {

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}

/* Get session */
function getSession() {

  try {

    const s = JSON.parse(
      localStorage.getItem(SESSION_KEY)
    );

    if (!s || !s.email)
      return null;

    return {
      email: s.email,
      name: s.name || "User",
      role: s.role || "user"
    };

  } catch {

    return null;
  }
}

/* Set session */
function setSession(user) {

  localStorage.setItem(
    SESSION_KEY,

    JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role
    })
  );
}

/* Logout */
function clearSession() {

  localStorage.removeItem(
    SESSION_KEY
  );
}

/* Register */
function registerUser(name, email, password) {

  const users = getUsers();

  if (
    users.some(
      (u) =>
        u.email.toLowerCase()
        === email.toLowerCase()
    )
  ) {

    return {
      ok: false,
      message: "Email already registered"
    };
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

/* Login */
function loginUser(email, password, expectedRole) {

  const user = getUsers().find(
    (u) =>
      u.email.toLowerCase()
      === email.toLowerCase()
  );

  if (
    !user ||
    user.password !== hashPassword(password)
  ) {

    return {
      ok: false,
      message: "Invalid email or password"
    };
  }

  if (
    expectedRole &&
    user.role !== expectedRole
  ) {

    return {
      ok: false,
      message:
        expectedRole === "admin"
          ? "Not an admin account"
          : "Use the customer login"
    };
  }

  setSession(user);

  return {
    ok: true,
    user
  };
}

/* Logout */
function logoutUser() {

  clearSession();

  window.location.href = "index.html";
}

window.logoutUser = logoutUser;

/* Require login */
function requireLogin(redirectPage) {

  if (!getSession()) {

    window.location.href =
      "login.html?redirect="
      + encodeURIComponent(
          redirectPage || "index.html"
        );

    return false;
  }

  return true;
}

/* Require admin */
function requireAdmin() {

  const session = getSession();

  if (
    !session ||
    session.role !== "admin"
  ) {

    window.location.href =
      "login.html?role=admin&redirect=admin.html";

    return false;
  }

  return true;
}

/* Save order */
function saveOrder(order) {

  const orders = JSON.parse(
    localStorage.getItem(ORDERS_KEY)
    || "[]"
  );

  orders.unshift(order);

  localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders)
  );
}

/* Get orders */
function getOrders() {

  try {

    return JSON.parse(
      localStorage.getItem(ORDERS_KEY)
    ) || [];

  } catch {

    return [];
  }
}

/* Orders for user */
function getOrdersForUser(email) {

  return getOrders().filter(
    (o) => o.userEmail === email
  );
}

/* Cancel order */
function cancelOrder(orderId, userEmail) {

  const orders = getOrders();

  const order = orders.find(
    (o) =>
      o.id === orderId &&
      o.userEmail === userEmail
  );

  if (!order) {

    return {
      ok: false,
      message: "Order not found"
    };
  }

  if (order.status === "cancelled") {

    return {
      ok: false,
      message: "Order is already cancelled"
    };
  }

  order.status = "cancelled";

  order.cancelledAt =
    new Date().toISOString();

  localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(orders)
  );

  return { ok: true };
}

window.cancelOrder = cancelOrder;

/* Initialize */
initDefaultUsers();