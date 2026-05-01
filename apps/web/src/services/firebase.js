import fb from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDTcd2gX30ZsTd-qfDXqhkcFdMa16QcE3A",
  authDomain: "safe-house-app.firebaseapp.com",
  databaseURL: "https://safe-house-app-default-rtdb.firebaseio.com",
  projectId: "safe-house-app",
  storageBucket: "safe-house-app.appspot.com",
  messagingSenderId: "867085496092",
  appId: "1:867085496092:web:45da51578eec093ca714d9",
};

const firebase = !fb.apps.length ? fb.initializeApp(firebaseConfig) : fb.app();

export default firebase;
