import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import DailyTimeline from "../components/DailyTimeline";
import WeeklyPlanner from "../components/WeeklyPlanner";
import MonthlyPlanner from "../components/MonthlyPlanner";
import PerformanceStats from "../components/PerformanceStats";
import {
  getDailySnapshot,
  saveDailySnapshot,
  saveTemplate,
} from "../services/plannerService";
import { getLocalDateString, sortTasksByTime } from "../utils/dateUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();

  // Navegação de Telas: 'daily' | 'weekly' | 'monthly' | 'stats'
  const [currentView, setCurrentView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [tipoRotina, setTipoRotina] = useState("semana");

  // Estado do Snapshot Diário
  const [tarefas, setTarefas] = useState([]);
  const [tarefasConcluidas, setTarefasConcluidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false
  );
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  // Carregar dados da data selecionada
  useEffect(() => {
    async function loadDay() {
      if (!currentUser) return;
      setLoading(true);
      const snap = await getDailySnapshot(currentUser.uid, selectedDate, tipoRotina);
      setTarefas(snap.tarefas);
      setTarefasConcluidas(snap.tarefasConcluidas);
      setTipoRotina(snap.tipoRotina);
      setLoading(false);
    }

    loadDay();
  }, [currentUser, selectedDate]);

  // Salvar no Firebase sempre que as tarefas ou conclusões mudarem
  const persistChanges = async (newTarefas, newConcluidas, newTipo = tipoRotina) => {
    if (!currentUser) return;
    await saveDailySnapshot(currentUser.uid, selectedDate, {
      tarefas: newTarefas,
      tarefasConcluidas: newConcluidas,
      tipoRotina: newTipo,
    });
  };

  // Toggle de conclusão
  const handleToggleTask = async (taskId) => {
    let updated;
    if (tarefasConcluidas.includes(taskId)) {
      updated = tarefasConcluidas.filter((id) => id !== taskId);
    } else {
      updated = [...tarefasConcluidas, taskId];
    }
    setTarefasConcluidas(updated);
    await persistChanges(tarefas, updated);
  };

  // Adicionar Tarefa
  const handleAddTask = async (newTask) => {
    const updated = sortTasksByTime([...tarefas, newTask]);
    setTarefas(updated);
    await persistChanges(updated, tarefasConcluidas);
    await saveTemplate(currentUser.uid, tipoRotina, updated);
  };

  // Editar Tarefa
  const handleEditTask = async (taskId, updatedData) => {
    const updated = tarefas.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t));
    const sorted = sortTasksByTime(updated);
    setTarefas(sorted);
    await persistChanges(sorted, tarefasConcluidas);
    await saveTemplate(currentUser.uid, tipoRotina, sorted);
  };

  // Excluir Tarefa
  const handleDeleteTask = async (taskId) => {
    const updated = tarefas.filter((t) => t.id !== taskId);
    const updatedConcluidas = tarefasConcluidas.filter((id) => id !== taskId);
    setTarefas(updated);
    setTarefasConcluidas(updatedConcluidas);
    await persistChanges(updated, updatedConcluidas);
    await saveTemplate(currentUser.uid, tipoRotina, updated);
  };

  // Ir para dia clicado a partir do planner semanal ou mensal
  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentView("daily");
  };

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Produtividade Diária", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Usuário: ${currentUser?.email}`, 14, 28);
    doc.text(`Data: ${selectedDate} | Rotina: ${tipoRotina.toUpperCase()}`, 14, 34);

    const rows = tarefas.map((t) => [
      t.horario,
      t.tarefa,
      tarefasConcluidas.includes(t.id) ? "CONCLUÍDO" : "PENDENTE",
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Horário", "Tarefa", "Status"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] },
    });

    doc.save(`relatorio-${selectedDate}.pdf`);
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
            tipoRotina={tipoRotina}
            setTipoRotina={(t) => {
              setTipoRotina(t);
              persistChanges(tarefas, tarefasConcluidas, t);
            }}
            tarefas={tarefas}
            tarefasConcluidas={tarefasConcluidas}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            editMode={editMode}
            setEditMode={setEditMode}
          />
        )}

        {currentView === "weekly" && (
          <WeeklyPlanner
            currentUser={currentUser}
            onSelectDay={handleSelectDay}
          />
        )}

        {currentView === "monthly" && (
          <MonthlyPlanner
            currentUser={currentUser}
            onSelectDay={handleSelectDay}
          />
        )}

        {currentView === "stats" && (
          <PerformanceStats currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}