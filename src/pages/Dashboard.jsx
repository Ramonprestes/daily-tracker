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

  useEffect(() => {
    async function loadData() {
      if (!currentUser || !currentUser.uid) return;
      try {
        setLoading(true);
        const generalList = await getGeneralTasks(currentUser.uid);
        setTarefas(sortTasksByTime(generalList || []));

        const daySnap = await getDailySnapshot(currentUser.uid, selectedDate);
        let finalMap = {};

        if (daySnap && daySnap.tarefasStatusMap) {
          finalMap = daySnap.tarefasStatusMap;
        } else if (daySnap && Array.isArray(daySnap.tarefasConcluidas)) {
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

  const handleSetTaskStatus = (taskId, statusObject) => {
    const key = String(taskId);
    const updatedMap = { ...tarefasStatusMap };

    if (!statusObject) {
      delete updatedMap[key];
    } else {
      updatedMap[key] = statusObject;
    }

    setTarefasStatusMap(updatedMap);

    if (currentUser && currentUser.uid) {
      const activeTasks = resolveDayTasksWithOverrides(tarefas, selectedDate);
      saveDailySnapshot(currentUser.uid, selectedDate, {
        tarefasStatusMap: updatedMap,
        totalTarefas: activeTasks.length,
      }).catch((err) => console.error("Erro ao salvar status:", err));
    }
  };

  const handleAddTask = async (newTask) => {
    const updated = sortTasksByTime([...tarefas, { ...newTask, id: String(newTask.id) }]);
    setTarefas(updated);
    if (currentUser && currentUser.uid) {
      await saveGeneralTasks(currentUser.uid, updated);
    }
  };

  const handleEditTask = async (taskId, updatedData) => {
    const key = String(taskId);
    const updated = tarefas.map((t) => (String(t.id) === key ? { ...t, ...updatedData } : t));
    const sorted = sortTasksByTime(updated);
    setTarefas(sorted);
    if (currentUser && currentUser.uid) {
      await saveGeneralTasks(currentUser.uid, sorted);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const key = String(taskId);
    const updated = tarefas.filter((t) => String(t.id) !== key);
    setTarefas(updated);

    const updatedMap = { ...tarefasStatusMap };
    delete updatedMap[key];
    setTarefasStatusMap(updatedMap);

    if (currentUser && currentUser.uid) {
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
      doc.text("Relatorio de Produtividade Diaria", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Usuario: ${currentUser ? currentUser.email : ""}`, 14, 28);
      doc.text(`Data: ${selectedDate}`, 14, 34);

      const activeTasks = resolveDayTasksWithOverrides(tarefas, selectedDate);
      const rows = activeTasks.map((t) => {
        const rec = tarefasStatusMap[String(t.id)];
        let statusStr = "PENDENTE";
        if (rec && rec.status === "done") {
          statusStr = rec.completedAt ? `CONCLUIDO (${rec.completedAt})` : "CONCLUIDO";
        } else if (rec && rec.status === "failed") {
          statusStr = "NAO REALIZADO";
        }
        return [t.horario, t.tarefa, t.duracao || "-", statusStr];
      });

      autoTable(doc, {
        startY: 42,
        head: [["Horario", "Tarefa", "Duracao", "Status"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [2, 132, 199] },
      });

      doc.save(`relatorio-${selectedDate}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }
  };

  const handleRequestNotification = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotificationsEnabled(perm === "granted");
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        editMode={editMode}
        setEditMode={setEditMode}
        notificationsEnabled={notificationsEnabled}
        onRequestNotification={handleRequestNotification}
        onExportPDF={handleExportPDF}
        onLogout={logout}
      />

      <main className="main-content">
        {currentView === "daily" && (
          <DailyTimeline
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            tarefas={tarefas}
            tarefasStatusMap={tarefasStatusMap}
            onSetTaskStatus={handleSetTaskStatus}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            loading={loading}
          />
        )}

        {currentView === "weekly" && (
          <WeeklyPlanner currentUser={currentUser} onSelectDay={handleSelectDay} />
        )}

        {currentView === "monthly" && (
          <MonthlyPlanner currentUser={currentUser} onSelectDay={handleSelectDay} />
        )}

        {currentView === "stats" && (
          <PerformanceStats currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}