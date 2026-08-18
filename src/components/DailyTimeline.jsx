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
  const doneTasks = displayTasks.filter((t) => {
    const key = String(t.id || `${t.horario}_${t.tarefa}`);
    return tarefasStatusMap[key]?.status === "done";
  }).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const handleToggleCheck = (task) => {
    const key = String(task.id || `${task.horario}_${task.tarefa}`);
    const currentStatus = tarefasStatusMap[key]?.status;

    if (currentStatus === "done") {
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
    const key = String(task.id || `${task.horario}_${task.tarefa}`);
    const currentStatus = tarefasStatusMap[key]?.status;

    if (currentStatus === "failed") {
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
      const daysMap = { 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 0: "Dom" };
      return (task.selectedDays || []).map((d) => daysMap[d]).join(", ");
    }
    return "Diário";
  };

  if (loading) {
    return <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>Carregando rotina...</p>;
  }

  return (
    <div className="daily-view">
      {/* CONTROLES FLUTUANTES */}
      <div className="controls-bar-floating">
        <div className="date-selector-floating">
          <Calendar size={17} color="var(--brand-cyan)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {!isToday && (
            <button className="btn-today-pill" onClick={() => setSelectedDate(todayStr)}>
              <RotateCcw size={12} /> Hoje
            </button>
          )}
        </div>

        <button className="btn-create-task-floating" onClick={openNewTaskModal}>
          <Plus size={18} /> Nova Tarefa
        </button>

        <div className="progress-card-floating">
          <div className="progress-header-row">
            <span>{isToday ? "Progresso de hoje" : `Progresso (${selectedDate.slice(5).replace("-", "/")})`}</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-track-bg">
            <div className="progress-fill-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* CARDS FLUTUANTES DA TIMELINE */}
      <div className="timeline-floating-container">
        {totalTasks === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "48px 20px",
            background: "var(--surface-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border-subtle)",
            color: "var(--text-muted)"
          }}>
            <p style={{ marginBottom: "14px" }}>Nenhuma tarefa programada para este dia.</p>
            <button className="btn-create-task-floating" style={{ margin: "0 auto" }} onClick={openNewTaskModal}>
              <Plus size={16} /> Adicionar Primeira Tarefa
            </button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const key = String(task.id || `${task.horario}_${task.tarefa}`);
            const taskRecord = tarefasStatusMap[key] || {};
            const isDone = taskRecord.status === "done";
            const isFailed = taskRecord.status === "failed";
            const delayInfo = getTaskDelayInfo(task.horario, selectedDate);
            const isLateWarning = !isDone && !isFailed && delayInfo.isOverdue;
            const recLabel = getRecurrenceLabel(task);

            return (
              <div
                key={key}
                className={`task-card-floating ${isDone ? "completed" : ""} ${isFailed ? "failed-row" : ""} ${isLateWarning ? "late-warning" : ""}`}
                onClick={() => handleToggleCheck(task)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <div className="task-main-floating">
                  <div style={{ display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    {isDone ? (
                      <CheckSquare className="task-icon checked" size={24} color="#38bdf8" />
                    ) : (
                      <Square className="task-icon" size={24} color="#64748b" />
                    )}
                  </div>

                  <span className="task-time-pill">{task.horario}</span>

                  <div className="task-info-block">
                    <span className="task-name">{task.tarefa}</span>

                    <div className="task-badges-row">
                      {task.duracao && (
                        <span className="badge-tag duration">
                          <Clock size={11} /> {task.duracao}
                        </span>
                      )}

                      {task.recurrenceType === "once" ? (
                        <span className="badge-tag override-tag">
                          <Sparkles size={11} /> Substituição
                        </span>
                      ) : (
                        <span className="badge-tag recurrence">
                          <Repeat size={11} /> {recLabel}
                        </span>
                      )}

                      {isDone && taskRecord.completedAt && (
                        <span className={`badge-tag ${taskRecord.isLate ? "tag-late-done" : "tag-ontime-done"}`}>
                          {taskRecord.isLate
                            ? `Feito c/ atraso às ${taskRecord.completedAt}`
                            : `Feito às ${taskRecord.completedAt}`}
                        </span>
                      )}

                      {isLateWarning && (
                        <span className="badge-tag tag-delayed">
                          <AlertTriangle size={11} /> +15m excedido
                        </span>
                      )}

                      {isFailed && (
                        <span className="badge-tag tag-failed">
                          Não realizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-actions-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`btn-card-action not-done ${isFailed ? "active-failed" : ""}`}
                    onClick={(e) => handleToggleNotDone(task, e)}
                    title={isFailed ? "Cancelar 'Não Feito'" : "Marcar como Não Feito"}
                  >
                    <XCircle size={16} />
                  </button>
                  <button
                    className="btn-card-action edit"
                    onClick={(e) => openEditTaskModal(task, e)}
                    title="Editar Tarefa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-card-action delete"
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