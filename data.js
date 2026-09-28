/* =====================================================
   RAYSA STORE - Firestore Helpers
   ===================================================== */

const COL_PRODUCTS = "products";
const COL_ORDERS = "orders";
const COL_USERS = "users";
const DOC_SETTINGS = db.collection("settings").doc("store");

const DEFAULT_PRODUCTS = [
  { name: "Raysa Proxy Update", price: 50000, category: "proxy", tag: "HOT", img: "🔥",
    desc: "Proxy premium dengan update harian. Support berbagai game populer, koneksi stabil, dan anti-blokir." },
  { name: "Raysa Proxy New", price: 45000, category: "proxy", tag: "", img: "⚡",
    desc: "Versi terbaru dengan performa tinggi. Lebih ringan dan cepat dibanding versi sebelumnya." },
  { name: "Template Toko Online", price: 75000, category: "template", tag: "NEW", img: "🎨",
    desc: "Template toko online modern, responsive, dan siap pakai." },
  { name: "Tools Auto Posting", price: 60000, category: "tools", tag: "", img: "🛠️",
    desc: "Otomatis posting ke banyak platform sosial media sekaligus." },
  { name: "Ebook Bisnis Digital", price: 35000, category: "ebook", tag: "PROMO", img: "📚",
    desc: "Panduan lengkap memulai bisnis digital dari nol hingga menghasilkan." },
  { name: "Proxy Premium 30 Hari", price: 90000, category: "proxy", tag: "", img: "🚀",
    desc: "Paket proxy premium untuk 30 hari penuh. Unlimited bandwidth." },
  { name: "Template Landing Page", price: 55000, category: "template", tag: "", img: "💎",
    desc: "Landing page konversi tinggi dengan desain modern." },
  { name: "Tools SEO Booster", price: 80000, category: "tools", tag: "HOT", img: "📈",
    desc: "Optimasi SEO otomatis untuk website Anda." },
];

async function seedProductsIfEmpty() {
  const snap = await db.collection(COL_PRODUCTS).limit(1).get();
  if (snap.empty) {
    const batch = db.batch();
    DEFAULT_PRODUCTS.forEach(p => {
      const ref = db.collection(COL_PRODUCTS).doc();
      batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
  }
}

// ---- PRODUCTS ----
async function fetchProducts() {
  const snap = await db.collection(COL_PRODUCTS).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function subscribeProducts(callback) {
  return db.collection(COL_PRODUCTS).onSnapshot(snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

async function addProduct(p) {
  return db.collection(COL_PRODUCTS).add({
    ...p,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function updateProduct(id, p) {
  return db.collection(COL_PRODUCTS).doc(id).update(p);
}

async function deleteProduct(id) {
  return db.collection(COL_PRODUCTS).doc(id).delete();
}

// ---- ORDERS ----
async function createOrder(order) {
  return db.collection(COL_ORDERS).add({
    ...order,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

async function fetchUserOrders(uid) {
  const snap = await db.collection(COL_ORDERS).where("userId", "==", uid).get();
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

function subscribeAllOrders(callback) {
  return db.collection(COL_ORDERS).onSnapshot(snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(list);
  });
}

async function updateOrderStatus(id, status) {
  return db.collection(COL_ORDERS).doc(id).update({ status });
}

async function deleteOrder(id) {
  return db.collection(COL_ORDERS).doc(id).delete();
}

// ---- USERS ----
async function saveUserProfile(user) {
  return db.collection(COL_USERS).doc(user.uid).set({
    email: user.email,
    name: user.displayName || user.email.split("@")[0],
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function fetchAllUsers() {
  const snap = await db.collection(COL_USERS).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function deleteUserProfile(uid) {
  return db.collection(COL_USERS).doc(uid).delete();
}

// ---- SETTINGS ----
async function getStoreSettings() {
  try {
    const doc = await DOC_SETTINGS.get();
    if (doc.exists) return doc.data();
  } catch (e) { console.warn("settings err", e); }
  return { waNumber: "6288216380673", storeName: "Raysa Store" };
}

async function saveStoreSettings(s) {
  return DOC_SETTINGS.set(s, { merge: true });
}

// ---- HELPERS ----
function isImageUrl(str) {
  return typeof str === "string" && (str.startsWith("http") || str.startsWith("data:"));
}

function renderProductImage(img, emojiSize = "40px") {
  if (isImageUrl(img)) {
    return `<img src="${img}" alt="produk" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
  }
  return `<span style="font-size:${emojiSize};">${img || "📦"}</span>`;
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

/* =====================================================
   SPLASH SCREEN HELPER (universal)
   ===================================================== */

/**
 * Tampilkan splash screen
 * @param {string} text - Teks kecil di bawah judul
 * @param {boolean} mini - Mode mini (transparan + blur)
 */
function showSplash(text = "Memuat...", mini = false) {
  document.getElementById("splashScreen")?.remove();

  const el = document.createElement("div");
  el.id = "splashScreen";
  el.className = "splash-screen dynamic" + (mini ? " mini" : "");  // ← tambah "dynamic"
  el.innerHTML = `
    <div class="splash-content">
      <div class="splash-logo">R</div>
      <div class="splash-title">RAYSA<span>STORE</span></div>
      <div class="splash-sub">${text}</div>
      <div class="splash-spinner"></div>
    </div>`;
  document.body.appendChild(el);
}

/**
 * Sembunyikan splash screen dengan animasi fade-out
 * @param {number} delay - Delay sebelum mulai hide (ms)
 */
function hideSplash(delay = 0) {
  setTimeout(() => {
    const el = document.getElementById("splashScreen");
    if (!el) return;
    el.classList.add("hide");
    setTimeout(() => el.remove(), 350);
  }, delay);
}

/**
 * Splash otomatis: tampil → tunda → sembunyikan
 * @param {number} duration - Total durasi tampil (ms)
 * @param {string} text - Teks yang ditampilkan
 * @param {boolean} mini - Mode mini
 */
async function flashSplash(duration = 1200, text = "Memproses...", mini = true) {
  showSplash(text, mini);
  await new Promise(r => setTimeout(r, duration));
  hideSplash();
}

/* =====================================================
   IN-APP UPDATE HELPERS
   ===================================================== */

/**
 * Ambil info update dari Firestore
 * Struktur: settings/store → { latestVersion, apkUrl, updateMsg, forceUpdate }
 */
async function getUpdateInfo() {
  try {
    const doc = await DOC_SETTINGS.get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      latestVersion: data.latestVersion || "",
      apkUrl: data.apkUrl || "",
      updateMsg: data.updateMsg || "Versi baru tersedia dengan fitur dan perbaikan terbaru.",
      forceUpdate: data.forceUpdate || false,
    };
  } catch (e) {
    console.warn("getUpdateInfo err:", e);
    return null;
  }
}

/**
 * Simpan info update ke Firestore (admin only)
 */
async function saveUpdateInfo(info) {
  return DOC_SETTINGS.set(info, { merge: true });
}

/**
 * Bandingkan 2 versi
 * Return: true kalau v2 lebih baru dari v1
 */
function isNewerVersion(v1, v2) {
  if (!v1 || !v2) return false;
  const a = v1.split(".").map(Number);
  const b = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (y > x) return true;
    if (y < x) return false;
  }
  return false;
}