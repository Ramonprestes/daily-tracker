import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { getLocalDateString } from "../utils/dateUtils";

export default function DailyTimeline({
  selectedDate,
  setSelectedDate,
  tipoRotina,
  setTipoRotina,
  tarefas,
  tarefasConcluidas,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
  editMode,
  setEditMode,
}) {
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  // Nova tarefa
  const [newTime, setNewTime] = useState("08:00");
  const [newTitle, setNewTitle] = useState("");

  // Edição inline
  const [editingId, setEditingId] = useState(null);
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      id: Date.now().toString(),
      horario: newTime,
      tarefa: newTitle.trim(),
    });
    setNewTitle("");
  };

  const handleStartEdit = (task) => {
    setEditingId(task.id);
    setEditTime(task.horario);
    setEditTitle(task.tarefa);
  };

  const handleSaveEdit = (id) => {
    if (!editTitle.trim()) return;
    onEditTask(id, { horario: editTime, tarefa: editTitle.trim() });
    setEditingId(null);
  };

  const currentTaskIds = new Set(tarefas.map((t) => t.id));
  const validCompleted = tarefasConcluidas.filter((id) => currentTaskIds.has(id));
  const progressPercent =
    tarefas.length > 0 ? Math.min(100, Math.round((validCompleted.length / tarefas.length) * 100)) : 0;

  return (
    <div className="daily-view">
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
              onClick={() => setSelectedDate(todayStr)}
            >
              <RotateCcw size={13} /> Hoje
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
            <span>
              {isToday ? "Progresso de hoje" : `Progresso (${selectedDate.slice(5).replace("-", "/")})`}
            </span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="editor-box">
          <h4>Adicionar Tarefa na Rotina ({tipoRotina.toUpperCase()})</h4>
          <form onSubmit={handleCreate} className="add-task-form">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="input-time"
            />
            <input
              type="text"
              placeholder="Ex: Treino, Reunião, Leitura..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input-task-name"
            />
            <button type="submit" className="btn-action">
              <Plus size={16} /> Adicionar
            </button>
          </form>
        </div>
      )}

      <div className="timeline-container">
        {tarefas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma tarefa agendada para este dia.</p>
            <button className="btn-action" onClick={() => setEditMode(true)}>
              <Plus size={16} /> Criar Tarefa
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
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="input-time-edit"
                  />
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="input-task-name-edit"
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button
                      className="btn-save-edit"
                      onClick={() => handleSaveEdit(task.id)}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className="btn-cancel-edit"
                      onClick={() => setEditingId(null)}
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
                <div className="task-main" onClick={() => onToggleTask(task.id)}>
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
                      onClick={() => handleStartEdit(task)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-action-icon delete"
                      onClick={() => onDeleteTask(task.id)}
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
    </div>
  );
}