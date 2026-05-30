/* Shared UI: header, product cards, homepage sections */
function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

async function renderSiteHeader(options = {}) {
  const session = typeof getSession === "function" ? await getSession() : null;
  const searchPlaceholder = options.searchPlaceholder || "Search products, brands and more";
  const showNav = options.showCategoryNav !== false;

  let accountHtml;
  if (session) {
    accountHtml = `
      <div class="account-menu">
        <button type="button" class="nav-link-btn account-trigger">Hello, ${escapeHtml((session.name || "User").split(" ")[0])} ▾</button>
        <div class="account-dropdown">
          <span class="dropdown-email">${escapeHtml(session.email)}</span>
          <a href="orders.html">Your Orders</a>
          ${session.role === "admin"
? '<a href="admin.html">Admin Panel</a>'
: ""}
          <button type="button" onclick="logoutUser()">Sign Out</button>
        </div>
      </div>`;
  } else {
    accountHtml = `<a href="login.html" class="nav-link-btn">Login</a>`;
  }

  const categoryLinks = CATEGORY_META.map(
    (c) => `<a href="${c.page}">${c.label}</a>`
  ).join("");

  return `
  <div class="top-bar">Free delivery on orders above ₹499 · ShopVerse Sale ends soon!</div>
  <header class="site-header">
    <div class="header-main">
      <a href="index.html" class="logo">ShopVerse</a>
      <div class="search-wrap">
        <input type="text" id="search" class="search-global" placeholder="${searchPlaceholder}" aria-label="Search">
        <button type="button" class="search-btn" onclick="globalSearch()">🔍</button>
      </div>
      <nav class="header-actions">
        ${accountHtml}
        ${session && session.role === "admin" ? '<a href="admin.html" class="nav-link-btn dashboard-link">Dashboard</a>' : ""}
        ${session ? '<button type="button" class="nav-link-btn logout-btn" onclick="logoutUser()">Logout</button>' : ""}
        <a href="orders.html" class="nav-link-btn">Orders</a>
        <button type="button" class="cart-btn" onclick="toggleCart()">🛒 Cart <span id="cart-count" hidden>0</span></button>
      </nav>
    </div>
    ${showNav ? `<nav class="category-nav">${categoryLinks}<a href="index.html#deals">Deals</a><a href="index.html#trending">Trending</a></nav>` : ""}
  </header>`;
}

async function injectHeader(targetId, options) {
  const target = document.getElementById(targetId || "site-header");
  if (!target) return;
  target.innerHTML = await renderSiteHeader(options);
  bindAccountMenu();
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("keydown", (e) => {
      if (e.key === "Enter") globalSearch();
    });
    if (typeof searchItems === "function") {
      search.addEventListener("input", searchItems);
    }
  }
}

function bindAccountMenu() {
  document.querySelectorAll(".account-trigger").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.parentElement.classList.toggle("open");
    });
  });
  document.querySelectorAll(".account-dropdown").forEach((menu) => {
    menu.addEventListener("click", (e) => e.stopPropagation());
  });
  if (!document.body.dataset.accountMenuBound) {
    document.body.dataset.accountMenuBound = "1";
    document.addEventListener("click", () => {
      document.querySelectorAll(".account-menu.open").forEach((m) => m.classList.remove("open"));
    });
  }
}

function globalSearch() {
  const q = (document.getElementById("search")?.value || "").trim().toLowerCase();
  if (!q) return;
  const match = SHOP_PRODUCTS.find(
    (p) => p.name.toLowerCase().includes(q) || p.category.includes(q)
  );
  const cat = CATEGORY_META.find((c) => c.label.toLowerCase().includes(q) || c.slug.includes(q));
  if (cat) {
    window.location.href = cat.page + (q ? "?q=" + encodeURIComponent(q) : "");
  } else if (match) {
    const page = CATEGORY_META.find((c) => c.slug === match.category)?.page;
    window.location.href = (page || "index.html") + "?q=" + encodeURIComponent(q);
  } else {
    window.location.href = "index.html?q=" + encodeURIComponent(q);
  }
}

function productCardHtml(p, compact) {
  const off = discountPercent(p.mrp, p.price);
  return `
    <article class="product-tile ${compact ? "compact" : ""}" data-search="${escapeHtml(p.name.toLowerCase() + " " + p.category)}">
      <div class="tile-badge">${off}% off</div>
      <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
      <h4>${escapeHtml(p.name)}</h4>
      <div class="rating">★ ${p.rating}</div>
      <div class="tile-prices">
        <span class="tile-price">₹${p.price.toLocaleString("en-IN")}</span>
        <span class="tile-mrp">₹${p.mrp.toLocaleString("en-IN")}</span>
      </div>
      <button type="button" class="btn-add" onclick="addProductToCart('${p.id}')">Add to Cart</button>
    </article>`;
}

