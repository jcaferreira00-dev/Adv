import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ferramentasAbertas, setFerramentasAbertas] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Não foi possível entrar. Verifique o e-mail e a senha.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    loginDemo();
    navigate("/");
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <form className="auth-card fade-in-up" onSubmit={handleSubmit}>
        <div className="auth-logo">GJ</div>
        <h1>Entrar</h1>
        {error && <p className="form-error">{error}</p>}
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="auth-switch">
          Ainda não tem conta? <Link to="/registrar">Criar conta</Link>
        </p>

        <div className="tools-drawer">
          <button
            type="button"
            className="tools-toggle"
            onClick={() => setFerramentasAbertas((v) => !v)}
          >
            <span className="tools-icon" aria-hidden="true" />
            Ferramentas
          </button>
          {ferramentasAbertas && (
            <div className="tools-panel fade-in-up">
              <p>
                Use o modo de teste para navegar pelo sistema com dados guardados
                apenas neste navegador, sem depender do Firebase estar configurado.
              </p>
              <button type="button" className="btn-secondary btn-block" onClick={handleDemoLogin}>
                Entrar em modo de teste
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
