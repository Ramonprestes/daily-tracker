import React, { useState, useEffect } from "react";
import { Flame, TrendingUp, Award, Calendar } from "lucide-react";
import { getLocalDateString, resolveDayTasksWithOverrides } from "../utils/dateUtils";
import { getSnapshotsRange, getGeneralTasks } from "../services/plannerService";

export default function PerformanceStats({ currentUser }) {
  const [statsData, setStatsData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!currentUser?.uid) return;
      try {
        setLoading(true);

        // Pega os últimos 14 dias
        const daysArray = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          daysArray.push(getLocalDateString(d));
        }

        const startStr = daysArray[0];
        const endStr = daysArray[daysArray.length - 1];

        const [snaps, tasks] = await Promise.all([
          getSnapshotsRange(currentUser.uid, startStr, endStr),
          getGeneralTasks(currentUser.uid),
        ]);

        const history = daysArray.map((dateStr) => {
          const dayTasks = resolveDayTasksWithOverrides(tasks || [], dateStr);
          const snap = snaps ? snaps[dateStr] : null;

          let doneCount = 0;
          if (snap?.tarefasStatusMap) {
            doneCount = Object.values(snap.tarefasStatusMap).filter(
              (s) => s.status === "done"
            ).length;
          } else if (Array.isArray(snap?.tarefasConcluidas)) {
            doneCount = snap.tarefasConcluidas.length;
          }

          const total = dayTasks.length;
          const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return {
            dateStr,
            label: dateStr.slice(5).replace("-", "/"),
            percentage,
            total,
            doneCount,
          };
        });

        setStatsData(history);

        // Média dos últimos 14 dias
        const totalPct = history.reduce((acc, h) => acc + h.percentage, 0);
        setAvgScore(Math.round(totalPct / history.length));

        // Cálculo de sequência (dias com >= 80% até hoje)
        let curStreak = 0;
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].percentage >= 80) {
            curStreak++;
          } else {
            break;
          }
        }
        setStreak(curStreak);
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [currentUser]);

  if (loading) {
    return <p className="loading-text">Carregando métricas de performance...</p>;
  }

  return (
    <div className="stats-dashboard">
      {/* CARDS DE KPIS */}
      <div className="stats-cards-grid">
        <div className="kpi-card">
          <div className="kpi-icon streak">
            <Flame size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Sequência Atual</span>
            <h3>{streak} {streak === 1 ? "dia" : "dias"}</h3>
            <span className="kpi-desc">com 80%+ de conclusão diária</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon avg">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-body">
            <span className="kpi-title">Média de Consistência</span>
            <h3>{avgScore}%</h3>
            <span className="kpi-desc">nos últimos 14 dias</span>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS DOS ÚLTIMOS 14 DIAS */}
      <div className="chart-panel">
        <div className="chart-panel-header">
          <h3>
            <Calendar size={18} /> Desempenho dos Últimos 14 Dias
          </h3>
        </div>

        <div className="bar-chart-container">
          {statsData.map((item, idx) => (
            <div key={idx} className="chart-bar-group">
              <span className="chart-val">{item.percentage}%</span>
              <div className="chart-track">
                <div
                  className="chart-bar-fill"
                  style={{ height: `${Math.max(item.percentage, 4)}%` }}
                ></div>
              </div>
              <span className="chart-lbl">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}