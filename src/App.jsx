import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function MainApp() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1120",
        color: "#38bdf8",
        fontSize: "16px",
        fontWeight: "600"
      }}>
        Carregando Daily Tracker...
      </div>
    );
  }

  return currentUser ? <Dashboard /> : <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
