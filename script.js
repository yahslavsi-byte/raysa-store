/* =====================================================
   RAYSA STORE - Script Utama
   ===================================================== */

// =====================================================
// STATE
// =====================================================
const state = {
  products: [],
  category: "all",
  search: "",
  isRegister: false,
  user: null,
  cart: [],
  selectedProduct: null,
  confirmCb: null,
  settings: { waNumber: "6288216380673", storeName: "Raysa Store" },
};


// =====================================================
// UTIL
// =====================================================
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


// =====================================================
// TOAST — max 3 sekaligus
// =====================================================
function showToast(title, message = "", type = "success") {
  const c = document.getElementById("toastContainer");

  // Batasi max 3 toast
  while (c.children.length >= 3) c.firstChild.remove();

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ""}
    </div>`;

  c.appendChild(t);
  setTimeout(() => {
    t.classList.add("hide");
    setTimeout(() => t.remove(), 300);
  }, 3200);
}


// =====================================================
// CONFIRM MODAL
// =====================================================
function showConfirm(title, msg, cb, icon = "⚠️", okText = "Ya") {
  document.getElementById("confirmIcon").textContent = icon;
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmOkBtn").textContent = okText;

  state.confirmCb = cb;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirm(r) {
  document.getElementById("confirmModal").classList.add("hidden");
  if (r && state.confirmCb) state.confirmCb();
  state.confirmCb = null;
}


// =====================================================
// MODAL HELPERS
// =====================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Auto-focus input pertama
  const input = el.querySelector("input:not([type=hidden]):not([disabled])");
  if (input) setTimeout(() => input.focus(), 100);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");

  // Reset overflow kalau tidak ada modal lain terbuka
  if (!document.querySelector(".modal:not(.hidden)")) {
    document.body.style.overflow = "";
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.body.style.overflow = "";
}


// =====================================================
// EVENT DELEGATION
// =====================================================

// Klik backdrop → tutup modal (kecuali authModal)
document.addEventListener("click", e => {
  if (!e.target.classList.contains("modal")) return;
  if (e.target.dataset.modal === "locked") return;
  closeModal(e.target.id);
});

// ESC → tutup modal
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = document.querySelector(".modal:not(.hidden)");
  if (open && open.dataset.modal !== "locked") {
    closeModal(open.id);
  }
});

// Search (debounced)
document.getElementById("searchInput").addEventListener(
  "input",
  debounce(e => {
    state.search = e.target.value;
    renderProducts();
  }, 300)
);

// Filter kategori
document.getElementById("filterWrap").addEventListener("click", e => {
  const btn = e.target.closest(".cat-btn");
  if (!btn) return;

  state.category = btn.dataset.cat;
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("cat-active"));
  btn.classList.add("cat-active");
  renderProducts();
});


// =====================================================
// RENDER PRODUK
// =====================================================
function renderProducts() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  const loading = document.getElementById("loadingState");
  const count = document.getElementById("productCount");

  loading?.classList.add("hidden");

  let list = state.products;

  if (state.category !== "all") {
    list = list.filter(p => p.category === state.category);
  }

  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q));
  }

  count.textContent = `${list.length} produk`;

  if (list.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = list.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.05}s" onclick="showProductDetail('${p.id}')">
      ${p.tag ? `<span class="product-tag">${escapeHtml(p.tag)}</span>` : ""}
      <div class="product-img">${renderProductImage(p.img)}</div>
      <h3 class="product-name">${escapeHtml(p.name)}</h3>
      <p class="product-price">Rp ${Number(p.price).toLocaleString("id-ID")}</p>
      <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${p.id}')">+ Keranjang</button>
    </div>
  `).join("");
}


// =====================================================
// DETAIL PRODUK
// =====================================================
function showProductDetail(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  state.selectedProduct = p;

  document.getElementById("productDetail").innerHTML = `
    <div class="detail-hero">
      ${p.tag ? `<span class="detail-tag">${escapeHtml(p.tag)}</span>` : ""}
      ${renderProductImage(p.img, "80px")}
    </div>
    <h3 class="detail-title">${escapeHtml(p.name)}</h3>
    <p class="detail-price">Rp ${Number(p.price).toLocaleString("id-ID")}</p>
    <div class="detail-desc">${escapeHtml(p.desc || "Produk digital berkualitas.")}</div>
    <div class="detail-actions">
      <button class="btn-outline flex-1" onclick="addToCart('${p.id}', true)">🛒 Keranjang</button>
      <button class="btn-primary flex-1" onclick="buyNow('${p.id}')">Beli Sekarang</button>
    </div>`;

  openModal("productModal");
}


