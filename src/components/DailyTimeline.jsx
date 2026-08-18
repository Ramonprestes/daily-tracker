import React, { useState, useEffect } from "react";
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
  XCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  getLocalDateString,
  resolveDayTasksWithOverrides,
  getCurrentTimeStr,
  getTaskDelayInfo,
} from "../utils/dateUtils";
import TaskModal from "./TaskModal";

export default function DailyTimeline({
  selectedDate = getLocalDateString(new Date()),
  setSelectedDate = () => {},
  tarefas = [],
  tarefasStatusMap = {},
  onSetTaskStatus = () => {},
  onAddTask = () => {},
  onEditTask = () => {},
  onDeleteTask = () => {},
  loading = false,
}) {
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEditTaskModal = (task, e) => {
    if (e) e.stopPropagation();
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

  const safeTasks = Array.isArray(tarefas) ? tarefas : [];
  const displayTasks = resolveDayTasksWithOverrides(safeTasks, selectedDate);

  const totalTasks = displayTasks.length;
  const doneTasks = displayTasks.filter(
    (t) => tarefasStatusMap[String(t.id)] && tarefasStatusMap[String(t.id)].status === "done"
  ).length;
  const progressPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleToggleCheck = (task, e) => {
    if (e) e.stopPropagation();
    const key = String(task.id);
    const current = tarefasStatusMap[key] ? tarefasStatusMap[key].status : null;

    if (current === "done") {
      onSetTaskStatus(key, null);
    } else {
      const recordedAt = getCurrentTimeStr();
      const delay = getTaskDelayInfo(task.horario, selectedDate);
      onSetTaskStatus(key, {
        status: "done",
        completedAt: recordedAt,
        isLate: Boolean(delay.isOverdue),
      });
    }
  };

  const handleToggleNotDone = (task, e) => {
    if (e) e.stopPropagation();
    const key = String(task.id);
    const current = tarefasStatusMap[key] ? tarefasStatusMap[key].status : null;

    if (current === "failed") {
      onSetTaskStatus(key, null);
    } else {
      onSetTaskStatus(key, {
        status: "failed",
        markedAt: getCurrentTimeStr(),
      });
    }
  };

  const getRecurrenceLabel = (task) => {
    if (task.recurrenceType === "once") return "Exclusivo hoje";
    if (task.recurrenceType === "weekdays") return "Seg-Sex";
    if (task.recurrenceType === "weekends") return "Fim de sem.";
    if (task.recurrenceType === "custom") {
      const daysMap = { 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sab", 0: "Dom" };
      return (task.selectedDays || []).map((d) => daysMap[d]).join(", ");
    }
    return "Diario";
  };

  if (loading) {
    return <p className="loading-text">Carregando rotina...</p>;
  }

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
            <button className="btn-today" onClick={() => setSelectedDate(todayStr)}>
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
        {totalTasks === 0 ? (
          <div className="empty-state">
            <p>Nenhuma tarefa programada para este dia.</p>
            <button className="btn-add-primary" onClick={openNewTaskModal}>
              <Plus size={16} /> Adicionar Tarefa
            </button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const key = String(task.id);
            const taskRecord = tarefasStatusMap[key] || {};
            const isDone = taskRecord.status === "done";
            const isFailed = taskRecord.status === "failed";
            const delayInfo = getTaskDelayInfo(task.horario, selectedDate);
            const isLateWarning = !isDone && !isFailed && delayInfo.isOverdue;
            const recLabel = getRecurrenceLabel(task);

            return (
              <div
                key={key}
                className={`task-row ${isDone ? "completed" : ""} ${isFailed ? "failed-row" : ""} ${isLateWarning ? "late-warning" : ""}`}
                onClick={(e) => handleToggleCheck(task, e)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div className="task-main">
                  <div
                    style={{ display: "flex", alignItems: "center" }}
                    onClick={(e) => handleToggleCheck(task, e)}
                  >
                    {isDone ? (
                      <CheckSquare className="task-icon checked" size={22} />
                    ) : (
                      <Square className="task-icon" size={22} />
                    )}
                  </div>

                  <span className="task-badge-time">{task.horario}</span>

                  <div className="task-details-col">
                    <span className="task-title">{task.tarefa}</span>

                    <div className="task-tags">
                      {task.duracao && (
                        <span className="task-tag duration">
                          <Clock size={11} /> {task.duracao}
                        </span>
                      )}

                      {task.recurrenceType === "once" ? (
                        <span className="task-tag override-tag">
                          <Sparkles size={11} /> Substituicao
                        </span>
                      ) : (
                        <span className="task-tag recurrence">
                          <Repeat size={11} /> {recLabel}
                        </span>
                      )}

                      {isDone && taskRecord.completedAt && (
                        <span
                          className={`task-tag ${taskRecord.isLate ? "tag-late-done" : "tag-ontime-done"}`}
                        >
                          {taskRecord.isLate
                            ? `Feito c/ atraso as ${taskRecord.completedAt}`
                            : `Feito as ${taskRecord.completedAt}`}
                        </span>
                      )}

                      {isLateWarning && (
                        <span className="task-tag tag-delayed">
                          <AlertTriangle size={11} /> +15m excedido
                        </span>
                      )}

                      {isFailed && (
                        <span className="task-tag tag-failed-badge">
                          Nao realizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-action-icon not-done ${isFailed ? "active-failed" : ""}`}
                    onClick={(e) => handleToggleNotDone(task, e)}
                    title={isFailed ? "Cancelar 'Nao Feito'" : "Marcar como Nao Feito"}
                  >
                    <XCircle size={16} />
                  </button>
                  <button
                    className="btn-action-icon edit"
                    onClick={(e) => openEditTaskModal(task, e)}
                    title="Editar Tarefa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-action-icon delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
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