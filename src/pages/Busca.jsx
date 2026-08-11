import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllOnce } from "@/data/dataLayer";

export default function Busca() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const termoInicial = searchParams.get("q") || "";
  const [termo, setTermo] = useState(termoInicial);
  const [clientes, setClientes] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [casos, setCasos] = useState([]);

  useEffect(() => {
    getAllOnce(user.uid, "clients", "name").then(setClientes);
    getAllOnce(user.uid, "procedures", "name").then(setProcedimentos);
    getAllOnce(user.uid, "cases", "createdAt").then(setCasos);
  }, [user.uid]);

  function handleSubmit(e) {
    e.preventDefault();
    setSearchParams({ q: termo });
  }

  const q = termo.toLowerCase();
  const clientesFiltrados = q ? clientes.filter((c) => c.name?.toLowerCase().includes(q)) : [];
  const procedimentosFiltrados = q
    ? procedimentos.filter((p) => p.name?.toLowerCase().includes(q))
    : [];
  const casosFiltrados = q ? casos.filter((c) => c.title?.toLowerCase().includes(q)) : [];

  return (
    <div className="page">
      <h1>Busca</h1>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          placeholder="Buscar clientes, casos, procedimentos..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {q && (
        <>
          <h2>Clientes</h2>
          <div className="card-list">
            {clientesFiltrados.length === 0 && <p className="empty-state">Nenhum resultado.</p>}
            {clientesFiltrados.map((c) => (
              <Link key={c.id} to={`/clientes/${c.id}`} className="list-card">
                <div className="list-card-title">{c.name}</div>
              </Link>
            ))}
          </div>

          <h2>Procedimentos</h2>
          <div className="card-list">
            {procedimentosFiltrados.length === 0 && <p className="empty-state">Nenhum resultado.</p>}
            {procedimentosFiltrados.map((p) => (
              <Link key={p.id} to={`/procedimentos/${p.id}`} className="list-card">
                <div className="list-card-title">{p.name}</div>
              </Link>
            ))}
          </div>

          <h2>Casos</h2>
          <div className="card-list">
            {casosFiltrados.length === 0 && <p className="empty-state">Nenhum resultado.</p>}
            {casosFiltrados.map((c) => (
              <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
                <div className="list-card-title">{c.title}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
