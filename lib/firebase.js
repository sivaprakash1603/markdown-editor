// lib/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUvEo1jWrmbd5nE3MgOLrUW45PAs7XY9Y",
  authDomain: "markdown-text-editor-fe700.firebaseapp.com",
  projectId: "markdown-text-editor-fe700",
  storageBucket: "markdown-text-editor-fe700.firebasestorage.app",
  messagingSenderId: "763356602624",
  appId: "1:763356602624:web:0e0505556ec2842d9793e5",
  measurementId: "G-M6PB9XWX3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export necessary Firebase services
export { auth, provider, signInWithEmailAndPassword, signInWithPopup };