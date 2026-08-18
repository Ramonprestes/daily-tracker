import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthDays, getLocalDateString } from "../utils/dateUtils";
import { getSnapshotsRange } from "../services/plannerService";

export default function MonthlyPlanner({ currentUser, onSelectDay }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [days, setDays] = useState([]);
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  useEffect(() => {
    const monthDays = getMonthDays(year, month);
    setDays(monthDays);

    async function loadMonth() {
      setLoading(true);
      const validDates = monthDays.filter(Boolean).map((d) => d.dateStr);
      const data = await getSnapshotsRange(currentUser.uid, validDates);
      setMonthData(data);
      setLoading(false);
    }

    if (currentUser) loadMonth();
  }, [year, month, currentUser]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h3>
          {monthNames[month]} de {year}
        </h3>
        <div className="nav-controls">
          <button className="btn-nav" onClick={handlePrevMonth}>
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn-nav"
            onClick={() => {
              setYear(today.getFullYear());
              setMonth(today.getMonth());
            }}
          >
            Mês Atual
          </button>
          <button className="btn-nav" onClick={handleNextMonth}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Carregando calendário mensal...</p>
      ) : (
        <div className="month-calendar">
          <div className="calendar-weekdays">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="calendar-grid">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="cal-cell empty"></div>;
              }

              const data = monthData[day.dateStr];
              const percent = data?.percent ?? 0;
              let heatColor = "heat-0";

              if (data && data.totalTarefas > 0) {
                if (percent === 100) heatColor = "heat-100";
                else if (percent >= 60) heatColor = "heat-75";
                else if (percent >= 25) heatColor = "heat-50";
                else heatColor = "heat-25";
              }

              return (
                <div
                  key={day.dateStr}
                  className={`cal-cell ${heatColor} ${day.isToday ? "today-cell" : ""}`}
                  onClick={() => onSelectDay(day.dateStr)}
                  title={`${day.dateStr}: ${percent}% concluído`}
                >
                  <span className="cal-day-num">{day.dayNumber}</span>
                  {data && data.totalTarefas > 0 && (
                    <span className="cal-percent">{percent}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}