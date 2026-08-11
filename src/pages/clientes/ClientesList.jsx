import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenCollection } from "@/data/dataLayer";

export default function ClientesList() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const unsub = listenCollection(user.uid, "clients", setClientes, "name");
    return unsub;
  }, [user.uid]);

  const filtrados = clientes.filter((c) =>
    c.name?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <Link to="/clientes/novo" className="btn-primary">
          Novo cliente
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Buscar cliente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card-list">
        {filtrados.length === 0 && <p className="empty-state">Nenhum cliente cadastrado ainda.</p>}
        {filtrados.map((c) => (
          <Link key={c.id} to={`/clientes/${c.id}`} className="list-card">
            <div className="list-card-title">{c.name}</div>
            {c.phone && <div className="list-card-subtitle">{c.phone}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
