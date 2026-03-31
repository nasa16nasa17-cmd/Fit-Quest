import admin from "firebase-admin";
import { 
  initializeApp as initializeClientApp, 
  getApp as getClientApp, 
  getApps as getClientApps 
} from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

// Initialize Admin SDK (still used for Auth)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

// Initialize Client SDK on Server
console.log(`Initializing Client SDK on Server for project: ${firebaseConfig.projectId}`);
const clientApp = !getClientApps().length 
  ? initializeClientApp(firebaseConfig) 
  : getClientApp();

// CRITICAL: Pass the databaseId to getFirestore for named databases
const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
console.log(`Using Firestore database: ${dbId}`);
const clientDb = getClientFirestore(clientApp, dbId);

// Compatibility Wrapper to mimic Admin SDK syntax
export const adminDb = {
  collection: (path: string) => ({
    doc: (id?: string) => {
      const docRef = id ? doc(clientDb, path, id) : doc(collection(clientDb, path));
      return {
        get: () => getDoc(docRef),
        set: (data: any, options?: any) => setDoc(docRef, data, options),
        update: (data: any) => updateDoc(docRef, data),
        delete: () => deleteDoc(docRef),
        id: docRef.id,
        path: docRef.path
      };
    },
    where: (field: string, op: any, value: any) => {
      const q = query(collection(clientDb, path), where(field, op, value));
      return {
        orderBy: (orderField: string, direction: any) => {
          const q2 = query(q, orderBy(orderField, direction));
          return {
            get: () => getDocs(q2)
          };
        },
        get: () => getDocs(q)
      };
    }
  }),
  // Add serverTimestamp helper
  firestore: {
    FieldValue: {
      serverTimestamp: () => serverTimestamp()
    }
  }
} as any;

export const adminAuth = admin.auth();
export { admin };

console.log("Firebase 'Client-on-Server' wrapper initialized.");
