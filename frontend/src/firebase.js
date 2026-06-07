import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBv6_JG178td9Og5_P--pEvbk2gemQzPTk",
  authDomain: "finsense-21341.firebaseapp.com",
  projectId: "finsense-21341",
  storageBucket: "finsense-21341.firebasestorage.app",
  messagingSenderId: "521857626827",
  appId: "1:521857626827:web:e56cac8bb2dfbc9a36e14e",
  measurementId: "G-TT82XQX315"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);