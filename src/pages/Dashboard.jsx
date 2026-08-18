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

// Garante que toda tarefa possua um ID único estável
function normalizeTasksList(list = []) {
  return list.map((t, idx) => ({
    ...t,
    id: String(t.id || `${t.horario || "00:00"}_${t.tarefa || idx}`),
  }));
}

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

  // Carrega tarefas e status da data
  useEffect(() => {
    async function loadData() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const generalList = await getGeneralTasks(currentUser.uid);
        const normalized = normalizeTasksList(generalList || []);
        setTarefas(sortTasksByTime(normalized));

        const daySnap = await getDailySnapshot(currentUser.uid, selectedDate);
        let finalMap = {};

        if (daySnap?.tarefasStatusMap) {
          finalMap = daySnap.tarefasStatusMap;
        } else if (Array.isArray(daySnap?.tarefasConcluidas)) {
          daySnap.tarefasConcluidas.forEach((val) => {
            finalMap[String(val)] = { status: "done", completedAt: "Feito" };
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

  // Atualiza status da tarefa no estado e no Firebase
  const handleSetTaskStatus = (taskId, statusObject) => {
    const key = String(taskId);

    setTarefasStatusMap((prev) => {
      const nextMap = { ...prev };
      if (!statusObject) {
        delete nextMap[key];
      } else {
        nextMap[key] = statusObject;
      }

      if (currentUser?.uid) {
        const activeTasks = resolveDayTasksWithOverrides(tarefas, selectedDate);
        saveDailySnapshot(currentUser.uid, selectedDate, {
          tarefasStatusMap: nextMap,
          totalTarefas: activeTasks.length,
        }).catch((e) => console.error("Erro background save:", e));
      }

      return nextMap;
    });
  };

  const handleAddTask = async (newTask) => {
    const generatedId = String(newTask.id || `${newTask.horario}_${newTask.tarefa}_${Date.now()}`);
    const updated = sortTasksByTime([...tarefas, { ...newTask, id: generatedId }]);
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

    setTarefasStatusMap((prev) => {
      const nextMap = { ...prev };
      delete nextMap[key];
      if (currentUser?.uid) {
        saveDailySnapshot(currentUser.uid, selectedDate, {
          tarefasStatusMap: nextMap,
          totalTarefas: updated.length,
        });
        saveGeneralTasks(currentUser.uid, updated);
      }
      return nextMap;
    });
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
      doc.text("Relatório de Produtividade Diária", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Usuário: ${currentUser?.email || ""}`, 14, 28);
      doc.text(`Data: ${selectedDate}`, 14, 34);

      const activeTasks = resolveDayTasksWithOverrides(tarefas, selectedDate);
      const rows = activeTasks.map((t) => {
        const key = String(t.id);
        const rec = tarefasStatusMap[key];
        let statusStr = "PENDENTE";
        if (rec?.status === "done") {
          statusStr = rec.completedAt ? `CONCLUÍDO (${rec.completedAt})` : "CONCLUÍDO";
        } else if (rec?.status === "failed") {
          statusStr = "NÃO REALIZADO";
        }
        return [t.horario, t.tarefa, t.duracao || "-", statusStr];
      });

      autoTable(doc, {
        startY: 42,
        head: [["Horário", "Tarefa", "Duração", "Status"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [2, 132, 199] },
      });

      doc.save(`relatorio-${selectedDate}.pdf`);
    } catch (err) {
      console.error("Erro PDF:", err);
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