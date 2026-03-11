import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBC9iTVbIGmEmeS3a6vIzzxIItwyngnKWM",
  authDomain: "carrier-chaos.firebaseapp.com",
  projectId: "carrier-chaos",
  storageBucket: "carrier-chaos.firebasestorage.app",
  messagingSenderId: "628510942396",
  appId: "1:628510942396:web:2f46070ec467ceae0b1cb9",
  measurementId: "G-3MCQEKG9TZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
