import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

// Obter tarefas gerais da rotina
export async function getGeneralTasks(userId) {
  if (!userId) return [];
  try {
    const ref = doc(db, "users", userId, "settings", "generalTasks");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().tasks || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar tarefas gerais:", error);
    return [];
  }
}

// Salvar tarefas gerais da rotina
export async function saveGeneralTasks(userId, tasks) {
  if (!userId) return;
  try {
    const ref = doc(db, "users", userId, "settings", "generalTasks");
    await setDoc(ref, { tasks, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar tarefas gerais:", error);
  }
}

// Obter snapshot de um dia específico
export async function getDailySnapshot(userId, dateStr) {
  if (!userId || !dateStr) return null;
  try {
    const ref = doc(db, "users", userId, "dailySnapshots", dateStr);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar snapshot diário:", error);
    return null;
  }
}

// Salvar snapshot diário
export async function saveDailySnapshot(userId, dateStr, data) {
  if (!userId || !dateStr) return;
  try {
    const ref = doc(db, "users", userId, "dailySnapshots", dateStr);
    await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar snapshot diário:", error);
  }
}

// Obter snapshots por intervalo de datas (para Semanal, Mensal e Estatísticas)
export async function getSnapshotsRange(userId, startDateStr, endDateStr) {
  if (!userId) return {};
  try {
    const colRef = collection(db, "users", userId, "dailySnapshots");
    const snap = await getDocs(colRef);
    const result = {};

    snap.forEach((docItem) => {
      const dateKey = docItem.id;
      if (
        (!startDateStr || dateKey >= startDateStr) &&
        (!endDateStr || dateKey <= endDateStr)
      ) {
        result[dateKey] = docItem.data();
      }
    });

    return result;
  } catch (error) {
    console.error("Erro ao buscar snapshots do período:", error);
    return {};
  }
}

// Obter todos os snapshots
export async function getAllSnapshots(userId) {
  if (!userId) return {};
  try {
    const colRef = collection(db, "users", userId, "dailySnapshots");
    const snap = await getDocs(colRef);
    const result = {};
    snap.forEach((docItem) => {
      result[docItem.id] = docItem.data();
    });
    return result;
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return {};
  }
}