// =====================================================
// KERANJANG
// =====================================================
function addToCart(id, closeDetail = false) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  if (state.cart.find(x => x.id === id)) {
    showToast("Sudah di keranjang", p.name, "info");
    if (closeDetail) closeModal("productModal");
    return;
  }

  state.cart.push({ ...p });
  updateCartBadge();
  showToast("Ditambahkan!", p.name, "success");

  if (closeDetail) closeModal("productModal");
}

function removeFromCart(id) {
  const p = state.cart.find(x => x.id === id);
  state.cart = state.cart.filter(x => x.id !== id);
  updateCartBadge();
  renderCart();
  if (p) showToast("Dihapus", p.name, "info");
}

function updateCartBadge() {
  const b = document.getElementById("cartBadge");
  if (state.cart.length > 0) {
    b.textContent = state.cart.length;
    b.classList.remove("hidden");
  } else {
    b.classList.add("hidden");
  }
}

function toggleCart() {
  renderCart();
  openModal("cartModal");
}

function renderCart() {
  const c = document.getElementById("cartContent");

  if (state.cart.length === 0) {
    c.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="font-weight:600;color:#9ca3af;">Keranjang kosong</p>
        <p style="font-size:13px;margin-top:4px;">Yuk pilih produk dulu</p>
      </div>`;
    return;
  }

  const total = state.cart.reduce((s, p) => s + p.price, 0);

  c.innerHTML = `
    ${state.cart.map(p => `
      <div class="cart-item">
        <div class="cart-item-img">${renderProductImage(p.img, "28px")}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(p.name)}</div>
          <div class="cart-item-price">Rp ${Number(p.price).toLocaleString("id-ID")}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${p.id}')" aria-label="Hapus">✕</button>
      </div>
    `).join("")}

    <div class="cart-summary">
      <div class="cart-total">
        <span>Total</span>
        <span>Rp ${total.toLocaleString("id-ID")}</span>
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn-primary w-full" onclick="checkoutCart()">Checkout (${state.cart.length})</button>
    </div>`;
}


// =====================================================
// CHECKOUT
// =====================================================
function checkoutCart() {
  if (state.cart.length === 0) return showToast("Keranjang kosong", "", "error");
  closeModal("cartModal");
  showCheckout(state.cart, true);
}

function buyNow(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  closeModal("productModal");
  showCheckout([p], false);
}

function showCheckout(items, isCart) {
  if (!state.user) {
    showToast("Login dulu", "Silakan masuk untuk melanjutkan", "error");
    setTimeout(() => openAuthModal(), 300);
    return;
  }

  state.selectedProduct = { isCart, items };
  const total = items.reduce((s, p) => s + p.price, 0);

  document.getElementById("checkoutInfo").innerHTML = `
    ${items.map(p => `
      <div class="item">
        <span>${escapeHtml(p.name)}</span>
        <span>Rp ${Number(p.price).toLocaleString("id-ID")}</span>
      </div>
    `).join("")}

    <div class="total">
      <span>Total</span>
      <span>Rp ${total.toLocaleString("id-ID")}</span>
    </div>`;

  document.getElementById("buyerName").value =
    state.user.displayName || state.user.email.split("@")[0];

  openModal("checkoutModal");
}

async function proceedCheckout(e) {
  e?.preventDefault();

  const name = document.getElementById("buyerName").value.trim();
  const wa = document.getElementById("buyerWA").value.trim();

  if (!name) return showToast("Nama kosong", "", "error");
  if (!wa || wa.length < 9) return showToast("No. WA tidak valid", "", "error");

  const btn = document.getElementById("checkoutBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;

  try {
    const items = state.selectedProduct.items;
    const total = items.reduce((s, p) => s + p.price, 0);

    const order = {
      userId: state.user.uid,
      userEmail: state.user.email,
      buyerName: name,
      buyerWA: wa,
      items: items.map(p => ({ id: p.id, name: p.name, price: p.price })),
      total,
      status: "pending",
    };

    const ref = await createOrder(order);
    const orderId = ref.id.slice(-8).toUpperCase();

    const msg =
      `Halo, saya ingin pesan:%0A%0A` +
      items.map(p => `• *${p.name}* - Rp ${p.price.toLocaleString("id-ID")}`).join("%0A") +
      `%0A%0A*Total: Rp ${total.toLocaleString("id-ID")}*%0A%0A` +
      `Nama: ${name}%0AWA: ${wa}%0AOrder ID: ${orderId}`;

    window.open(`https://wa.me/${state.settings.waNumber}?text=${msg}`, "_blank");

    if (state.selectedProduct.isCart) {
      state.cart = [];
      updateCartBadge();
    }
    state.selectedProduct = null;
    closeModal("checkoutModal");

    showToast("Pesanan terkirim!", `Order ${orderId} - lanjutkan di WhatsApp`, "success");
  } catch (err) {
    console.error(err);
    showToast("Gagal membuat pesanan", err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}


// =====================================================
// AUTH
// =====================================================
function handleUserClick() {
  if (state.user) {
    // Kalau admin → redirect dengan splash
    if (state.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showSplash("Membuka panel admin...", true);
      setTimeout(() => {
        window.location.href = "admin.html";
      }, 500);
      return;
    }
    openDashboard();
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  document.getElementById("authEmail").value = "";
  document.getElementById("authPass").value = "";
  state.isRegister = false;
  updateAuthUI();
  openModal("authModal");
}

function updateAuthUI() {
  const r = state.isRegister;
  document.getElementById("authTitle").textContent = r ? "Daftar Akun" : "Masuk";
  document.getElementById("authSub").textContent = r
    ? "Buat akun baru untuk mulai berbelanja"
    : "Masuk untuk mulai berbelanja";
  document.getElementById("authBtnText").textContent = r ? "Daftar" : "Masuk";
  document.getElementById("switchText").textContent = r
    ? "Sudah punya akun?"
    : "Belum punya akun?";
  document.getElementById("switchBtn").textContent = r ? "Masuk" : "Daftar Sekarang";
}

function switchAuth() {
  state.isRegister = !state.isRegister;
  updateAuthUI();
}

async function handleAuth(e) {
  e?.preventDefault();

  const email = document.getElementById("authEmail").value.trim();
  const pass = document.getElementById("authPass").value.trim();

  if (!email || !email.includes("@")) return showToast("Email tidak valid", "", "error");
  if (!pass || pass.length < 6) return showToast("Password lemah", "Minimal 6 karakter", "error");

  if (!state.isRegister && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return showToast("Akun admin", "Silakan gunakan tombol 🔐 Login Admin", "error");
  }

  const btn = document.getElementById("authSubmitBtn");
  const original = document.getElementById("authBtnText").textContent;
  btn.disabled = true;
  document.getElementById("authBtnText").innerHTML = `<span class="spinner"></span>`;

  try {
    if (state.isRegister) {
      // Register
      showSplash("Membuat akun...", true);
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await saveUserProfile(cred.user);
      showToast("Registrasi berhasil!", "Selamat datang 🎉", "success");
      closeModal("authModal");
      hideSplash(300);
    } else {
      // Login
      showSplash("Masuk...", true);
      await auth.signInWithEmailAndPassword(email, pass);
      showToast("Login berhasil!", "Selamat datang 👋", "success");
      closeModal("authModal");
      hideSplash(400);
    }
  } catch (err) {
    console.error(err);
    hideSplash();
    const msg = {
      "auth/invalid-credential": "Email atau password salah",
      "auth/user-not-found": "Akun tidak ditemukan",
      "auth/wrong-password": "Password salah",
      "auth/email-already-in-use": "Email sudah terdaftar",
      "auth/invalid-email": "Format email tidak valid",
      "auth/weak-password": "Password terlalu lemah",
      "auth/operation-not-allowed": "Email/Password belum aktif di Firebase",
    }[err.code] || err.message;

    showToast("Gagal", msg, "error");
  } finally {
    btn.disabled = false;
    document.getElementById("authBtnText").textContent = original;
  }
}

// =====================================================
// USER BUTTON & LOGOUT
// =====================================================
function updateUserButton() {
  const b = document.getElementById("userBtn");
  if (state.user) {
    b.textContent = "👤 " + (state.user.displayName || state.user.email.split("@")[0]).slice(0, 10);
  } else {
    b.textContent = "Login";
  }
}

function logout() {
  showConfirm("Logout Akun", "Yakin ingin keluar?", async () => {
    try {
      showSplash("Keluar...", true);
      await auth.signOut();

      state.user = null;
      state.cart = [];
      state.selectedProduct = null;
      updateCartBadge();
      updateUserButton();

      closeAllModals();

      // Tampilkan modal login setelah splash
      hideSplash(800);
      openAuthModal()

      showToast("Berhasil logout", "Silakan login kembali 👋", "info");
    } catch (err) {
      hideSplash();
      showToast("Gagal logout", err.message, "error");
    }
  }, "👋", "Logout");
}


// =====================================================
// DASHBOARD
// =====================================================
async function openDashboard() {
  if (!state.user) return;

  const name = state.user.displayName || state.user.email.split("@")[0];
  const content = document.getElementById("dashboardContent");

  // Splash mini saat loading
  showSplash("Memuat dashboard...", true);
  content.innerHTML = `<div class="cart-empty"><p>Memuat riwayat...</p></div>`;

  let orders = [];
  try {
    orders = await fetchUserOrders(state.user.uid);
  } catch (err) {
    console.error(err);
  }

  // Isi konten dulu sebelum tampil
  content.innerHTML = `
    <div class="dash-header">
      <div class="dash-avatar">${escapeHtml(name[0].toUpperCase())}</div>
      <div class="dash-info">
        <div class="dash-email">${escapeHtml(name)}</div>
        <div class="dash-sub">${escapeHtml(state.user.email)}</div>
      </div>
    </div>

    <div class="dash-section-title">📦 Riwayat Pesanan (${orders.length})</div>

    ${orders.length === 0
      ? `<div class="cart-empty" style="padding:20px;">
           <p style="font-size:13px;">Belum ada pesanan</p>
         </div>`
      : orders.slice(0, 10).map(o => `
        <div class="order-item">
          <div class="order-header">
            <span class="order-meta">${o.id.slice(-8).toUpperCase()}</span>
            <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span>
          </div>
          <div class="order-name">${o.items.map(i => escapeHtml(i.name)).join(", ")}</div>
          <div class="order-meta">${formatDate(o.createdAt)}</div>
          <div class="order-price">Rp ${o.total.toLocaleString("id-ID")}</div>
        </div>
      `).join("")
    }

    <div class="modal-actions">
      <button class="btn-outline w-full" onclick="logout()">Logout</button>
    </div>`;

  // Buka modal + hide splash bersamaan
  openModal("dashboardModal");
  hideSplash(200);
}


// =====================================================
// UTIL LAINNYA
// =====================================================
function openWA() {
  window.open(
    `https://wa.me/${state.settings.waNumber}?text=Halo ${state.settings.storeName}`,
    "_blank"
  );
}

function scrollToProducts() {
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}


// =====================================================
// INIT
// =====================================================
(async function init() {
  const splash = document.getElementById("splashScreen");

  function hideInitialSplash(delay = 0) {
    if (!splash) return;
    setTimeout(() => {
      splash.classList.add("hide");
      setTimeout(() => splash.remove(), 350);
    }, delay);
  }

  // Failsafe: kalau Firebase lambat, paksa hilang setelah 5 detik
  const failsafe = setTimeout(() => {
    if (document.getElementById("splashScreen")) {
      hideInitialSplash();
      if (!state.user) openAuthModal();
    }
  }, 5000);

  // Listen status login
  auth.onAuthStateChanged(async user => {
    clearTimeout(failsafe);

    if (user) {
      state.user = user;
      try { await saveUserProfile(user); } catch (e) {}

      // ✅ KALAU ADMIN → redirect otomatis ke panel admin
      if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        showSplash("Membuka panel admin...", false);
        setTimeout(() => {
          window.location.href = "admin.html";
        }, 500);
        return;
      }

      // User biasa → tampil toko
      closeModal("authModal");
      updateUserButton();
      hideInitialSplash(300);
    } else {
      state.user = null;
      state.cart = [];
      updateCartBadge();
      updateUserButton();

      // Belum login → tutup splash, buka modal login
      hideInitialSplash(200);
      setTimeout(() => openAuthModal(), 10);
    }
  });

  // Load settings
  try {
    state.settings = await getStoreSettings();
  } catch (e) {
    console.warn("Settings:", e);
  }

  // Seed produk
  try {
    await seedProductsIfEmpty();
  } catch (e) {
    console.warn("Seed:", e);
  }

  // Subscribe produk
  subscribeProducts(list => {
    state.products = list;
    renderProducts();
  });
})();