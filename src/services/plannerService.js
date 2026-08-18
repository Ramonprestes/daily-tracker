import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { sortTasksByTime } from "../utils/dateUtils";

// Templates padrão
export const DEFAULT_TEMPLATES = {
  semana: [
    { id: "1", horario: "06:30", tarefa: "Acordar e hidratação", recorrencia: "diario" },
    { id: "2", horario: "07:30", tarefa: "Exercício físico / Treino", recorrencia: "diario" },
    { id: "3", horario: "09:00", tarefa: "Início do trabalho / Prioridades", recorrencia: "semana" },
    { id: "12:30", horario: "12:30", tarefa: "Almoço e descanso", recorrencia: "diario" },
    { id: "14:00", horario: "14:00", tarefa: "Bloco de foco e desenvolvimento", recorrencia: "semana" },
    { id: "18:00", horario: "18:00", tarefa: "Encerramento do expediente", recorrencia: "semana" },
    { id: "20:00", horario: "20:00", tarefa: "Jantar e tempo pessoal", recorrencia: "diario" },
    { id: "22:30", horario: "22:30", tarefa: "Desconectar e descanso", recorrencia: "diario" },
  ],
  "fim-de-semana": [
    { id: "1", horario: "08:30", tarefa: "Café da manhã com calma", recorrencia: "fim-de-semana" },
    { id: "10:30", horario: "10:30", tarefa: "Atividade ao ar livre / Lazer", recorrencia: "fim-de-semana" },
    { id: "13:00", horario: "13:00", tarefa: "Almoço / Lazer", recorrencia: "fim-de-semana" },
    { id: "22:00", horario: "22:00", tarefa: "Descanso", recorrencia: "fim-de-semana" },
  ],
  foco: [
    { id: "1", horario: "08:00", tarefa: "Planejamento das metas de alta prioridade", recorrencia: "foco" },
    { id: "09:00", horario: "09:00", tarefa: "Sessão Pomodoro 1 (Sem notificações)", recorrencia: "foco" },
    { id: "14:00", horario: "14:00", tarefa: "Sessão Pomodoro 2 (Execução pesada)", recorrencia: "foco" },
    { id: "17:00", horario: "17:00", tarefa: "Revisão e fechamento do dia", recorrencia: "foco" },
  ],
};

// Obter Template
export async function getTemplate(userId, tipo) {
  if (!userId) return null;
  const docRef = doc(db, "users", userId, "routine_templates", tipo);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().tarefas || [];
  }
  const initial = DEFAULT_TEMPLATES[tipo] || DEFAULT_TEMPLATES.semana;
  await setDoc(docRef, { tarefas: initial });
  return initial;
}

// Salvar Template
export async function saveTemplate(userId, tipo, tarefas) {
  if (!userId) return;
  const docRef = doc(db, "users", userId, "routine_templates", tipo);
  const sorted = sortTasksByTime(tarefas);
  await setDoc(docRef, { tarefas: sorted }, { merge: true });
}

// Obter ou Inicializar dados do dia (Snapshot independente)
export async function getDailySnapshot(userId, dateStr, defaultRoutineType = "semana") {
  if (!userId || !dateStr) return { tarefas: [], tarefasConcluidas: [] };
  const docRef = doc(db, "users", userId, "daily_snapshots", dateStr);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      tarefas: sortTasksByTime(data.tarefas || []),
      tarefasConcluidas: data.tarefasConcluidas || [],
      tipoRotina: data.tipoRotina || defaultRoutineType,
    };
  }

  // Se o dia ainda não foi iniciado, carrega as tarefas do template
  const templateTasks = await getTemplate(userId, defaultRoutineType);
  return {
    tarefas: sortTasksByTime(templateTasks),
    tarefasConcluidas: [],
    tipoRotina: defaultRoutineType,
  };
}

// Salvar Snapshot do dia (Salva tanto a lista de tarefas daquele dia quanto as conclusões)
export async function saveDailySnapshot(userId, dateStr, snapshotData) {
  if (!userId || !dateStr) return;
  const docRef = doc(db, "users", userId, "daily_snapshots", dateStr);
  const total = snapshotData.tarefas?.length || 0;
  const done = snapshotData.tarefasConcluidas?.length || 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  await setDoc(
    docRef,
    {
      ...snapshotData,
      percent,
      totalTarefas: total,
      tarefasFeitas: done,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

// Carregar múltiplos dias para o calendário / semana
export async function getSnapshotsRange(userId, dateList = []) {
  if (!userId || dateList.length === 0) return {};
  const results = {};

  await Promise.all(
    dateList.map(async (dateStr) => {
      const docRef = doc(db, "users", userId, "daily_snapshots", dateStr);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        results[dateStr] = snap.data();
      } else {
        results[dateStr] = null;
      }
    })
  );

  return results;
}