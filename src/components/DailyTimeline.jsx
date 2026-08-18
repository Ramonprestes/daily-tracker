import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  RotateCcw,
  Clock,
  Repeat,
} from "lucide-react";
import { getLocalDateString, shouldTaskOccurOnDate } from "../utils/dateUtils";
import TaskModal from "./TaskModal";

export default function DailyTimeline({
  selectedDate,
  setSelectedDate,
  tarefas,
  tarefasConcluidas,
  onToggleTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) {
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  // Estado do Modal de Tarefa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveModal = (taskData) => {
    if (editingTask) {
      onEditTask(taskData.id, taskData);
    } else {
      onAddTask(taskData);
    }
  };

  // Filtra tarefas que realmente devem aparecer no dia selecionado
  const filteredTasks = tarefas.filter((t) => shouldTaskOccurOnDate(t, selectedDate));

  const currentTaskIds = new Set(filteredTasks.map((t) => t.id));
  const validCompleted = tarefasConcluidas.filter((id) => currentTaskIds.has(id));
  const progressPercent =
    filteredTasks.length > 0
      ? Math.min(100, Math.round((validCompleted.length / filteredTasks.length) * 100))
      : 0;

  const getRecurrenceLabel = (task) => {
    if (task.recurrenceType === "once") return "Apenas hoje";
    if (task.recurrenceType === "weekdays") return "Seg-Sex";
    if (task.recurrenceType === "weekends") return "Fim de sem.";
    if (task.recurrenceType === "custom") {
      const daysMap = { 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 0: "Dom" };
      return (task.selectedDays || []).map((d) => daysMap[d]).join(", ");
    }
    return "Diário";
  };

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

        <button className="btn-add-primary" onClick={openNewTaskModal}>
          <Plus size={18} /> Nova Tarefa
        </button>

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

      <div className="timeline-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma tarefa programada para este dia.</p>
            <button className="btn-action" onClick={openNewTaskModal}>
              <Plus size={16} /> Adicionar Tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = tarefasConcluidas.includes(task.id);
            const recLabel = getRecurrenceLabel(task);

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
                  <div className="task-details-col">
                    <span className="task-title">{task.tarefa}</span>
                    <div className="task-tags">
                      {task.duracao && (
                        <span className="task-tag duration">
                          <Clock size={11} /> {task.duracao}
                        </span>
                      )}
                      <span className="task-tag recurrence">
                        <Repeat size={11} /> {recLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row-actions">
                  <button
                    className="btn-action-icon edit"
                    onClick={() => openEditTaskModal(task)}
                    title="Editar Tarefa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-action-icon delete"
                    onClick={() => onDeleteTask(task.id)}
                    title="Excluir Tarefa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        editingTask={editingTask}
        initialDate={selectedDate}
      />
    </div>
  );
}