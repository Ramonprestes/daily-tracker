import React from "react";
import {
  Calendar,
  Clock,
  CalendarDays,
  BarChart2,
  Bell,
  BellOff,
  FileDown,
  LogOut,
  Sliders,
} from "lucide-react";

export default function Navbar({
  currentUser,
  currentView,
  setCurrentView,
  editMode,
  setEditMode,
  notificationsEnabled,
  onRequestNotification,
  onExportPDF,
  onLogout,
}) {
  return (
    <header className="navbar">
      <div className="brand">
        <h2>Daily Tracker</h2>
        <span className="user-email">{currentUser?.email}</span>
      </div>

      <div className="view-switcher">
        <button
          className={`btn-view ${currentView === "daily" ? "active" : ""}`}
          onClick={() => setCurrentView("daily")}
        >
          <Clock size={15} /> Dia
        </button>
        <button
          className={`btn-view ${currentView === "weekly" ? "active" : ""}`}
          onClick={() => setCurrentView("weekly")}
        >
          <CalendarDays size={15} /> Semana
        </button>
        <button
          className={`btn-view ${currentView === "monthly" ? "active" : ""}`}
          onClick={() => setCurrentView("monthly")}
        >
          <Calendar size={15} /> Mês
        </button>
        <button
          className={`btn-view ${currentView === "stats" ? "active" : ""}`}
          onClick={() => setCurrentView("stats")}
        >
          <BarChart2 size={15} /> Gráficos
        </button>
      </div>

      <div className="navbar-actions">
        <button
          className={`btn-secondary ${notificationsEnabled ? "active-bell" : ""}`}
          onClick={onRequestNotification}
          title={notificationsEnabled ? "Lembretes Ativos" : "Ativar Lembretes"}
        >
          {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
        <button className="btn-secondary" onClick={onExportPDF} title="Exportar PDF do Dia">
          <FileDown size={16} />
        </button>
        {currentView === "daily" && (
          <button
            className={`btn-secondary ${editMode ? "active" : ""}`}
            onClick={() => setEditMode(!editMode)}
          >
            <Sliders size={16} /> {editMode ? "Fechar" : "Editar"}
          </button>
        )}
        <button onClick={onLogout} className="btn-logout" title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}