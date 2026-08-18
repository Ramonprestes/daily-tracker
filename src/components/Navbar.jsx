import React from "react";
import {
  Calendar,
  Grid,
  BarChart2,
  Bell,
  BellOff,
  Download,
  LogOut,
  Clock,
} from "lucide-react";

export default function Navbar({
  currentUser,
  currentView = "daily",
  setCurrentView = () => {},
  editMode = false,
  setEditMode = () => {},
  notificationsEnabled = false,
  onRequestNotification = () => {},
  onExportPDF = () => {},
  onLogout = () => {},
}) {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="logo-title">Daily Tracker</h1>
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${currentView === "daily" ? "active" : ""}`}
            onClick={() => setCurrentView("daily")}
          >
            <Clock size={16} /> Diário
          </button>
          <button
            className={`nav-tab ${currentView === "weekly" ? "active" : ""}`}
            onClick={() => setCurrentView("weekly")}
          >
            <Calendar size={16} /> Semanal
          </button>
          <button
            className={`nav-tab ${currentView === "monthly" ? "active" : ""}`}
            onClick={() => setCurrentView("monthly")}
          >
            <Grid size={16} /> Mensal
          </button>
          <button
            className={`nav-tab ${currentView === "stats" ? "active" : ""}`}
            onClick={() => setCurrentView("stats")}
          >
            <BarChart2 size={16} /> Estatísticas
          </button>
        </nav>
      </div>

      <div className="header-right">
        {/* Notificações */}
        <button
          className={`btn-icon-nav ${notificationsEnabled ? "active-bell" : ""}`}
          onClick={onRequestNotification}
          title={
            notificationsEnabled
              ? "Notificações ativadas"
              : "Ativar notificações de rotina"
          }
        >
          {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
        </button>

        {/* Exportar PDF */}
        <button
          className="btn-icon-nav"
          onClick={onExportPDF}
          title="Exportar PDF do dia"
        >
          <Download size={18} />
        </button>

        {/* Perfil & Logout */}
        <div className="user-profile">
          <span className="user-email" title={currentUser?.email}>
            {currentUser?.email?.split("@")[0]}
          </span>
          <button
            className="btn-logout"
            onClick={onLogout}
            title="Sair da conta"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
