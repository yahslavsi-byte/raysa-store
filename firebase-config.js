/* =====================================================
   RAYSA STORE - Firebase Config
   ⚠️ GANTI dengan config dari Firebase Console Anda
   ===================================================== */

const firebaseConfig = {
  apiKey: "GANTI_API_KEY",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI",
  appId: "GANTI"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Email admin (harus sama dengan Firestore Rules)
const ADMIN_EMAIL = "admin@raysa.com";