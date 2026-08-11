import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenCollection } from "@/data/dataLayer";

export default function CasosList() {
  const { user } = useAuth();
  const [casos, setCasos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const unsub = listenCollection(user.uid, "cases", setCasos, "createdAt");
    return unsub;
  }, [user.uid]);

  const filtrados = casos.filter((c) => c.title?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Casos</h1>
        <Link to="/casos/novo" className="btn-primary">
          Novo caso
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Buscar caso..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card-list">
        {filtrados.length === 0 && <p className="empty-state">Nenhum caso cadastrado ainda.</p>}
        {filtrados.map((c) => (
          <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
            <div className="list-card-title">{c.title}</div>
            <div className="list-card-subtitle">
              {c.status} {c.deadline ? `· prazo ${c.deadline}` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
