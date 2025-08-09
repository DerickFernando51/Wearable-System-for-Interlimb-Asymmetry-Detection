import { initializeApp } from "firebase/app";  
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyBDpRU3LpQl-1iO9JkBSF-i5eQt3wIYbiQ",
  authDomain: "wearable-for-ila-detection.firebaseapp.com",
  databaseURL: "https://wearable-for-ila-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wearable-for-ila-detection",
  storageBucket: "wearable-for-ila-detection.firebasestorage.app",
  messagingSenderId: "29149957946",
  appId: "1:29149957946:web:464c284e87874a002eca03"
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default database;
