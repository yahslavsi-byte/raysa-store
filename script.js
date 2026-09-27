/* =====================================================
   RAYSA STORE - Script Utama (Firebase)
   ===================================================== */

let ALL_PRODUCTS = [];
let currentCategory = "all";
let searchQuery = "";
let isRegister = false;
let currentUser = null;
let cart = [];
let selectedProduct = null;
let confirmCallback = null;
let cachedSettings = { waNumber: "6288216380673", storeName: "Raysa Store" };

// ======== TOAST ========
function showToast(title, message = "", type = "success") {
  const c = document.getElementById("toastContainer");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span>
    <div class="toast-body"><div class="toast-title">${title}</div>
    ${message ? `<div class="toast-msg">${message}</div>` : ""}</div>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add("hide"); setTimeout(() => t.remove(), 300); }, 3200);
}

// ======== CONFIRM ========
function showConfirm(title, msg, cb, icon = "⚠️", okText = "Ya") {
  document.getElementById("confirmIcon").textContent = icon;
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmOkBtn").textContent = okText;
  confirmCallback = cb;
  document.getElementById("confirmModal").classList.remove("hidden");
}
function closeConfirm(r) {
  document.getElementById("confirmModal").classList.add("hidden");
  if (r && confirmCallback) confirmCallback();
  confirmCallback = null;
}

// ======== MODAL ========
function openModal(id) { document.getElementById(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); document.body.style.overflow = ""; }
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.add("hidden");
    document.body.style.overflow = "";
  }
});

// ======== RENDER PRODUK ========
function renderProducts() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const loading = document.getElementById("loadingState");
  const count = document.getElementById("productCount");

  if (loading) loading.classList.add("hidden");

  let filtered = ALL_PRODUCTS;
  if (currentCategory !== "all") filtered = filtered.filter(p => p.category === currentCategory);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
  }

  count.textContent = `${filtered.length} produk`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.05}s" onclick="showProductDetail('${p.id}')">
      ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ""}
      <div class="product-img">${renderProductImage(p.img)}</div>
      <h3 class="product-name">${p.name}</h3>
      <p class="product-price">Rp ${p.price.toLocaleString("id-ID")}</p>
      <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${p.id}')">+ Keranjang</button>
    </div>`).join("");
}

// ======== SEARCH & FILTER ========
function handleSearch(v) { searchQuery = v; renderProducts(); }
function filterCategory(cat, e) {
  currentCategory = cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("cat-active"));
  e.target.classList.add("cat-active");
  renderProducts();
}

// ======== DETAIL ========
function showProductDetail(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  selectedProduct = p;
  document.getElementById("productDetail").innerHTML = `
    <div class="detail-hero">
      ${p.tag ? `<span class="detail-tag">${p.tag}</span>` : ""}
      ${renderProductImage(p.img, "80px")}
    </div>
    <h3 class="detail-title">${p.name}</h3>
    <p class="detail-price">Rp ${p.price.toLocaleString("id-ID")}</p>
    <div class="detail-desc">${p.desc || "Produk digital berkualitas."}</div>
    <div class="detail-actions">
      <button class="btn-outline flex-1" onclick="addToCart('${p.id}', true)">🛒 Keranjang</button>
      <button class="btn-primary flex-1" onclick="buyNow('${p.id}')">Beli Sekarang</button>
    </div>`;
  openModal("productModal");
}

// ======== CART ========
function addToCart(id, closeDetail = false) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  if (cart.find(x => x.id === id)) {
    showToast("Sudah di keranjang", p.name, "info");
    if (closeDetail) closeModal("productModal");
    return;
  }
  cart.push({ ...p });
  updateCartBadge();
  showToast("Ditambahkan!", p.name, "success");
  if (closeDetail) closeModal("productModal");
}

function removeFromCart(id) {
  const p = cart.find(x => x.id === id);
  cart = cart.filter(x => x.id !== id);
  updateCartBadge();
  renderCart();
  if (p) showToast("Dihapus", p.name, "info");
}

function updateCartBadge() {
  const b = document.getElementById("cartBadge");
  if (cart.length > 0) { b.textContent = cart.length; b.classList.remove("hidden"); }
  else b.classList.add("hidden");
}

function toggleCart() { renderCart(); openModal("cartModal"); }

function renderCart() {
  const c = document.getElementById("cartContent");
  if (cart.length === 0) {
    c.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div>
      <p style="font-weight:600;color:#9ca3af;">Keranjang kosong</p>
      <p style="font-size:13px;margin-top:4px;">Yuk pilih produk dulu</p></div>`;
    return;
  }
  const total = cart.reduce((s, p) => s + p.price, 0);
  c.innerHTML = `
    ${cart.map(p => `
      <div class="cart-item">
        <div class="cart-item-img">${renderProductImage(p.img, "28px")}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">Rp ${p.price.toLocaleString("id-ID")}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${p.id}')">✕</button>
      </div>`).join("")}
    <div class="cart-summary">
      <div class="cart-total"><span>Total</span><span>Rp ${total.toLocaleString("id-ID")}</span></div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary w-full" onclick="checkoutCart()">Checkout (${cart.length})</button>
    </div>`;
}

