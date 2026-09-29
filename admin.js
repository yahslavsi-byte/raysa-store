/* =====================================================
   RAYSA STORE - Admin Panel
   ===================================================== */

// =====================================================
// STATE
// =====================================================
const adminState = {
  products: [],
  orders: [],
  users: [],
  editingId: null,
  confirmCb: null,
  unsubProducts: null,
  unsubOrders: null,
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
// TOAST
// =====================================================
function showToast(title, msg = "", type = "success") {
  const c = document.getElementById("toastContainer");
  while (c.children.length >= 3) c.firstChild.remove();

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `
    <span class="toast-icon">${icons[type] || "ℹ️"}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${msg ? `<div class="toast-msg">${escapeHtml(msg)}</div>` : ""}
    </div>`;

  c.appendChild(t);
  setTimeout(() => {
    t.classList.add("hide");
    setTimeout(() => t.remove(), 300);
  }, 1000);
}


// =====================================================
// CONFIRM MODAL
// =====================================================
function showConfirm(title, msg, cb, icon = "⚠️", okText = "Ya") {
  document.getElementById("confirmIcon").textContent = icon;
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmOkBtn").textContent = okText;

  adminState.confirmCb = cb;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirm(r) {
  document.getElementById("confirmModal").classList.add("hidden");
  if (r && adminState.confirmCb) adminState.confirmCb();
  adminState.confirmCb = null;
}


// =====================================================
// MODAL HELPERS
// =====================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  const input = el.querySelector("input:not([type=hidden]):not([disabled])");
  if (input) setTimeout(() => input.focus(), 100);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");

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
document.addEventListener("click", e => {
  if (!e.target.classList.contains("modal")) return;
  closeModal(e.target.id);
});

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = document.querySelector(".modal:not(.hidden)");
  if (open) closeModal(open.id);
});


