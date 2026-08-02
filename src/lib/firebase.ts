import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.projectId && config.apiKey && config.appId);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (firebaseConfigured) {
  _app = initializeApp(config);
  _auth = getAuth(_app);
  _db = getFirestore(_app);

  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true") {
    connectAuthEmulator(_auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(_db, "localhost", 8080);
  }
}

export const app = _app as FirebaseApp;
export const auth = _auth as Auth;
export const db = _db as Firestore;
