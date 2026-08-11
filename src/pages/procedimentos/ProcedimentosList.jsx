import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenCollection } from "@/data/dataLayer";

export default function ProcedimentosList() {
  const { user } = useAuth();
  const [procedimentos, setProcedimentos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const unsubscribe = listenCollection(user.uid, "procedures", setProcedimentos, "name");
    return unsubscribe;
  }, [user.uid]);

  const filtrados = procedimentos.filter((p) =>
    p.name?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Procedimentos</h1>
        <Link to="/procedimentos/novo" className="btn-primary">
          Novo procedimento
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Buscar procedimento..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card-list">
        {filtrados.length === 0 && (
          <p className="empty-state">Nenhum procedimento cadastrado ainda.</p>
        )}
        {filtrados.map((p) => (
          <Link key={p.id} to={`/procedimentos/${p.id}`} className="list-card">
            <div className="list-card-title">{p.name}</div>
            {p.purpose && <div className="list-card-subtitle">{p.purpose}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
