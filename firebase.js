// firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

// FIREBASE_SERVICE_ACCOUNT env se pura JSON text parse kar rahe hain
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default admin;
