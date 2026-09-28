/* =====================================================
   RAYSA STORE - Firebase Config
   ===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBbe-lZDZ6nZc_DHVRu8Ii1huvEAHLMQ7A",
  authDomain: "raysa-store.firebaseapp.com",
  projectId: "raysa-store",
  storageBucket: "raysa-store.firebasestorage.app",
  messagingSenderId: "487447089192",
  appId: "1:487447089192:web:f990de7b56b0135f49e51d"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_EMAIL = "admin@raysa.com";