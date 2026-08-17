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
  Sliders,
  BarChart2,
  Bell,
  BellOff,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tipoRotina, setTipoRotina] = useState("semana");
  const [secoes, setSecoes] = useState([]);
  const [tarefasConcluidas, setTarefasConcluidas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais e painéis
  const [editMode, setEditMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Notificações do navegador
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission === "granted"
      : false
  );
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  // Inputs para nova tarefa/seção
  const [newSectionName, setNewSectionName] = useState("");
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);
  const [newTaskTime, setNewTaskTime] = useState("08:00");
  const [newTaskName, setNewTaskName] = useState("");

  const defaultTemplates = {
    semana: [
      {
        nome: "Manhã",
        blocos: [
          { horario: "07:00", tarefa: "Acordar e hidratação" },
          { horario: "08:00", tarefa: "Exercício / Treino físico" },
        ],
      },
      {
        nome: "Tarde",
        blocos: [
          { horario: "14:00", tarefa: "Foco no Trabalho / Estudos" },
          { horario: "17:00", tarefa: "Pausa para café e leitura" },
        ],
      },
    ],
    "fim-de-semana": [
      {
        nome: "Manhã",
        blocos: [
          { horario: "08:30", tarefa: "Café da manhã em família" },
          { horario: "10:00", tarefa: "Atividade ao ar livre / Lazer" },
        ],
      },
      {
        nome: "Noite",
        blocos: [
          { horario: "19:00", tarefa: "Descanso / Churrasco com amigos" },
          { horario: "22:00", tarefa: "Desconectar e descansar" },
        ],
      },
    ],
    foco: [
      {
        nome: "Bloco Intensivo",
        blocos: [
          { horario: "09:00", tarefa: "Sessão de Foco 1: Prioridade Alta" },
          { horario: "11:00", tarefa: "Sessão de Foco 2: Desenvolvimento" },
          { horario: "15:00", tarefa: "Revisão e alinhamento do dia" },
        ],
      },
    ],
  };

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      setLoading(true);

      let template = await getRoutineTemplate(currentUser.uid, tipoRotina);
      if (!template || !template.secoes || template.secoes.length === 0) {
        const initial = defaultTemplates[tipoRotina] || defaultTemplates.semana;
        await saveRoutineTemplate(currentUser.uid, tipoRotina, initial);
        template = { secoes: initial };
      }
      setSecoes(template.secoes);

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

  useEffect(() => {
    if (!notificationsEnabled || secoes.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      secoes.forEach((secao, sIdx) => {
        secao.blocos.forEach((bloco, bIdx) => {
          const taskId = `${sIdx}-${bIdx}`;
          const isDone = tarefasConcluidas.includes(taskId);

          if (bloco.horario === currentTimeStr && !isDone && !notifiedTasks.has(taskId)) {
            new Notification("Daily Tracker: Hora da Tarefa!", {
              body: `[${secao.nome}] ${bloco.tarefa} (${bloco.horario})`,
              icon: "/vite.svg",
            });
            setNotifiedTasks((prev) => new Set(prev).add(taskId));
          }
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [notificationsEnabled, secoes, tarefasConcluidas, notifiedTasks]);

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      new Notification("Daily Tracker", {
        body: "Notificações e lembretes ativados com sucesso!",
      });
    } else {
      setNotificationsEnabled(false);
    }
  }

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

  async function handleAddSection(e) {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const updated = [...secoes, { nome: newSectionName.trim(), blocos: [] }];
    setSecoes(updated);
    setNewSectionName("");
    await saveRoutineTemplate(currentUser.uid, tipoRotina, updated);
  }

  async function handleDeleteSection(sIdx) {
    const updated = secoes.filter((_, idx) => idx !== sIdx);
    setSecoes(updated);
    await saveRoutineTemplate(currentUser.uid, tipoRotina, updated);
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskName.trim() || secoes.length === 0) return;

    const updated = [...secoes];
    updated[selectedSectionIdx].blocos.push({
      horario: newTaskTime,
      tarefa: newTaskName.trim(),
    });

    setSecoes(updated);
    setNewTaskName("");
    await saveRoutineTemplate(currentUser.uid, tipoRotina, updated);
  }

  async function handleDeleteTask(sIdx, bIdx) {
    const updated = [...secoes];
    updated[sIdx].blocos = updated[sIdx].blocos.filter((_, idx) => idx !== bIdx);
    setSecoes(updated);
    await saveRoutineTemplate(currentUser.uid, tipoRotina, updated);
  }

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

  async function exportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Rotina Diária - Daily Tracker", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Usuário: ${currentUser?.email}`, 14, 28);
    doc.text(`Data: ${selectedDate} | Rotina: ${tipoRotina.toUpperCase()}`, 14, 34);

    const tableRows = [];
    secoes.forEach((secao, sIdx) => {
      secao.blocos.forEach((bloco, bIdx) => {
        const taskId = `${sIdx}-${bIdx}`;
        const isDone = tarefasConcluidas.includes(taskId);
        tableRows.push([
          secao.nome,
          bloco.horario,
          bloco.tarefa,
          isDone ? "CONCLUÍDO" : "PENDENTE",
        ]);
      });
    });

    autoTable(doc, {
      startY: 42,
      head: [["Seção", "Horário", "Tarefa", "Status"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] },
      styles: { fontSize: 10, cellPadding: 4 },
      didParseCell: function (data) {
        if (data.column.index === 3) {
          if (data.cell.raw === "CONCLUÍDO") {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    const totalT = tableRows.length;
    const completedT = tarefasConcluidas.length;
    const finalY = (doc.lastAutoTable?.finalY || 100) + 12;

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Resumo: ${completedT}/${totalT} tarefas concluídas (${progressPercent}%)`, 14, finalY);

    doc.save(`daily-tracker-${selectedDate}.pdf`);
  }

  const totalTasks = secoes.reduce((acc, sec) => acc + sec.blocos.length, 0);
  const completedTasks = tarefasConcluidas.length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="app-container">
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
            {notificationsEnabled ? "Lembretes On" : "Ativar Lembretes"}
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
            <Sliders size={16} /> {editMode ? "Concluir Edição" : "Editar Rotina"}
          </button>
          <button onClick={() => logout()} className="btn-logout">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="main-content">
        {showStats && (
          <div className="stats-panel">
            <div className="stats-header">
              <h3>
                <BarChart2 size={20} /> Desempenho nos Últimos 7 Dias
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
                      style={{ height: `${Math.min(item.totalDone * 20, 100)}%` }}
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

        <div className="controls-bar">
          <div className="date-picker-wrap">
            <Calendar size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
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
              <span>Progresso de hoje</span>
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

        {editMode && (
          <div className="editor-box">
            <h4>Personalizar Template: {tipoRotina.toUpperCase()}</h4>
            <div className="editor-forms">
              <form onSubmit={handleAddSection} className="inline-form">
                <input
                  type="text"
                  placeholder="Nome da Seção (ex: Noite, Treino)"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
                <button type="submit" className="btn-action">
                  <Plus size={16} /> Nova Seção
                </button>
              </form>

              {secoes.length > 0 && (
                <form onSubmit={handleAddTask} className="inline-form">
                  <select
                    value={selectedSectionIdx}
                    onChange={(e) => setSelectedSectionIdx(Number(e.target.value))}
                  >
                    {secoes.map((s, idx) => (
                      <option key={idx} value={idx}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Descrição da Tarefa"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />
                  <button type="submit" className="btn-action">
                    <Plus size={16} /> Adicionar Tarefa
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <p className="loading-text">Carregando seus dados...</p>
        ) : (
          <div className="sections-grid">
            {secoes.map((secao, sIdx) => (
              <div key={sIdx} className="section-card">
                <div className="section-header">
                  <h3>{secao.nome}</h3>
                  {editMode && (
                    <button
                      className="btn-trash"
                      onClick={() => handleDeleteSection(sIdx)}
                      title="Excluir Seção"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="task-list">
                  {secao.blocos.length === 0 && (
                    <p className="empty-section">Nenhuma tarefa nesta seção.</p>
                  )}
                  {secao.blocos.map((bloco, bIdx) => {
                    const taskId = `${sIdx}-${bIdx}`;
                    const isDone = tarefasConcluidas.includes(taskId);

                    return (
                      <div
                        key={taskId}
                        className={`task-item ${isDone ? "completed" : ""}`}
                      >
                        <div
                          className="task-content"
                          onClick={() => toggleTask(taskId)}
                        >
                          {isDone ? (
                            <CheckSquare
                              className="task-icon checked"
                              size={20}
                            />
                          ) : (
                            <Square className="task-icon" size={20} />
                          )}
                          <span className="task-time">{bloco.horario}</span>
                          <span className="task-name">{bloco.tarefa}</span>
                        </div>

                        {editMode && (
                          <button
                            className="btn-trash-item"
                            onClick={() => handleDeleteTask(sIdx, bIdx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}