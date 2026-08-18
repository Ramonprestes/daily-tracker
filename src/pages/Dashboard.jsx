import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  saveRoutineTemplate,
  getRoutineTemplate,
  saveDailyLog,
  getDailyLog,
} from "../lib/firebase";
import {
  CheckSquare,
  Square,
  LogOut,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  BarChart2,
  Bell,
  BellOff,
  FileDown,
  RotateCcw,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();

  // Data atual como padrão
  const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [tipoRotina, setTipoRotina] = useState("semana");
  const [tarefas, setTarefas] = useState([]);
  const [tarefasConcluidas, setTarefasConcluidas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Painéis e Modais
  const [editMode, setEditMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false
  );
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  // Nova Tarefa
  const [newTaskTime, setNewTaskTime] = useState("08:00");
  const [newTaskName, setNewTaskName] = useState("");

  // Edição inline de tarefa
  const [editingId, setEditingId] = useState(null);
  const [editTaskTime, setEditTaskTime] = useState("");
  const [editTaskName, setEditTaskName] = useState("");

  // Templates padrão (apenas lista direta com horários)
  const defaultTemplates = {
    semana: [
      { id: "1", horario: "06:30", tarefa: "Acordar e hidratação" },
      { id: "07:30", horario: "07:30", tarefa: "Exercício físico / Corrida" },
      { id: "09:00", horario: "09:00", tarefa: "Início do expediente / Prioridades" },
      { id: "12:30", horario: "12:30", tarefa: "Almoço e pausa" },
      { id: "14:00", horario: "14:00", tarefa: "Trabalho focado / Desenvolvimento" },
      { id: "18:00", horario: "18:00", tarefa: "Encerramento das atividades" },
      { id: "20:00", horario: "20:00", tarefa: "Jantar e tempo em família" },
      { id: "22:30", horario: "22:30", tarefa: "Desconectar e descanso" },
    ],
    "fim-de-semana": [
      { id: "1", horario: "08:30", tarefa: "Café da manhã com calma" },
      { id: "10:30", horario: "10:30", tarefa: "Atividade ao ar livre / Passeio" },
      { id: "13:00", horario: "13:00", tarefa: "Almoço / Churrasco" },
      { id: "17:00", horario: "17:00", tarefa: "Lazer / Café da tarde" },
      { id: "22:00", horario: "22:00", tarefa: "Descanso" },
    ],
    foco: [
      { id: "1", horario: "08:00", tarefa: "Planejamento das metas do dia" },
      { id: "09:00", horario: "09:00", tarefa: "Bloco de Foco 1 (Sem distrações)" },
      { id: "11:00", horario: "11:00", tarefa: "Revisão e ajustes técnicos" },
      { id: "14:00", horario: "14:00", tarefa: "Bloco de Foco 2 (Execução pesada)" },
      { id: "16:30", horario: "16:30", tarefa: "Validação e entrega de tarefas" },
    ],
  };

  // Função para ordenar tarefas da mais cedo para a mais tarde
  const sortTasks = (tasksList) => {
    return [...tasksList].sort((a, b) => a.horario.localeCompare(b.horario));
  };

  // Carregar dados
  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      setLoading(true);

      // 1. Template
      let template = await getRoutineTemplate(currentUser.uid, tipoRotina);
      let loadedTasks = [];

      if (!template || (!template.tarefas && !template.secoes)) {
        loadedTasks = defaultTemplates[tipoRotina] || defaultTemplates.semana;
        await saveRoutineTemplate(currentUser.uid, tipoRotina, { tarefas: loadedTasks });
      } else if (template.tarefas) {
        loadedTasks = template.tarefas;
      } else if (template.secoes) {
        // Migração suave de dados antigos se houver
        template.secoes.forEach((sec, sIdx) => {
          sec.blocos.forEach((b, bIdx) => {
            loadedTasks.push({
              id: `${sIdx}-${bIdx}-${Date.now()}`,
              horario: b.horario,
              tarefa: b.tarefa,
            });
          });
        });
      }

      setTarefas(sortTasks(loadedTasks));

      // 2. Logs diários
      const log = await getDailyLog(currentUser.uid, selectedDate);
      if (log && log.tarefasConcluidas) {
        setTarefasConcluidas(log.tarefasConcluidas);
      } else {
        setTarefasConcluidas([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [currentUser, tipoRotina, selectedDate]);

  // Lembretes no horário
  useEffect(() => {
    if (!notificationsEnabled || tarefas.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      tarefas.forEach((t) => {
        const isDone = tarefasConcluidas.includes(t.id);
        if (t.horario === currentTimeStr && !isDone && !notifiedTasks.has(t.id)) {
          new Notification("Daily Tracker: Tarefa Agora!", {
            body: `${t.horario} - ${t.tarefa}`,
            icon: "/vite.svg",
          });
          setNotifiedTasks((prev) => new Set(prev).add(t.id));
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [notificationsEnabled, tarefas, tarefasConcluidas, notifiedTasks]);

  // Ativar Notificações
  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("Navegador sem suporte a notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      new Notification("Daily Tracker", {
        body: "Notificações ativadas para os horários das suas tarefas!",
      });
    } else {
      setNotificationsEnabled(false);
    }
  }

  // Marcar/Desmarcar tarefa
  async function toggleTask(taskId) {
    let updated;
    if (tarefasConcluidas.includes(taskId)) {
      updated = tarefasConcluidas.filter((id) => id !== taskId);
    } else {
      updated = [...tarefasConcluidas, taskId];
    }
    setTarefasConcluidas(updated);
    await saveDailyLog(currentUser.uid, selectedDate, tipoRotina, updated);
  }

  // Adicionar Tarefa
  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      horario: newTaskTime,
      tarefa: newTaskName.trim(),
    };

    const updated = sortTasks([...tarefas, newTask]);
    setTarefas(updated);
    setNewTaskName("");
    await saveRoutineTemplate(currentUser.uid, tipoRotina, { tarefas: updated });
  }

  // Iniciar Edição
  function startEditing(task) {
    setEditingId(task.id);
    setEditTaskTime(task.horario);
    setEditTaskName(task.tarefa);
  }

  // Salvar Edição
  async function saveEditing(taskId) {
    if (!editTaskName.trim()) return;

    const updated = tarefas.map((t) => {
      if (t.id === taskId) {
        return { ...t, horario: editTaskTime, tarefa: editTaskName.trim() };
      }
      return t;
    });

    const sorted = sortTasks(updated);
    setTarefas(sorted);
    setEditingId(null);
    await saveRoutineTemplate(currentUser.uid, tipoRotina, { tarefas: sorted });
  }

  // Cancelar Edição
  function cancelEditing() {
    setEditingId(null);
  }

  // Excluir Tarefa
  async function handleDeleteTask(taskId) {
    const updated = tarefas.filter((t) => t.id !== taskId);
    setTarefas(updated);
    if (tarefasConcluidas.includes(taskId)) {
      const updatedDone = tarefasConcluidas.filter((id) => id !== taskId);
      setTarefasConcluidas(updatedDone);
      await saveDailyLog(currentUser.uid, selectedDate, tipoRotina, updatedDone);
    }
    await saveRoutineTemplate(currentUser.uid, tipoRotina, { tarefas: updated });
  }

  // Histórico
  async function loadHistory() {
    setShowStats(true);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = await getDailyLog(currentUser.uid, dateStr);
      days.push({
        date: dateStr,
        totalDone: log?.tarefasConcluidas?.length || 0,
      });
    }
    setHistoryLogs(days);
  }

  // Exportar PDF
  async function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Rotina Diária - Daily Tracker", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Usuário: ${currentUser?.email}`, 14, 28);
    doc.text(`Data: ${selectedDate} | Rotina: ${tipoRotina.toUpperCase()}`, 14, 34);

    const tableRows = tarefas.map((t) => [
      t.horario,
      t.tarefa,
      tarefasConcluidas.includes(t.id) ? "CONCLUÍDO" : "PENDENTE",
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Horário", "Tarefa", "Status"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] },
      styles: { fontSize: 10, cellPadding: 4 },
      didParseCell: function (data) {
        if (data.column.index === 2) {
          if (data.cell.raw === "CONCLUÍDO") {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    const totalT = tarefas.length;
    const completedT = tarefasConcluidas.length;
    const finalY = (doc.lastAutoTable?.finalY || 100) + 12;

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `Progresso: ${completedT}/${totalT} tarefas (${progressPercent}%)`,
      14,
      finalY
    );

    doc.save(`daily-tracker-${selectedDate}.pdf`);
  }

  const currentTaskIds = new Set(tarefas.map((t) => t.id));
  const validCompleted = tarefasConcluidas.filter((id) => currentTaskIds.has(id));
  const totalTasks = tarefas.length;
  const completedTasks = validCompleted.length;
  const progressPercent =
    totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;
  const isToday = selectedDate === getTodayStr();

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <h2>Daily Tracker</h2>
          <span className="user-email">{currentUser?.email}</span>
        </div>
        <div className="navbar-actions">
          <button
            className={`btn-secondary ${notificationsEnabled ? "active-bell" : ""}`}
            onClick={requestNotificationPermission}
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            {notificationsEnabled ? "Lembretes Ativos" : "Ativar Lembretes"}
          </button>
          <button className="btn-secondary" onClick={exportPDF}>
            <FileDown size={16} /> Exportar PDF
          </button>
          <button
            className={`btn-secondary ${showStats ? "active" : ""}`}
            onClick={() => (showStats ? setShowStats(false) : loadHistory())}
          >
            <BarChart2 size={16} /> Relatórios
          </button>
          <button
            className={`btn-secondary ${editMode ? "active" : ""}`}
            onClick={() => setEditMode(!editMode)}
          >
            <Sliders size={16} /> {editMode ? "Fechar Edição" : "Editar Tarefas"}
          </button>
          <button onClick={() => logout()} className="btn-logout">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* RELATÓRIO 7 DIAS */}
        {showStats && (
          <div className="stats-panel">
            <div className="stats-header">
              <h3>
                <BarChart2 size={20} /> Histórico dos Últimos 7 Dias
              </h3>
              <button className="btn-link" onClick={() => setShowStats(false)}>
                Fechar
              </button>
            </div>
            <div className="history-bars">
              {historyLogs.map((item, idx) => (
                <div key={idx} className="bar-column">
                  <span className="bar-count">{item.totalDone}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ height: `${Math.min(item.totalDone * 15, 100)}%` }}
                    ></div>
                  </div>
                  <span className="bar-date">
                    {item.date.slice(5).replace("-", "/")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTROLES E DATA */}
        <div className="controls-bar">
          <div className="date-picker-wrap">
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {!isToday && (
              <button
                className="btn-today"
                onClick={() => setSelectedDate(getTodayStr())}
                title="Voltar para a data de hoje"
              >
                <RotateCcw size={14} /> Hoje
              </button>
            )}
          </div>

          <div className="routine-selector">
            <button
              className={`btn-tab ${tipoRotina === "semana" ? "active" : ""}`}
              onClick={() => setTipoRotina("semana")}
            >
              Semana
            </button>
            <button
              className={`btn-tab ${tipoRotina === "fim-de-semana" ? "active" : ""}`}
              onClick={() => setTipoRotina("fim-de-semana")}
            >
              Fim de Semana
            </button>
            <button
              className={`btn-tab ${tipoRotina === "foco" ? "active" : ""}`}
              onClick={() => setTipoRotina("foco")}
            >
              Foco Total
            </button>
          </div>

          <div className="progress-card">
            <div className="progress-info">
              <span>{isToday ? "Progresso de hoje" : `Progresso em ${selectedDate.slice(5).replace("-", "/")}`}</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE ADIÇÃO */}
        {editMode && (
          <div className="editor-box">
            <h4>Adicionar Nova Tarefa ({tipoRotina.toUpperCase()})</h4>
            <form onSubmit={handleAddTask} className="add-task-form">
              <input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="input-time"
              />
              <input
                type="text"
                placeholder="Ex: Treino, Reunião, Estudo de Engenharia..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="input-task-name"
              />
              <button type="submit" className="btn-action">
                <Plus size={16} /> Adicionar
              </button>
            </form>
          </div>
        )}

        {/* TIMELINE DE TAREFAS CRONOLÓGICA */}
        {loading ? (
          <p className="loading-text">Carregando rotina diária...</p>
        ) : (
          <div className="timeline-container">
            {tarefas.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma tarefa cadastrada nesta rotina.</p>
                <button
                  className="btn-action"
                  onClick={() => setEditMode(true)}
                  style={{ margin: "12px auto" }}
                >
                  <Plus size={16} /> Adicionar Primeira Tarefa
                </button>
              </div>
            ) : (
              tarefas.map((task) => {
                const isDone = tarefasConcluidas.includes(task.id);
                const isEditing = editingId === task.id;

                if (isEditing) {
                  return (
                    <div key={task.id} className="task-row editing-row">
                      <input
                        type="time"
                        value={editTaskTime}
                        onChange={(e) => setEditTaskTime(e.target.value)}
                        className="input-time-edit"
                      />
                      <input
                        type="text"
                        value={editTaskName}
                        onChange={(e) => setEditTaskName(e.target.value)}
                        className="input-task-name-edit"
                        autoFocus
                      />
                      <div className="edit-actions">
                        <button
                          className="btn-save-edit"
                          onClick={() => saveEditing(task.id)}
                          title="Salvar alterações"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="btn-cancel-edit"
                          onClick={cancelEditing}
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={`task-row ${isDone ? "completed" : ""}`}
                  >
                    <div
                      className="task-main"
                      onClick={() => toggleTask(task.id)}
                    >
                      {isDone ? (
                        <CheckSquare className="task-icon checked" size={22} />
                      ) : (
                        <Square className="task-icon" size={22} />
                      )}
                      <span className="task-badge-time">{task.horario}</span>
                      <span className="task-title">{task.tarefa}</span>
                    </div>

                    {editMode && (
                      <div className="row-actions">
                        <button
                          className="btn-action-icon edit"
                          onClick={() => startEditing(task)}
                          title="Editar Tarefa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-action-icon delete"
                          onClick={() => handleDeleteTask(task.id)}
                          title="Excluir Tarefa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}