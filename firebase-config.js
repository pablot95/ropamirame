import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL7EQLswch0Xyz02csCKRnzd0A-wk-wxg",
  authDomain: "mirame-9cc15.firebaseapp.com",
  projectId: "mirame-9cc15",
  storageBucket: "mirame-9cc15.firebasestorage.app",
  messagingSenderId: "353310518689",
  appId: "1:353310518689:web:88e9689d23f29332dbafe0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc };
