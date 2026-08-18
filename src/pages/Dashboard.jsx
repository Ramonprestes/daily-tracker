import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import DailyTimeline from "../components/DailyTimeline";
import WeeklyPlanner from "../components/WeeklyPlanner";
import MonthlyPlanner from "../components/MonthlyPlanner";
import PerformanceStats from "../components/PerformanceStats";
import {
  getGeneralTasks,
  saveGeneralTasks,
  getDailySnapshot,
  saveDailySnapshot,
} from "../services/plannerService";
import {
  getLocalDateString,
  sortTasksByTime,
  resolveDayTasksWithOverrides,
} from "../utils/dateUtils";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();

  const [currentView, setCurrentView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));

  const [tarefas, setTarefas] = useState([]);
  const [tarefasStatusMap, setTarefasStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false
  );

  // 1. Carregar tarefas e status da data
  useEffect(() => {
    async function loadData() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const generalList = await getGeneralTasks(currentUser.uid);
        setTarefas(sortTasksByTime(generalList || []));

        const daySnap = await getDailySnapshot(currentUser.uid, selectedDate);
        let finalMap = {};

        if (daySnap?.tarefasStatusMap) {
          finalMap = daySnap.tarefasStatusMap;
        } else if (Array.isArray(daySnap?.tarefasConcluidas)) {
          daySnap.tarefasConcluidas.forEach((id) => {
            finalMap[String(id)] = { status: "done", completedAt: "Feito" };
          });
        }
        setTarefasStatusMap(finalMap);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, selectedDate]);

  // 2. Atualizar status de forma direta e instantânea
  const handleSetTaskStatus = (taskId, statusObject) => {
    const key = String(taskId);
    const updatedMap = { ...tarefasStatusMap };

    if (!statusObject) {
      delete updatedMap[key];
    } else {
      updatedMap[key] = statusObject;
    }

    // Atualização visual imediata
    setTarefasStatusMap(updatedMap);

    // Persistência no Firebase
    if (currentUser?.uid) {
      const activeTasks = resolveDayTasksWithOverrides(tarefas, selectedDate);
      saveDailySnapshot(currentUser.uid, selectedDate, {
        tarefasStatusMap: updatedMap,
        totalTarefas: activeTasks.length,
      }).catch((err) => console.error("Erro ao salvar status no Firestore:", err));
    }
  };

  const handleAddTask = async (newTask) => {
    const updated = sortTasksByTime([...tarefas, { ...newTask, id: String(newTask.id) }]);
    setTarefas(updated);
    if (currentUser?.uid) await saveGeneralTasks(currentUser.uid, updated);
  };

  const handleEditTask = async (taskId, updatedData) => {
    const key = String(taskId);
    const updated = tarefas.map((t) => (String(t.id) === key ? { ...t, ...updatedData } : t));
    const sorted = sortTasksByTime(updated);
    setTarefas(sorted);
    if (currentUser?.uid) await saveGeneralTasks(currentUser.uid, sorted);
  };

  const handleDeleteTask = async (taskId) => {
    const key = String(taskId);
    const updated = tarefas.filter((t) => String(t.id) !== key);
    setTarefas(updated);

    const updatedMap = { ...tarefasStatusMap };
    delete updatedMap[key];
    setTarefasStatusMap(updatedMap);

    if (currentUser?.uid) {
      await saveGeneralTasks(currentUser.uid, updated);
      await saveDailySnapshot(currentUser.uid, selectedDate, {
        tarefasStatusMap: updatedMap,
        totalTarefas: updated.length,
      });
    }
  };

  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentView("daily");
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Relatório de Produtividade Diária",