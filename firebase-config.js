// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL7EQLswch0Xyz02csCKRnzd0A-wk-wxg",
  authDomain: "mirame-9cc15.firebaseapp.com",
  projectId: "mirame-9cc15",
  storageBucket: "mirame-9cc15.firebasestorage.app",
  messagingSenderId: "353310518689",
  appId: "1:353310518689:web:88e9689d23f29332dbafe0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, ref, uploadBytes, getDownloadURL, deleteObject };
