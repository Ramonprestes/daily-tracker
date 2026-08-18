import React, { useState, useEffect } from "react";
import { Flame, Award, CheckCircle, TrendingUp } from "lucide-react";
import { getLocalDateString } from "../utils/dateUtils";
import { getSnapshotsRange } from "../services/plannerService";

export default function PerformanceStats({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const dates = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(getLocalDateString(d));
      }

      const data = await getSnapshotsRange(currentUser.uid, dates);
      const list = dates.map((dStr) => ({
        dateStr: dStr,
        label: dStr.slice(5).replace("-", "/"),
        percent: data[dStr]?.percent || 0,
        done: data[dStr]?.tarefasFeitas || 0,
        total: data[dStr]?.totalTarefas || 0,
      }));

      setHistory(list);
      setLoading(false);
    }

    if (currentUser) loadStats();
  }, [currentUser]);

  // Cálculo de Streak (Dias seguidos com tarefas concluídas)
  const streak = history.reduceRight((acc, day) => {
    if (day.percent >= 80) return acc + 1;
    return acc;
  }, 0);

  const avgPercent = history.length > 0
    ? Math.round(history.reduce((acc, d) => acc + d.percent, 0) / history.length)
    : 0;

  return (
    <div className="stats-dashboard">
      <div className="stats-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon streak">
            <Flame size={24} />
          </div>
          <div>
            <span className="kpi-title">Sequência Atual</span>
            <h3>{streak} dias</h3>
            <span className="kpi-desc">com 80%+ de conclusão</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon avg">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="kpi-title">Média de Consistência</span>
            <h3>{avgPercent}%</h3>
            <span className="kpi-desc">nos últimos 14 dias</span>
          </div>
        </div>
      </div>

      <div className="chart-panel">
        <h3>Desempenho dos Últimos 14 Dias</h3>
        {loading ? (
          <p className="loading-text">Calculando estatísticas...</p>
        ) : (
          <div className="bar-chart-container">
            {history.map((day) => (
              <div key={day.dateStr} className="chart-bar-group">
                <span className="chart-val">{day.percent}%</span>
                <div className="chart-track">
                  <div
                    className="chart-bar-fill"
                    style={{ height: `${day.percent}%` }}
                  ></div>
                </div>
                <span className="chart-lbl">{day.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}