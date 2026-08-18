import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { getLocalDateString, getWeekDays, resolveDayTasksWithOverrides } from "../utils/dateUtils";
import { getSnapshotsRange, getGeneralTasks } from "../services/plannerService";

export default function WeeklyPlanner({ currentUser, onSelectDay }) {
  const [currentDate, setCurrentDate] = useState(getLocalDateString(new Date()));
  const [weekSnapshots, setWeekSnapshots] = useState({});
  const [generalTasks, setGeneralTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = getWeekDays(currentDate);
  const startStr = days[0]?.dateStr;
  const endStr = days[6]?.dateStr;

  useEffect(() => {
    async function loadWeekData() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const [snaps, tasks] = await Promise.all([
          getSnapshotsRange(currentUser.uid, startStr, endStr),
          getGeneralTasks(currentUser.uid),
        ]);
        setWeekSnapshots(snaps || {});
        setGeneralTasks(tasks || []);
      } catch (err) {
        console.error("Erro ao carregar semana:", err);
      } finally {
        setLoading(false);
      }
    }

    loadWeekData();
  }, [currentUser, startStr, endStr]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setCurrentDate(getLocalDateString(d));
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setCurrentDate(getLocalDateString(d));
  };

  const handleToday = () => {
    setCurrentDate(getLocalDateString(new Date()));
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h2>Planejamento Semanal</h2>
        <div className="nav-controls">
          <button className="btn-nav" onClick={handlePrevWeek}>
            <ChevronLeft size={14} /> Semana Anterior
          </button>
          <button className="btn-nav" onClick={handleToday}>
            <RotateCcw size={13} /> Esta Semana
          </button>
          <button className="btn-nav" onClick={handleNextWeek}>
            Próxima Semana <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Carregando visão semanal...</p>
      ) : (
        <div className="week-grid">
          {days.map((d) => {
            const dayTasks = resolveDayTasksWithOverrides(generalTasks, d.dateStr);
            const snap = weekSnapshots[d.dateStr];
            
            let doneCount = 0;
            if (snap?.tarefasStatusMap) {
              doneCount = Object.values(snap.tarefasStatusMap).filter(s => s.status === "done").length;
            } else if (Array.isArray(snap?.tarefasConcluidas)) {
              doneCount = snap.tarefasConcluidas.length;
            }

            const totalCount = dayTasks.length;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <div
                key={d.dateStr}
                className={`day-card ${d.isToday ? "today-highlight" : ""}`}
                onClick={() => onSelectDay(d.dateStr)}
              >
                <div className="day-card-header">
                  <div>
                    <span className="day-name">{d.dayName}</span>
                    <div className="day-num">{d.dayNumber}</div>
                  </div>
                  {totalCount > 0 && <span className="day-badge">{pct}%</span>}
                </div>

                {totalCount > 0 && (
                  <div className="day-progress-bar">
                    <div className="day-progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                )}

                <div className="day-tasks-preview">
                  {dayTasks.length === 0 ? (
                    <span className="empty-day-txt">Sem rotina</span>
                  ) : (
                    dayTasks.slice(0, 3).map((t, idx) => {
                      const isDone =
                        snap?.tarefasStatusMap?.[String(t.id)]?.status === "done" ||
                        snap?.tarefasConcluidas?.includes(t.id);
                      return (
                        <div key={idx} className={`preview-task ${isDone ? "done" : ""}`}>
                          <span className="time">{t.horario}</span>
                          <span>{t.tarefa}</span>
                        </div>
                      );
                    })
                  )}
                  {dayTasks.length > 3 && (
                    <span className="more-tasks">+{dayTasks.length - 3} tarefas</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}