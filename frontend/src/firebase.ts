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

// const firebaseConfig = {
//   apiKey: "AIzaSyCAEZrAINGTzpIkXaOViUzMq6jd4sji02Y",
//   authDomain: "barcode-83a25.firebaseapp.com",
//   databaseURL: "https://barcode-83a25-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "barcode-83a25",
//   storageBucket: "barcode-83a25.firebasestorage.app",
//   messagingSenderId: "780358861601",
//   appId: "1:780358861601:web:96fcff46d6797b08a1f460",
//   measurementId: "G-8M5MMDLQT0"
// };


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default database;