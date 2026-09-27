/* =====================================================
   RAYSA STORE - Admin Panel (Firebase)
   ===================================================== */

let ALL_PRODUCTS = [];
let ALL_ORDERS = [];
let ALL_USERS = [];
let editingId = null;
let confirmCallback = null;
let unsubProducts = null;
let unsubOrders = null;

// ======== TOAST ========
function showToast(title, msg = "", type = "success") {
  const c = document.getElementById("toastContainer");
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]}</span>
    <div class="toast-body"><div class="toast-title">${title}</div>
    ${msg ? `<div class="toast-msg">${msg}</div>` : ""}</div>`;
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

// ======== LOGIN ADMIN ========
async function handleAdminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPass").value.trim();
  if (!email || !pass) return showToast("Isi email & password", "", "error");

  const btn = document.getElementById("adminLoginBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Memproses...`;

  try {
    await auth.signInWithEmailAndPassword(email, pass);
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      await auth.signOut();
      showToast("Akses ditolak", "Akun Anda bukan admin", "error");
    }
  } catch (e) {
    showToast("Login gagal", e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk Dashboard";
  }
}

function logoutAdmin() {
  showConfirm("Logout Admin", "Yakin keluar dari panel?", async () => {
    try { await auth.signOut(); } catch (e) {}
    showToast("Logout berhasil", "", "info");
  }, "🚪", "Logout");
}

// ======== SHOW PANEL ========
function showPanel() {
  document.getElementById("adminLogin").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");

  if (!unsubProducts) {
    unsubProducts = subscribeProducts(list => {
      ALL_PRODUCTS = list;
      renderAdminProducts();
      renderStats();
    });
  }
  if (!unsubOrders) {
    unsubOrders = subscribeAllOrders(list => {
      ALL_ORDERS = list;
      renderAdminOrders();
      renderStats();
    });
  }
  loadUsers();
  loadSettingsUI();
}

// ======== STATS ========
function renderStats() {
  const revenue = ALL_ORDERS.filter(o => o.status === "paid" || o.status === "done")
    .reduce((s, o) => s + o.total, 0);
  document.getElementById("statProducts").textContent = ALL_PRODUCTS.length;
  document.getElementById("statOrders").textContent = ALL_ORDERS.length;
  document.getElementById("statRevenue").textContent = "Rp " + revenue.toLocaleString("id-ID");
  document.getElementById("statUsers").textContent = ALL_USERS.length;
}

// ======== TABS ========
function switchTab(tab, e) {
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");
  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
  document.getElementById("tab-" + tab).classList.remove("hidden");
}

