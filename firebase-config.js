// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbe-lZDZ6nZc_DHVRu8Ii1huvEAHLMQ7A",
  authDomain: "raysa-store.firebaseapp.com",
  databaseURL: "https://raysa-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raysa-store",
  storageBucket: "raysa-store.firebasestorage.app",
  messagingSenderId: "487447089192",
  appId: "1:487447089192:web:f990de7b56b0135f49e51d",
  measurementId: "G-K9VEZFP4X8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);