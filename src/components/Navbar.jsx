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
  notificationsEnabled = false,
  onRequestNotification = () => {},
  onExportPDF = () => {},
  onLogout = () => {},
}) {
  return (
    <header className="floating-navbar">
      {/* BRAND & LOGOTIPO VETORIAL */}
      <div className="brand-wrapper" onClick={() => setCurrentView("daily")}>
        <svg className="brand-logo-svg" viewBox="0 0 36 36" fill="none">
          <defs>
            <linearGradient id="brandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="36" height="36" rx="10" fill="url(#brandGrad)" />
          <path
            d="M10 18.5L15.5 24L26 12.5"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="brand-text">
          Daily<strong>Tracker</strong>
        </span>
      </div>

      {/* ABAS CENTRAIS */}
      <nav className="nav-pills">
        <button
          className={`nav-pill ${currentView === "daily" ? "active" : ""}`}
          onClick={() => setCurrentView("daily")}
        >
          <Clock size={15} /> Diário
        </button>
        <button
          className={`nav-pill ${currentView === "weekly" ? "active" : ""}`}
          onClick={() => setCurrentView("weekly")}
        >
          <Calendar size={15} /> Semanal
        </button>
        <button
          className={`nav-pill ${currentView === "monthly" ? "active" : ""}`}
          onClick={() => setCurrentView("monthly")}
        >
          <Grid size={15} /> Mensal
        </button>
        <button
          className={`nav-pill ${currentView === "stats" ? "active" : ""}`}
          onClick={() => setCurrentView("stats")}
        >
          <BarChart2 size={15} /> Estatísticas
        </button>
      </nav>

      {/* AÇÕES FLUTUANTES DA DIREITA */}
      <div className="navbar-actions">
        <button
          className={`btn-icon-floating ${notificationsEnabled ? "active-bell" : ""}`}
          onClick={onRequestNotification}
          title={notificationsEnabled ? "Notificações ativas" : "Ativar notificações"}
        >
          {notificationsEnabled ? <Bell size={17} /> : <BellOff size={17} />}
        </button>

        <button
          className="btn-icon-floating"
          onClick={onExportPDF}
          title="Exportar PDF do dia"
        >
          <Download size={17} />
        </button>

        <div className="user-badge">
          <span className="user-email-tag" title={currentUser?.email}>
            {currentUser?.email?.split("@")[0]}
          </span>
          <button
            className="btn-logout-floating"
            onClick={onLogout}
            title="Sair da conta"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}