import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOne, listenCollectionWhere } from "@/data/dataLayer";
import DocumentsPanel from "../../components/DocumentsPanel";
import NotesPanel from "../../components/NotesPanel";
import HistoryPanel from "../../components/HistoryPanel";

const TABS = ["Informações", "Casos", "Documentos", "Anotações", "Histórico"];

export default function ClienteDetalhe() {
  const { user } = useAuth();
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [casos, setCasos] = useState([]);

  useEffect(() => {
    getOne(user.uid, "clients", id).then(setCliente);
  }, [user.uid, id]);

  useEffect(() => {
    const unsub = listenCollectionWhere(user.uid, "cases", "clientId", id, setCasos);
    return unsub;
  }, [user.uid, id]);

  if (!cliente) return <p className="page">Carregando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/clientes" className="back-link">
            ← Clientes
          </Link>
          <h1>{cliente.name}</h1>
        </div>
        <Link to={`/clientes/${id}/editar`} className="btn-secondary">
          Editar
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Informações" && (
        <div className="info-grid">
          <Info label="CPF/CNPJ" value={cliente.docNumber} />
          <Info label="Telefone" value={cliente.phone} />
          <Info label="WhatsApp" value={cliente.whatsapp} />
          <Info label="E-mail" value={cliente.email} />
          <Info label="Endereço" value={cliente.address} />
          <Info label="Profissão" value={cliente.profession} />
          <Info label="Data de nascimento" value={cliente.birthDate} />
          <Info label="Estado civil" value={cliente.maritalStatus} />
          <Info label="Observações" value={cliente.notes} />
        </div>
      )}

      {tab === "Casos" && (
        <div>
          <div className="page-header compact">
            <Link to={`/casos/novo?clienteId=${id}`} className="btn-primary">
              Novo caso
            </Link>
          </div>
          <div className="card-list">
            {casos.length === 0 && <p className="empty-state">Nenhum caso cadastrado ainda.</p>}
            {casos.map((c) => (
              <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
                <div className="list-card-title">{c.title}</div>
                <div className="list-card-subtitle">{c.status}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "Documentos" && <DocumentsPanel parentPath="clients" parentId={id} />}
      {tab === "Anotações" && <NotesPanel parentPath="clients" parentId={id} />}
      {tab === "Histórico" && <HistoryPanel parentPath="clients" parentId={id} />}
    </div>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <div className="info-block">
      <div className="info-label">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  );
}
