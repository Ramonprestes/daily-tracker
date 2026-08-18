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
}) {
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [, setTick] = useState(0);

  // Atualiza a cada 30 segundos para recalcular tags de atraso ao vivo
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

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

  // Garante que tarefas é sempre um array seguro
  const safeTasks = Array.isArray(tarefas) ? tarefas : [];
  const safeStatusMap = tarefasStatusMap || {};

  // Aplica sobreposição inteligente das tarefas
  const displayTasks = resolveDayTasksWithOverrides ? resolveDayTasksWithOverrides(safeTasks, selectedDate) : safeTasks;

  // Cálculo de Progresso
  const totalTasks = displayTasks?.length || 0;
  const doneTasks = displayTasks.filter(
    (t) => safeStatusMap[t.id]?.status === "done"
  ).length;
  const progressPercent =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Ciclo de clique: Pendente -> Feito -> Pendente
  const handleToggleCheck = (taskId, scheduledTime) => {
    const current = safeStatusMap[taskId]?.status;
    if (current === "done") {
      onSetTaskStatus(taskId, null);
    } else {
      const recordedAt = getCurrentTimeStr();
      const delay = getTaskDelayInfo(scheduledTime, selectedDate);
      onSetTaskStatus(taskId, {
        status: "done",
        completedAt: recordedAt,
        isLate: delay.isOverdue,
      });
    }
  };

  // Marcar como "Não Feito"
  const handleToggleNotDone = (e, taskId) => {
    e.stopPropagation();
    const current = safeStatusMap[taskId]?.status;
    if (current === "failed") {
      onSetTaskStatus(taskId, null);
    } else {
      onSetTaskStatus(taskId, {
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

  return (
    <div className="daily-view">
      {/* BARRA DE CONTROLOS */}
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
              {isToday ? "Progresso de hoje" : `Progresso em ${selectedDate.slice(5).replace("-", "/")}`}
            </span>
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

      {/* TIMELINE DE TAREFAS */}
      <div className="timeline-container">
        {totalTasks === 0 ? (
          <div className="empty-state">
            <p>Nenhuma tarefa programada para este dia.</p>
            <button className="btn-action" onClick={openNewTaskModal}>
              <Plus size={16} /> Adicionar Tarefa
            </button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const taskRecord = safeStatusMap[task.id] || {};
            const isDone = taskRecord.status === "done";
            const isFailed = taskRecord.status === "failed";
            const delayInfo = getTaskDelayInfo(task.horario, selectedDate);
            const isLateWarning = !isDone && !isFailed && delayInfo.isOverdue;
            const recLabel = getRecurrenceLabel(task);

            return (
              <div
                key={task.id}
                className={`task-row ${isDone ? "completed" : ""} ${isFailed ? "failed-row" : ""} ${isLateWarning ? "late-warning" : ""}`}
              >
                {/* ÁREA PRINCIPAL DE CLIQUE */}
                <div
                  className="task-main"
                  onClick={() => handleToggleCheck(task.id, task.horario)}
                >
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

                      {task.recurrenceType === "once" ? (
                        <span className="task-tag override-tag">
                          <Sparkles size={11} /> Substituição
                        </span>
                      ) : (
                        <span className="task-tag recurrence">
                          <Repeat size={11} /> {recLabel}
                        </span>
                      )}

                      {/* TAGS AO VIVO DE HORÁRIO DE CONCLUSÃO OU ATRASO */}
                      {isDone && taskRecord.completedAt && (
                        <span
                          className={`task-tag ${taskRecord.isLate ? "tag-late-done" : "tag-ontime-done"}`}
                        >
                          {taskRecord.isLate
                            ? `Feito c/ atraso às ${taskRecord.completedAt}`
                            : `Feito às ${taskRecord.completedAt}`}
                        </span>
                      )}

                      {isLateWarning && (
                        <span className="task-tag tag-delayed">
                          <AlertTriangle size={11} /> Tolerância +15m excedida
                        </span>
                      )}

                      {isFailed && (
                        <span className="task-tag tag-failed-badge">
                          Não realizado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO: NÃO FEITO / EDITAR / ELIMINAR */}
                <div className="row-actions">
                  <button
                    className={`btn-action-icon not-done ${isFailed ? "active-failed" : ""}`}
                    onClick={(e) => handleToggleNotDone(e, task.id)}
                    title={isFailed ? "Cancelar 'Não Feito'" : "Marcar como Não Feito"}
                  >
                    <XCircle size={16} />
                  </button>
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
                    title="Eliminar Tarefa"
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
