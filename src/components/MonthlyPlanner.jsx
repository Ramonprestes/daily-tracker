import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { getLocalDateString, getMonthDays, resolveDayTasksWithOverrides } from "../utils/dateUtils";
import { getSnapshotsRange, getGeneralTasks } from "../services/plannerService";

export default function MonthlyPlanner({ currentUser, onSelectDay }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [snapshots, setSnapshots] = useState({});
  const [generalTasks, setGeneralTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthDays = getMonthDays(year, month);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  useEffect(() => {
    async function loadMonthData() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);
        const startStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endStr = `${year}-${String(month + 1).padStart(2, "0")}-31`;

        const [snaps, tasks] = await Promise.all([
          getSnapshotsRange(currentUser.uid, startStr, endStr),
          getGeneralTasks(currentUser.uid),
        ]);
        setSnapshots(snaps || {});
        setGeneralTasks(tasks || []);
      } catch (err) {
        console.error("Erro ao carregar mês:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMonthData();
  }, [currentUser, year, month]);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const handleCurrentMonth = () => setViewDate(new Date());

  const getHeatClass = (pct) => {
    if (pct === 0) return "heat-0";
    if (pct <= 25) return "heat-25";
    if (pct <= 50) return "heat-50";
    if (pct <= 75) return "heat-75";
    return "heat-100";
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h2>{monthNames[month]} de {year}</h2>
        <div className="nav-controls">
          <button className="btn-nav" onClick={handlePrevMonth}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn-nav" onClick={handleCurrentMonth}>
            <RotateCcw size={13} /> Mês Atual
          </button>
          <button className="btn-nav" onClick={handleNextMonth}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Carregando calendário...</p>
      ) : (
        <div className="month-calendar">
          <div className="calendar-weekdays">
            {weekdays.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {monthDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="cal-cell empty"></div>;
              }

              const dayTasks = resolveDayTasksWithOverrides(generalTasks, cell.dateStr);
              const snap = snapshots[cell.dateStr];

              let doneCount = 0;
              if (snap?.tarefasStatusMap) {
                doneCount = Object.values(snap.tarefasStatusMap).filter(s => s.status === "done").length;
              } else if (Array.isArray(snap?.tarefasConcluidas)) {
                doneCount = snap.tarefasConcluidas.length;
              }

              const totalCount = dayTasks.length;
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
              const heatClass = totalCount > 0 ? getHeatClass(pct) : "heat-0";

              return (
                <div
                  key={cell.dateStr}
                  className={`cal-cell ${heatClass} ${cell.isToday ? "today-cell" : ""}`}
                  onClick={() => onSelectDay(cell.dateStr)}
                >
                  <span className="cal-day-num">{cell.dayNumber}</span>
                  {totalCount > 0 && <span className="cal-percent">{pct}%</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}