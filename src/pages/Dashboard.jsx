import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenCollection } from "@/data/dataLayer";
import AnimatedNumber from "../components/AnimatedNumber";

export default function Dashboard() {
  const { user } = useAuth();
  const [casos, setCasos] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const unsub = listenCollection(user.uid, "cases", setCasos, "createdAt");
    return unsub;
  }, [user.uid]);

  useEffect(() => {
    const unsub = listenCollection(user.uid, "clients", setClientes, "createdAt");
    return unsub;
  }, [user.uid]);

  const casosAtivos = casos.filter((c) => c.status !== "Concluído");
  const comPrazo = casosAtivos
    .filter((c) => c.deadline)
    .slice()
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <div className="page">
      <h1>Painel</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-title">Casos ativos</div>
          <div className="dashboard-card-number">
            <AnimatedNumber value={casosAtivos.length} />
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title">Clientes cadastrados</div>
          <div className="dashboard-card-number">
            <AnimatedNumber value={clientes.length} />
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title">Casos com prazo definido</div>
          <div className="dashboard-card-number">
            <AnimatedNumber value={comPrazo.length} />
          </div>
        </div>
      </div>

      <h2>Próximos prazos</h2>
      <div className="card-list">
        {comPrazo.length === 0 && <p className="empty-state">Nenhum prazo definido no momento.</p>}
        {comPrazo.slice(0, 8).map((c) => (
          <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
            <div className="list-card-title">{c.title}</div>
            <div className="list-card-subtitle">Prazo: {c.deadline}</div>
          </Link>
        ))}
      </div>

      <h2>Casos ativos recentes</h2>
      <div className="card-list">
        {casosAtivos.length === 0 && <p className="empty-state">Nenhum caso ativo no momento.</p>}
        {casosAtivos.slice(0, 8).map((c) => (
          <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
            <div className="list-card-title">{c.title}</div>
            <div className="list-card-subtitle">
              {c.status} {c.nextAction ? `· Próxima ação: ${c.nextAction}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
