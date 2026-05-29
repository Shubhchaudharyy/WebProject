/* ShopVerse – cart & checkout */
const CART_KEY = "shopverse_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  renderCartPanel();
}

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = total;
  badge.hidden = total === 0;
}

function addToCart(name, price, image, mrp, id) {
  const product = id ? getProductById(id) : getProductByName(name);
  const cart = getCart();
  const existing = cart.find((item) => item.name === name);
  const itemMrp = mrp || product?.mrp || Math.round(price * 1.4);
  const itemId = id || product?.id || name;

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: itemId,
      name,
      price: Number(price),
      mrp: Number(itemMrp),
      image,
      qty: 1
    });
  }
  saveCart(cart);
  showToast(name + " added to cart");
}

function removeFromCart(name) {
  saveCart(getCart().filter((item) => item.name !== name));
}

function changeQty(name, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(name);
  else saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function toggleCart() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  if (!panel) return;
  const open = panel.classList.toggle("open");
  if (overlay) overlay.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
}

function closeCart() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  if (panel) panel.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function escapeAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function renderCartPanel() {
  const list = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!list) return;

  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  list.innerHTML = cart
    .map((item) => {
      const mrp = item.mrp || item.price * 1.4;
      const off = Math.round(((mrp - item.price) / mrp) * 100);
      return `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeAttr(item.name)}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <span>${formatPrice(item.price)} <small class="muted">${off}% off</small></span>
        <div class="qty-controls">
          <button type="button" onclick="changeQty('${escapeAttr(item.name)}', -1)">−</button>
          <span>${item.qty}</span>
          <button type="button" onclick="changeQty('${escapeAttr(item.name)}', 1)">+</button>
        </div>
      </div>
      <button type="button" class="cart-remove" onclick="removeFromCart('${escapeAttr(item.name)}')">×</button>
    </div>`;
    })
    .join("");

  const bill = typeof calculateBill === "function" ? calculateBill(cart) : null;
  if (totalEl) {
    totalEl.textContent = formatPrice(bill ? bill.total : cartTotal());
  }
}

function searchItems() {
  const input = document.getElementById("search");
  if (!input) return;
  const query = input.value.toLowerCase().trim();
  document.querySelectorAll(".card[data-search], .product-tile[data-search], .cat-chip[data-search]").forEach((card) => {
    const text = (card.getAttribute("data-search") || card.innerText).toLowerCase();
    const show = !query || text.includes(query);
    card.style.display = show ? "" : "none";
    if (card.classList.contains("card") || card.classList.contains("product-tile")) {
      card.style.display = show ? "flex" : "none";
    }
  });
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast("Add items to cart first");
    return;
  }
  if (typeof getSession === "function" && !getSession()) {
    window.location.href = "login.html?redirect=checkout.html";
    return;
  }
  window.location.href = "checkout.html";
}

function getCartPanelHtml() {
  return `
<div id="cart-overlay" class="cart-overlay"></div>
<aside id="cart-panel" class="cart-panel">
  <div class="cart-header">
    <h2>Your Cart</h2>
    <button type="button" class="cart-close" onclick="closeCart()">×</button>
  </div>
  <div id="cart-items"></div>
  <div class="cart-footer">
    <div class="total-row"><span>Total</span><span id="cart-total">₹0</span></div>
    <button type="button" class="btn-checkout" onclick="checkout()">Proceed to Buy</button>
    <button type="button" class="btn-clear" onclick="clearCart()">Clear Cart</button>
  </div>
</aside>`;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartPanel();
  const overlay = document.getElementById("cart-overlay");
  if (overlay) overlay.addEventListener("click", closeCart);

  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q && document.getElementById("search")) {
    document.getElementById("search").value = q;
    searchItems();
  }
});
