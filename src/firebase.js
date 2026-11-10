import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB22mqgDHsKV47UPKS81cjtFZ2jmXE6T48",
  authDomain: "growthos-f30c5.firebaseapp.com",
  projectId: "growthos-f30c5",
  storageBucket: "growthos-f30c5.firebasestorage.app",
  messagingSenderId: "892631220160",
  appId: "1:892631220160:web:82cc4b0e4cedde2941225"
};

const app = initializeApp(firebaseConfig);

// Offline persistence (cache) enable panrathukaaga initializeFirestore use panrom
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Firebase Storage export for direct image/file uploads
export const storage = getStorage(app);