// ======== PRODUCTS ========
function renderAdminProducts() {
  const q = (document.getElementById("adminSearch")?.value || "").toLowerCase();
  const list = ALL_PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  const el = document.getElementById("adminProductList");
  if (list.length === 0) {
    el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">📦</div>
      <p style="font-weight:600;color:#9ca3af;">Belum ada produk</p></div>`;
    return;
  }
  el.innerHTML = list.map(p => `
    <div class="admin-product-item">
      <div class="ap-img">${renderProductImage(p.img, "28px")}</div>
      <div class="ap-info">
        <div class="ap-name">${p.name}</div>
        <div class="ap-meta">
          <span class="ap-price">Rp ${p.price.toLocaleString("id-ID")}</span>
          <span class="ap-cat">${p.category}</span>
          ${p.tag ? `<span class="ap-tag">${p.tag}</span>` : ""}
        </div>
      </div>
      <div class="ap-actions">
        <button class="ap-btn edit" onclick="openProductForm('${p.id}')">✏️</button>
        <button class="ap-btn del" onclick="deleteProductConfirm('${p.id}')">🗑️</button>
      </div>
    </div>`).join("");
}

function openProductForm(id = null) {
  editingId = id;
  const title = document.getElementById("productFormTitle");
  if (id) {
    const p = ALL_PRODUCTS.find(x => x.id === id);
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
    ["pfName", "pfPrice", "pfTag", "pfImg", "pfDesc"].forEach(i => document.getElementById(i).value = "");
    document.getElementById("pfCategory").value = "proxy";
  }
  openModal("productFormModal");
}

async function saveProductForm() {
  const name = document.getElementById("pfName").value.trim();
  const price = parseInt(document.getElementById("pfPrice").value);
  const category = document.getElementById("pfCategory").value;
  const tag = document.getElementById("pfTag").value.trim();
  const img = document.getElementById("pfImg").value.trim() || "📦";
  const desc = document.getElementById("pfDesc").value.trim();

  if (!name) return showToast("Nama kosong", "", "error");
  if (!price || price < 0) return showToast("Harga tidak valid", "", "error");

  const btn = document.querySelector("#productFormModal .btn-primary");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const data = { name, price, category, tag, img, desc };
    if (editingId) {
      await updateProduct(editingId, data);
      showToast("Produk diupdate", name, "success");
    } else {
      await addProduct(data);
      showToast("Produk ditambahkan", name, "success");
    }
    closeModal("productFormModal");
  } catch (e) {
    showToast("Gagal", e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan";
  }
}

function deleteProductConfirm(id) {
  const p = ALL_PRODUCTS.find(x => x.id === id);
  if (!p) return;
  showConfirm("Hapus Produk", `Yakin hapus "${p.name}"?`, async () => {
    try {
      await deleteProduct(id);
      showToast("Produk dihapus", p.name, "info");
    } catch (e) { showToast("Gagal", e.message, "error"); }
  }, "🗑️", "Hapus");
}

// ======== ORDERS ========
function renderAdminOrders() {
  const q = (document.getElementById("orderSearch")?.value || "").toLowerCase();
  const filter = document.getElementById("orderFilter")?.value || "all";
  let list = ALL_ORDERS;
  if (filter !== "all") list = list.filter(o => o.status === filter);
  if (q) list = list.filter(o =>
    o.id.toLowerCase().includes(q) ||
    (o.buyerName || "").toLowerCase().includes(q) ||
    (o.userEmail || "").toLowerCase().includes(q));

  const el = document.getElementById("adminOrderList");
  if (list.length === 0) {
    el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div>
      <p style="font-weight:600;color:#9ca3af;">Belum ada pesanan</p></div>`;
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
        <span>👤 ${o.buyerName}</span>
        <span>📱 ${o.buyerWA}</span>
        <span>✉️ ${o.userEmail || "-"}</span>
      </div>
      <div class="ao-items">${o.items.map(i => `• ${i.name} (Rp ${i.price.toLocaleString("id-ID")})`).join("<br>")}</div>
      <div class="ao-footer">
        <span class="ao-total">Rp ${o.total.toLocaleString("id-ID")}</span>
        <div class="ao-actions">
          <select class="ao-status-select" onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="pending" ${o.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="paid" ${o.status === "paid" ? "selected" : ""}>Paid</option>
            <option value="done" ${o.status === "done" ? "selected" : ""}>Selesai</option>
            <option value="cancel" ${o.status === "cancel" ? "selected" : ""}>Cancel</option>
          </select>
          <button class="ap-btn del" onclick="deleteOrderConfirm('${o.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join("");
}

async function changeOrderStatus(id, status) {
  try {
    await updateOrderStatus(id, status);
    showToast("Status diupdate", `${id.slice(-8).toUpperCase()} → ${status}`, "success");
  } catch (e) { showToast("Gagal", e.message, "error"); }
}

function deleteOrderConfirm(id) {
  showConfirm("Hapus Pesanan", `Yakin hapus ${id.slice(-8).toUpperCase()}?`, async () => {
    try {
      await deleteOrder(id);
      showToast("Pesanan dihapus", "", "info");
    } catch (e) { showToast("Gagal", e.message, "error"); }
  }, "🗑️", "Hapus");
}

// ======== USERS ========
async function loadUsers() {
  try {
    ALL_USERS = await fetchAllUsers();
    renderAdminUsers();
    renderStats();
  } catch (e) { console.warn(e); }
}

function renderAdminUsers() {
  const el = document.getElementById("adminUserList");
  if (ALL_USERS.length === 0) {
    el.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">👥</div>
      <p style="font-weight:600;color:#9ca3af;">Belum ada user</p></div>`;
    return;
  }
  el.innerHTML = ALL_USERS.map(u => {
    const orders = ALL_ORDERS.filter(o => o.userId === u.id);
    const spent = orders.reduce((s, o) => s + o.total, 0);
    return `
      <div class="admin-user-item">
        <div class="au-avatar">${(u.name || u.email)[0].toUpperCase()}</div>
        <div class="au-info">
          <div class="au-name">${u.name || "-"}</div>
          <div class="au-email">${u.email}</div>
          <div class="au-meta">${orders.length} pesanan · Rp ${spent.toLocaleString("id-ID")}</div>
        </div>
        <button class="ap-btn del" onclick="deleteUserConfirm('${u.id}', '${u.email}')">🗑️</button>
      </div>`;
  }).join("");
}

function deleteUserConfirm(uid, email) {
  showConfirm("Hapus User", `Hapus profil ${email}?`, async () => {
    try {
      await deleteUserProfile(uid);
      ALL_USERS = ALL_USERS.filter(u => u.id !== uid);
      renderAdminUsers();
      renderStats();
      showToast("User dihapus", email, "info");
    } catch (e) { showToast("Gagal", e.message, "error"); }
  }, "🗑️", "Hapus");
}

// ======== SETTINGS ========
async function loadSettingsUI() {
  const s = await getStoreSettings();
  document.getElementById("setWa").value = s.waNumber || "";
  document.getElementById("setName").value = s.storeName || "";
  document.getElementById("setAdminEmail").value = ADMIN_EMAIL;
}

async function saveAllSettings() {
  const wa = document.getElementById("setWa").value.trim();
  const name = document.getElementById("setName").value.trim();
  if (!wa || !name) return showToast("Data tidak lengkap", "", "error");
  try {
    await saveStoreSettings({ waNumber: wa, storeName: name });
    showToast("Pengaturan disimpan", "", "success");
  } catch (e) { showToast("Gagal", e.message, "error"); }
}

async function resetProducts() {
  showConfirm("Reset Produk", "Hapus semua produk dan isi default?", async () => {
    try {
      for (const p of ALL_PRODUCTS) await deleteProduct(p.id);
      await seedProductsIfEmpty();
      showToast("Produk direset", "Kembali ke default", "info");
    } catch (e) { showToast("Gagal", e.message, "error"); }
  }, "♻️", "Reset");
}

// ======== INIT ========
auth.onAuthStateChanged(user => {
  if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    showPanel();
  } else {
    if (unsubProducts) { unsubProducts(); unsubProducts = null; }
    if (unsubOrders) { unsubOrders(); unsubOrders = null; }
    document.getElementById("adminPanel").classList.add("hidden");
    document.getElementById("adminLogin").classList.remove("hidden");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("adminEmail").value = ADMIN_EMAIL;
});