// =====================================================
// LOGIN ADMIN
// =====================================================
async function handleAdminLogin(e) {
  e?.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPass").value.trim();

  if (!email || !email.includes("@")) return showToast("Email tidak valid", "", "error");
  if (!pass || pass.length < 6) return showToast("Password lemah", "Minimal 6 karakter", "error");

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return showToast("Akses ditolak", "Akun Anda bukan admin", "error");
  }

  const btn = document.getElementById("adminLoginBtn");
  const original = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;

  try {
    showSplash("Masuk panel admin...", true);
    await auth.signInWithEmailAndPassword(email, pass);
    showToast("Login berhasil!", "Selamat datang, Admin 👋", "success");
    hideSplash(500);
  } catch (err) {
    console.error(err);
    hideSplash();
    const msg = {
      "auth/invalid-credential": "Email atau password salah",
      "auth/user-not-found": "Akun tidak ditemukan",
      "auth/wrong-password": "Password salah",
      "auth/invalid-email": "Format email tidak valid",
      "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti",
    }[err.code] || err.message;

    showToast("Login gagal", msg, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

// =====================================================
// LOGOUT ADMIN
// =====================================================
function logoutAdmin() {
  showConfirm("Logout Admin", "Yakin ingin keluar dari panel?", async () => {
    try {
      showSplash("Keluar...", true);
      await auth.signOut();

      adminState.products = [];
      adminState.orders = [];
      adminState.users = [];

      document.getElementById("adminPass").value = "";
      document.getElementById("adminEmail").value = "";

      closeAllModals();

      // Tampilkan splash penuh lalu redirect
      showSplash("Kembali ke halaman utama...", false);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (err) {
      hideSplash();
      showToast("Gagal logout", err.message, "error");
    }
  }, "🚪", "Logout");
}

// =====================================================
// PANEL: SHOW / HIDE
// =====================================================
function showPanel() {
  document.getElementById("adminLogin").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");

  if (!adminState.unsubProducts) {
    adminState.unsubProducts = subscribeProducts(list => {
      adminState.products = list;
      renderAdminProducts();
      renderStats();
    });
  }

  if (!adminState.unsubOrders) {
    adminState.unsubOrders = subscribeAllOrders(list => {
      adminState.orders = list;
      renderAdminOrders();
      renderStats();
    });
  }

  loadUsers();
  loadSettingsUI();
}

function hidePanel() {
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("adminLogin").classList.remove("hidden");

  adminState.unsubProducts?.();
  adminState.unsubOrders?.();
  adminState.unsubProducts = null;
  adminState.unsubOrders = null;
}


// =====================================================
// STATS
// =====================================================
function renderStats() {
  const revenue = adminState.orders
    .filter(o => o.status === "paid" || o.status === "done")
    .reduce((s, o) => s + o.total, 0);

  document.getElementById("statProducts").textContent = adminState.products.length;
  document.getElementById("statOrders").textContent = adminState.orders.length;
  document.getElementById("statRevenue").textContent = "Rp " + revenue.toLocaleString("id-ID");
  document.getElementById("statUsers").textContent = adminState.users.length;
}


// =====================================================
// TABS
// =====================================================
document.querySelector(".admin-tabs").addEventListener("click", e => {
  const btn = e.target.closest(".admin-tab");
  if (!btn) return;

  document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
  document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
});


// =====================================================
// PRODUK (CRUD)
// =====================================================
function renderAdminProducts() {
  const q = (document.getElementById("adminSearch")?.value || "").toLowerCase();
  const list = adminState.products.filter(p => p.name.toLowerCase().includes(q));
  const el = document.getElementById("adminProductList");

  if (list.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">📦</div>
        <p style="font-weight:600;color:#9ca3af;">Belum ada produk</p>
      </div>`;
    return;
  }

  el.innerHTML = list.map(p => `
    <div class="admin-product-item">
      <div class="ap-img">${renderProductImage(p.img, "28px")}</div>
      <div class="ap-info">
        <div class="ap-name">${escapeHtml(p.name)}</div>
        <div class="ap-meta">
          <span class="ap-price">Rp ${Number(p.price).toLocaleString("id-ID")}</span>
          <span class="ap-cat">${escapeHtml(p.category)}</span>
          ${p.tag ? `<span class="ap-tag">${escapeHtml(p.tag)}</span>` : ""}
        </div>
      </div>
      <div class="ap-actions">
        <button class="ap-btn edit" onclick="openProductForm('${p.id}')" aria-label="Edit">✏️</button>
        <button class="ap-btn del" onclick="deleteProductConfirm('${p.id}')" aria-label="Hapus">🗑️</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("adminSearch").addEventListener("input", debounce(renderAdminProducts));

function openProductForm(id = null) {
  adminState.editingId = id;
  const title = document.getElementById("productFormTitle");

  if (id) {
    const p = adminState.products.find(x => x.id === id);
    if (!p) return;

    title.textContent = "Edit Produk";
    document.getElementById("pfName").value = p.name;
    document.getElementById("pfPrice").value = p.price;
    document.getElementById("pfCategory").value = p.category;
    document.getElementById("pfTag").value = p.tag || "";
    document.getElementById("pfImg").value = p.img || "";
    document.getElementById("pfDesc").value = p.desc || "";
  } else {
    title.textContent = "Tambah Produk";
    ["pfName", "pfPrice", "pfTag", "pfImg", "pfDesc"].forEach(i => {
      document.getElementById(i).value = "";
    });
    document.getElementById("pfCategory").value = "proxy";
  }

  openModal("productFormModal");
}

async function saveProductForm(e) {
  e?.preventDefault();

  const name = document.getElementById("pfName").value.trim();
  const price = parseInt(document.getElementById("pfPrice").value);
  const category = document.getElementById("pfCategory").value;
  const tag = document.getElementById("pfTag").value.trim();
  const img = document.getElementById("pfImg").value.trim() || "📦";
  const desc = document.getElementById("pfDesc").value.trim();

  if (!name) return showToast("Nama kosong", "", "error");
  if (!price || price < 0) return showToast("Harga tidak valid", "", "error");

  const btn = document.getElementById("productSubmitBtn");
  const original = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const data = { name, price, category, tag, img, desc };

    if (adminState.editingId) {
      await updateProduct(adminState.editingId, data);
      showToast("Produk diupdate", name, "success");
    } else {
      await addProduct(data);
      showToast("Produk ditambahkan", name, "success");
    }

    closeModal("productFormModal");
  } catch (err) {
    showToast("Gagal", err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

function deleteProductConfirm(id) {
  const p = adminState.products.find(x => x.id === id);
  if (!p) return;

  showConfirm("Hapus Produk", `Yakin hapus "${p.name}"?`, async () => {
    try {
      await deleteProduct(id);
      showToast("Produk dihapus", p.name, "info");
    } catch (err) {
      showToast("Gagal", err.message, "error");
    }
  }, "🗑️", "Hapus");
}


// =====================================================
// ORDERS
// =====================================================
function renderAdminOrders() {
  const q = (document.getElementById("orderSearch")?.value || "").toLowerCase();
  const filter = document.getElementById("orderFilter")?.value || "all";

  let list = adminState.orders;
  if (filter !== "all") list = list.filter(o => o.status === filter);

  if (q) {
    list = list.filter(o =>
      o.id.toLowerCase().includes(q) ||
      (o.buyerName || "").toLowerCase().includes(q) ||
      (o.userEmail || "").toLowerCase().includes(q)
    );
  }

  const el = document.getElementById("adminOrderList");

  if (list.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="font-weight:600;color:#9ca3af;">Belum ada pesanan</p>
      </div>`;
    return;
  }

  el.innerHTML = list.map(o => `
    <div class="admin-order-item">
      <div class="ao-header">
        <div>
          <span class="ao-id">${o.id.slice(-8).toUpperCase()}</span>
          <span class="order-status status-${o.status}">${o.status.toUpperCase()}</span>
        </div>
        <span class="ao-date">${formatDate(o.createdAt)}</span>
      </div>
      <div class="ao-buyer">
        <span>👤 ${escapeHtml(o.buyerName)}</span>
        <span>📱 ${escapeHtml(o.buyerWA)}</span>
        <span>✉️ ${escapeHtml(o.userEmail || "-")}</span>
      </div>
      <div class="ao-items">${o.items.map(i => `• ${escapeHtml(i.name)} (Rp ${Number(i.price).toLocaleString("id-ID")})`).join("<br>")}</div>
      <div class="ao-footer">
        <span class="ao-total">Rp ${o.total.toLocaleString("id-ID")}</span>
        <div class="ao-actions">
          <select class="ao-status-select" onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="paid" ${o.status === "paid" ? "selected" : ""}>Paid</option>
            <option value="done" ${o.status === "done" ? "selected" : ""}>Selesai</option>
            <option value="cancel" ${o.status === "cancel" ? "selected" : ""}>Cancel</option>
          </select>
          <button class="ap-btn del" onclick="deleteOrderConfirm('${o.id}')" aria-label="Hapus">🗑️</button>
        </div>
      </div>
    </div>
  `).join("");
}

document.getElementById("orderSearch").addEventListener("input", debounce(renderAdminOrders));
document.getElementById("orderFilter").addEventListener("change", renderAdminOrders);

async function changeOrderStatus(id, status) {
  try {
    await updateOrderStatus(id, status);
    showToast("Status diupdate", `${id.slice(-8).toUpperCase()} → ${status}`, "success");
  } catch (err) {
    showToast("Gagal", err.message, "error");
  }
}

function deleteOrderConfirm(id) {
  showConfirm("Hapus Pesanan", `Yakin hapus ${id.slice(-8).toUpperCase()}?`, async () => {
    try {
      await deleteOrder(id);
      showToast("Pesanan dihapus", "", "info");
    } catch (err) {
      showToast("Gagal", err.message, "error");
    }
  }, "🗑️", "Hapus");
}


// =====================================================
// USERS
// =====================================================
async function loadUsers() {
  try {
    adminState.users = await fetchAllUsers();
    renderAdminUsers();
    renderStats();
  } catch (err) {
    console.warn(err);
  }
}

function renderAdminUsers() {
  const el = document.getElementById("adminUserList");

  if (adminState.users.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">👥</div>
        <p style="font-weight:600;color:#9ca3af;">Belum ada user</p>
      </div>`;
    return;
  }

  el.innerHTML = adminState.users.map(u => {
    const orders = adminState.orders.filter(o => o.userId === u.id);
    const spent = orders.reduce((s, o) => s + o.total, 0);

    return `
      <div class="admin-user-item">
        <div class="au-avatar">${escapeHtml((u.name || u.email)[0].toUpperCase())}</div>
        <div class="au-info">
          <div class="au-name">${escapeHtml(u.name || "-")}</div>
          <div class="au-email">${escapeHtml(u.email)}</div>
          <div class="au-meta">${orders.length} pesanan · Rp ${spent.toLocaleString("id-ID")}</div>
        </div>
        <button class="ap-btn del" onclick="deleteUserConfirm('${u.id}', '${escapeHtml(u.email)}')" aria-label="Hapus">🗑️</button>
      </div>`;
  }).join("");
}

function deleteUserConfirm(uid, email) {
  showConfirm("Hapus User", `Hapus profil ${email}?`, async () => {
    try {
      await deleteUserProfile(uid);
      adminState.users = adminState.users.filter(u => u.id !== uid);
      renderAdminUsers();
      renderStats();
      showToast("User dihapus", email, "info");
    } catch (err) {
      showToast("Gagal", err.message, "error");
    }
  }, "🗑️", "Hapus");
}


// =====================================================
// PENGATURAN
// =====================================================
async function loadSettingsUI() {
  const s = await getStoreSettings();
  document.getElementById("setWa").value = s.waNumber || "";
  document.getElementById("setName").value = s.storeName || "";
  document.getElementById("setAdminEmail").value = ADMIN_EMAIL;

  // ✅ Tambah ini
  await loadUpdateUI();
}

async function saveAllSettings() {
  const wa = document.getElementById("setWa").value.trim();
  const name = document.getElementById("setName").value.trim();

  if (!wa || !name) return showToast("Data tidak lengkap", "", "error");

  try {
    await saveStoreSettings({ waNumber: wa, storeName: name });
    showToast("Pengaturan disimpan", "", "success");
  } catch (err) {
    showToast("Gagal", err.message, "error");
  }
}

async function resetProducts() {
  showConfirm("Reset Produk", "Hapus semua produk dan isi default?", async () => {
    try {
      for (const p of adminState.products) {
        await deleteProduct(p.id);
      }
      await seedProductsIfEmpty();
      showToast("Produk direset", "Kembali ke default", "info");
    } catch (err) {
      showToast("Gagal", err.message, "error");
    }
  }, "♻️", "Reset");
}


// =====================================================
// INIT
// =====================================================
(function init() {
  const splash = document.getElementById("splashScreen");

  function hideInitialSplash(delay = 0) {
    if (!splash) return;
    setTimeout(() => {
      splash.classList.add("hide");
      setTimeout(() => splash.remove(), 350);
    }, delay);
  }

  // Failsafe
  const failsafe = setTimeout(() => {
    if (document.getElementById("splashScreen")) {
      hideInitialSplash();
    }
  }, 5000);

  auth.onAuthStateChanged(user => {
    clearTimeout(failsafe);

    // Admin login → tampilkan panel
    if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showPanel();
      hideInitialSplash(300);
      return;
    }

    // Ada user login tapi BUKAN admin → redirect ke toko
    if (user && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      showSplash("Bukan halaman admin...", false);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
      return;
    }

    // Belum login → tampilkan form login admin
    hidePanel();
    hideInitialSplash(200);
  });
})();