// ======== CHECKOUT ========
function checkoutCart() {
  if (cart.length === 0) return showToast("Keranjang kosong", "", "error");
  closeModal("cartModal");
  showCheckout(cart, true);
}

function buyNow(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  closeModal("productModal");
  showCheckout([p], false);
}

function showCheckout(items, isCart) {
  if (!currentUser) {
    showToast("Login dulu", "Silakan masuk untuk melanjutkan", "error");
    setTimeout(() => openAuthModal(), 400);
    return;
  }
  selectedProduct = { isCart, items };
  const total = items.reduce((s, p) => s + p.price, 0);
  document.getElementById("checkoutInfo").innerHTML = `
    ${items.map(p => `<div class="item"><span>${p.name}</span><span>Rp ${p.price.toLocaleString("id-ID")}</span></div>`).join("")}
    <div class="total"><span>Total</span><span>Rp ${total.toLocaleString("id-ID")}</span></div>`;
  document.getElementById("buyerName").value = currentUser.displayName || currentUser.email.split("@")[0];
  openModal("checkoutModal");
}

async function proceedCheckout() {
  const name = document.getElementById("buyerName").value.trim();
  const wa = document.getElementById("buyerWA").value.trim();
  if (!name) return showToast("Nama kosong", "", "error");
  if (!wa || wa.length < 9) return showToast("No. WA tidak valid", "", "error");

  const btn = document.getElementById("checkoutBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;

  try {
    const items = selectedProduct.items;
    const total = items.reduce((s, p) => s + p.price, 0);
    const order = {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      buyerName: name,
      buyerWA: wa,
      items: items.map(p => ({ id: p.id, name: p.name, price: p.price })),
      total,
      status: "pending",
    };

    const ref = await createOrder(order);
    const orderId = ref.id.slice(-8).toUpperCase();

    const msg = `Halo, saya ingin pesan:%0A%0A` +
      items.map(p => `• *${p.name}* - Rp ${p.price.toLocaleString("id-ID")}`).join("%0A") +
      `%0A%0A*Total: Rp ${total.toLocaleString("id-ID")}*%0A%0A` +
      `Nama: ${name}%0AWA: ${wa}%0AOrder ID: ${orderId}`;

    window.open(`https://wa.me/${cachedSettings.waNumber}?text=${msg}`, "_blank");

    if (selectedProduct.isCart) { cart = []; updateCartBadge(); }
    selectedProduct = null;
    closeModal("checkoutModal");
    showToast("Pesanan terkirim!", `Order ${orderId} - lanjutkan di WhatsApp`, "success");
  } catch (e) {
    console.error(e);
    showToast("Gagal membuat pesanan", e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Pesan via WA";
  }
}

// ======== AUTH ========
function handleUserClick() {
  if (currentUser) openDashboard();
  else openAuthModal();
}

function openAuthModal() {
  document.getElementById("authEmail").value = "";
  document.getElementById("authPass").value = "";
  isRegister = false;
  updateAuthUI();
  openModal("authModal");
}

function updateAuthUI() {
  document.getElementById("authTitle").textContent = isRegister ? "Daftar Akun" : "Masuk";
  document.getElementById("authSub").textContent = isRegister ? "Buat akun baru" : "Masuk untuk mulai berbelanja";
  document.getElementById("authBtnText").textContent = isRegister ? "Daftar" : "Masuk";
  document.getElementById("switchText").textContent = isRegister ? "Sudah punya akun?" : "Belum punya akun?";
  document.getElementById("switchBtn").textContent = isRegister ? "Masuk" : "Daftar Sekarang";
}
function switchAuth() { isRegister = !isRegister; updateAuthUI(); }

async function handleAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const pass = document.getElementById("authPass").value.trim();
  if (!email || !email.includes("@")) return showToast("Email tidak valid", "", "error");
  if (!pass || pass.length < 6) return showToast("Password lemah", "Minimal 6 karakter", "error");

  const btn = document.getElementById("authSubmitBtn");
  const original = document.getElementById("authBtnText").textContent;
  btn.disabled = true;
  document.getElementById("authBtnText").innerHTML = `<span class="spinner"></span>`;

  try {
    if (isRegister) {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await saveUserProfile(cred.user);
      showToast("Registrasi berhasil!", "Selamat datang 🎉", "success");
      closeModal("authModal");
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
      showToast("Login berhasil!", "Selamat datang 👋", "success");
      closeModal("authModal");
    }
  } catch (e) {
    console.error(e);
    const msg = {
      "auth/invalid-credential": "Email atau password salah",
      "auth/user-not-found": "Akun tidak ditemukan",
      "auth/wrong-password": "Password salah",
      "auth/email-already-in-use": "Email sudah terdaftar",
      "auth/invalid-email": "Format email tidak valid",
      "auth/weak-password": "Password terlalu lemah",
    }[e.code] || e.message;
    showToast("Gagal", msg, "error");
  } finally {
    btn.disabled = false;
    document.getElementById("authBtnText").textContent = original;
  }
}

function updateUserButton() {
  const b = document.getElementById("userBtn");
  if (currentUser) {
    b.textContent = "👤 " + (currentUser.displayName || currentUser.email.split("@")[0]).slice(0, 10);
  } else {
    b.textContent = "Login";
  }
}

function logout() {
  showConfirm("Logout Akun", "Yakin ingin keluar?", async () => {
    try {
      await auth.signOut();
      showToast("Berhasil logout", "Sampai jumpa 👋", "info");
      closeModal("dashboardModal");
    } catch (e) {
      showToast("Gagal logout", e.message, "error");
    }
  }, "👋", "Logout");
}

// ======== DASHBOARD ========
async function openDashboard() {
  if (!currentUser) return;
  const name = currentUser.displayName || currentUser.email.split("@")[0];
  const content = document.getElementById("dashboardContent");
  content.innerHTML = `<div class="cart-empty"><p>Memuat riwayat...</p></div>`;
  openModal("dashboardModal");

  let orders = [];
  try { orders = await fetchUserOrders(currentUser.uid); } catch (e) { console.error(e); }

  content.innerHTML = `
    <div class="dash-header">
      <div class="dash-avatar">${name[0].toUpperCase()}</div>
      <div class="dash-info">
        <div class="dash-email">${name}</div>
        <div class="dash-sub">${currentUser.email}</div>
      </div>
    </div>
    <div class="dash-section-title">📦 Riwayat Pesanan (${orders.length})</div>
    ${orders.length === 0 ? `<div class="cart-empty" style="padding:20px;"><p style="font-size:13px;">Belum ada pesanan</p></div>` :
      orders.slice(0, 10).map(o => `
      <div class="order-item">
        <div class="order-header">
          <span class="order-meta">${o.id.slice(-8).toUpperCase()}</span>
          <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span>
        </div>
        <div class="order-name">${o.items.map(i => i.name).join(", ")}</div>
        <div class="order-meta">${formatDate(o.createdAt)}</div>
        <div class="order-price">Rp ${o.total.toLocaleString("id-ID")}</div>
      </div>`).join("")}
    <div class="modal-actions">
      <button class="btn-outline w-full" onclick="logout()">Logout</button>
    </div>`;
}

// ======== UTIL ========
function openWA() {
  window.open(`https://wa.me/${cachedSettings.waNumber}?text=Halo ${cachedSettings.storeName}`, "_blank");
}
function scrollToProducts() { document.getElementById("products").scrollIntoView({ behavior: "smooth" }); }
function scrollToTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }

// ======== INIT ========
(async function init() {
  auth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      try { await saveUserProfile(user); } catch (e) {}
    } else {
      currentUser = null;
      cart = [];
      updateCartBadge();
    }
    updateUserButton();
  });

  try { cachedSettings = await getStoreSettings(); } catch (e) {}
  try { await seedProductsIfEmpty(); } catch (e) { console.warn(e); }

  subscribeProducts(list => {
    ALL_PRODUCTS = list;
    renderProducts();
  });
})();