function addProductToCart(id) {
  const p = getProductById(id);
  if (!p) return;
  addToCart(p.name, p.price, p.image, p.mrp, p.id);
}

function renderProductRow(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = products.map((p) => productCardHtml(p, true)).join("");
}

function renderHomeSections() {
  TRENDING_COLLECTIONS.forEach((col, i) => {
    const section = document.getElementById("trend-section-" + i);
    if (!section) return;
    let products;
    if (col.ids) products = col.ids.map(getProductById).filter(Boolean);
    else if (col.tag) products = getProductsByTag(col.tag);
    else if (col.sort === "rating") products = getTopRated(10);
    else products = SHOP_PRODUCTS.slice(0, 8);

    section.innerHTML = `
      <div class="section-head">
        <h2>${col.title}</h2>
        ${col.timer ? '<div class="flash-timer" id="flash-timer">Ends in <span>05:59:42</span></div>' : ""}
        <a href="index.html#categories">See all</a>
      </div>
      <div class="product-scroll">${products.map((p) => productCardHtml(p, true)).join("")}</div>`;
  });
  startFlashTimer();
}

function startFlashTimer() {
  const span = document.querySelector("#flash-timer span");
  if (!span) return;
  let sec = 5 * 3600 + 59 * 60 + 42;
  setInterval(() => {
    sec = Math.max(0, sec - 1);
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    span.textContent = h + ":" + m + ":" + s;
  }, 1000);
}

function initCarousel() {
  const slides = document.querySelectorAll(".carousel-slide");
  const dots = document.querySelectorAll(".carousel-dot");
  if (!slides.length) return;
  let idx = 0;
  function go(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  }
  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
  document.querySelector(".carousel-prev")?.addEventListener("click", () => go(idx - 1));
  document.querySelector(".carousel-next")?.addEventListener("click", () => go(idx + 1));
  setInterval(() => go(idx + 1), 5000);
}

function initCartMount() {
  const mount = document.getElementById("cart-mount");
  if (!mount || mount.dataset.ready === "1") return;
  if (typeof getCartPanelHtml !== "function") return;
  mount.innerHTML = getCartPanelHtml();
  mount.dataset.ready = "1";
  if (typeof updateCartBadge === "function") updateCartBadge();
  if (typeof renderCartPanel === "function") renderCartPanel();
  const overlay = document.getElementById("cart-overlay");
  if (overlay && !overlay.dataset.bound) {
    overlay.dataset.bound = "1";
    overlay.addEventListener("click", closeCart);
  }
}

async function initCategoryPage(categorySlug, title, emoji) {
  await injectHeader("site-header", {
    searchPlaceholder: "Search in " + title + "..."
  });
  const grid = document.getElementById("product-grid");
  if (grid) {
    const products = getProductsByCategory(categorySlug);
    grid.innerHTML = products.map((p) => productCardHtml(p)).join("");
  }
  const heading = document.getElementById("cat-title");
  if (heading) heading.textContent = (emoji || "") + " " + title + " Collection";
  initCartMount();
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  if (q && document.getElementById("search")) {
    document.getElementById("search").value = q;
    searchItems();
  }
}

async function initSite() {
  const header = document.getElementById("site-header");
  if (header && !header.dataset.ready) {
    const showNav = document.body.getAttribute("data-auth") !== "login";
    await injectHeader("site-header", { showCategoryNav: showNav });
    header.dataset.ready = "1";
  }
  initCartMount();

  if (document.body.dataset.page === "home") {
    renderHomeSections();
    initCarousel();
    const cats = document.getElementById("category-strip");
    if (cats) {
      cats.innerHTML = CATEGORY_META.map(
        (c) => `
        <a href="${c.page}" class="cat-chip" data-search="${c.search}">
          <img src="${c.icon}" alt="">
          <span>${c.label}</span>
        </a>`
      ).join("");
    }
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q && document.getElementById("search")) {
      document.getElementById("search").value = q;
      searchItems();
    }
  }

  bindAccountMenu();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof SHOP_PRODUCTS === "undefined" || typeof CATEGORY_META === "undefined") {
    console.error("ShopVerse: products.js failed to load. Check script paths.");
    return;
  }

  const cat = document.body.dataset.category;
  if (cat) {
    const meta = CATEGORY_META.find((c) => c.slug === cat);
    await initCategoryPage(cat, meta?.label || cat, document.body.dataset.emoji || "");
    bindAccountMenu();
    return;
  }

  await initSite();
});
