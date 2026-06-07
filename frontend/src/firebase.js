import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnkLfm2g7FK3FTlx7E--aCbhNZQVIsRDMs",
  authDomain: "finfusion-d388c.firebaseapp.com",
  projectId: "finfusion-d388c",
  storageBucket: "finfusion-d388c.firebasestorage.app",
  messagingSenderId: "776821220365",
  appId: "1:776821220365:web:bab5d1118558e73cf4a144"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);