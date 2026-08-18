import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { getWeekDays, getLocalDateString } from "../utils/dateUtils";
import { getSnapshotsRange } from "../services/plannerService";

export default function WeeklyPlanner({ currentUser, onSelectDay }) {
  const [baseDate, setBaseDate] = useState(getLocalDateString(new Date()));
  const [weekDays, setWeekDays] = useState([]);
  const [weekData, setWeekData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = getWeekDays(baseDate);
    setWeekDays(days);

    async function loadWeek() {
      setLoading(true);
      const dates = days.map((d) => d.dateStr);
      const data = await getSnapshotsRange(currentUser.uid, dates);
      setWeekData(data);
      setLoading(false);
    }

    if (currentUser) loadWeek();
  }, [baseDate, currentUser]);

  const changeWeek = (offsetDays) => {
    const current = new Date(baseDate + "T00:00:00");
    current.setDate(current.getDate() + offsetDays);
    setBaseDate(getLocalDateString(current));
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h3>Planejamento Semanal</h3>
        <div className="nav-controls">
          <button className="btn-nav" onClick={() => changeWeek(-7)}>
            <ChevronLeft size={18} /> Semana Anterior
          </button>
          <button className="btn-nav" onClick={() => setBaseDate(getLocalDateString(new Date()))}>
            Esta Semana
          </button>
          <button className="btn-nav" onClick={() => changeWeek(7)}>
            Próxima Semana <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Carregando dados da semana...</p>
      ) : (
        <div className="week-grid">
          {weekDays.map((day) => {
            const dayInfo = weekData[day.dateStr];
            const percent = dayInfo?.percent ?? 0;
            const tarefas = dayInfo?.tarefas || [];
            const concluidas = dayInfo?.tarefasConcluidas || [];

            return (
              <div
                key={day.dateStr}
                className={`day-card ${day.isToday ? "today-highlight" : ""}`}
                onClick={() => onSelectDay(day.dateStr)}
              >
                <div className="day-card-header">
                  <div>
                    <strong className="day-name">{day.dayName}</strong>
                    <span className="day-num">{day.dayNumber}</span>
                  </div>
                  <span className="day-badge">{percent}%</span>
                </div>

                <div className="day-progress-bar">
                  <div
                    className="day-progress-fill"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="day-tasks-preview">
                  {tarefas.length === 0 ? (
                    <span className="empty-day-txt">Sem registros</span>
                  ) : (
                    tarefas.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className={`preview-task ${concluidas.includes(t.id) ? "done" : ""}`}
                      >
                        <span className="time">{t.horario}</span>
                        <span className="name">{t.tarefa}</span>
                      </div>
                    ))
                  )}
                  {tarefas.length > 4 && (
                    <span className="more-tasks">+{tarefas.length - 4} tarefas</span>
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