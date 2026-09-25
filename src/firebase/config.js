

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'; // 1. Import getAuth
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCNEPJp8omu1xORvyhiE2TxAHkLKMSSPhY",
  authDomain: "mapeowebzonasinseguras.firebaseapp.com",
  projectId: "mapeowebzonasinseguras",
  storageBucket: "mapeowebzonasinseguras.firebasestorage.app",
  messagingSenderId: "1079011596508",
  appId: "1:1079011596508:web:b1d9568402c2b5da723c19",
  measurementId: "G-90H4YWJC2K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth }; 
export const db = getFirestore(app);
