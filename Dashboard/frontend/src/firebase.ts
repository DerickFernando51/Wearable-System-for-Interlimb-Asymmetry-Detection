import { initializeApp } from "firebase/app";  
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: " ",
  authDomain: " ",
  databaseURL: " ",
  projectId: " ",
  storageBucket: " ",
  messagingSenderId: " ",
  appId: " "
}

 


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default database;
