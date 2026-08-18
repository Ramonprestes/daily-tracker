import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login", "signup", "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup, resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "signup") {
        await signup(email, password);
      } else if (mode === "reset") {
        await resetPassword(email);
        setMessage("Verifique a sua caixa de entrada para redefinir a senha.");
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Tente entrar.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Erro: " + (err.message || "Tente novamente."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Daily Tracker</h2>
        <p className="auth-subtitle">
          {mode === "login" && "Acesse sua rotina diária"}
          {mode === "signup" && "Crie sua conta para começar"}
          {mode === "reset" && "Recupere o acesso à sua conta"}
        </p>

        {error && <div className="error-box">{error}</div>}
        {message && <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#34d399", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== "reset" && (
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: "-6px" }}>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: "12px", color: "#94a3b8" }}
                onClick={() => { setMode("reset"); setError(""); setMessage(""); }}
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? "Processando..."
              : mode === "login"
              ? "Entrar"
              : mode === "signup"
              ? "Cadastrar"
              : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === "login" && (
            <>
              <span>Não tem uma conta?</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
              >
                Cadastre-se
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <span>Já possui uma conta?</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              >
                Entrar
              </button>
            </>
          )}

          {mode === "reset" && (
            <button
              type="button"
              className="btn-link"
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
            >
              Voltar para o Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}