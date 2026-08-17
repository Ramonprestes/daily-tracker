import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";

// Conexão com as chaves do .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Funções de Templates de Rotina ---

export async function saveRoutineTemplate(userId, tipo, secoes) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const docRef = doc(db, "users", userId, "routine_templates", tipo);
  await setDoc(docRef, { secoes }, { merge: true });
}

export async function getRoutineTemplate(userId, tipo) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const docRef = doc(db, "users", userId, "routine_templates", tipo);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getAllRoutineTemplates(userId) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const colRef = collection(db, "users", userId, "routine_templates");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// --- Funções de Logs Diários ---

export async function saveDailyLog(userId, date, tipoRotina, tarefasConcluidas) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const docRef = doc(db, "users", userId, "daily_logs", date);
  await setDoc(
    docRef,
    {
      tipoRotina,
      tarefasConcluidas,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getDailyLog(userId, date) {
  if (!userId) throw new Error("Usuário não autenticado.");
  const docRef = doc(db, "users", userId, "daily_logs", date);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}