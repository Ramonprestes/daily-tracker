import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Erro ao autenticar: " + (err.message || "Tente novamente."));
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
          {isLogin ? "Acesse sua rotina diária" : "Crie sua conta para começar"}
        </p>

        {error && <div className="error-box">{error}</div>}

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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <div className="auth-toggle">
          <span>
            {isLogin ? "Não tem uma conta?" : "Já possui uma conta?"}
          </span>
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Cadastre-se" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
