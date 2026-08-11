import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOne, updateItem } from "@/data/dataLayer";
import CaseChecklist from "../../components/CaseChecklist";
import DocumentsPanel from "../../components/DocumentsPanel";
import NotesPanel from "../../components/NotesPanel";
import HistoryPanel from "../../components/HistoryPanel";
import LessonsPanel from "../../components/LessonsPanel";

const TABS = ["Checklist", "Documentos", "Anotações", "Histórico", "Lições aprendidas"];
const STATUS_OPTIONS = ["Em andamento", "Aguardando cliente", "Aguardando cartório/órgão", "Concluído"];

export default function CasoDetalhe() {
  const { user } = useAuth();
  const { id } = useParams();
  const [caso, setCaso] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [procedimento, setProcedimento] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [progresso, setProgresso] = useState({ done: 0, total: 0 });

  useEffect(() => {
    getOne(user.uid, "cases", id).then(setCaso);
  }, [user.uid, id]);

  useEffect(() => {
    if (!caso) return;
    getOne(user.uid, "clients", caso.clientId).then(setCliente);
    getOne(user.uid, "procedures", caso.procedureId).then(setProcedimento);
  }, [user.uid, caso]);

  const handleProgressChange = useCallback((p) => setProgresso(p), []);

  async function handleStatusChange(e) {
    const status = e.target.value;
    setCaso((prev) => ({ ...prev, status }));
    await updateItem(user.uid, "cases", id, { status });
  }

  async function handleNextActionBlur(e) {
    const nextAction = e.target.value;
    await updateItem(user.uid, "cases", id, { nextAction });
  }

  async function handleDeadlineChange(e) {
    const deadline = e.target.value;
    setCaso((prev) => ({ ...prev, deadline }));
    await updateItem(user.uid, "cases", id, { deadline });
  }

  if (!caso) return <p className="page">Carregando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/casos" className="back-link">
            ← Casos
          </Link>
          <h1>{caso.title}</h1>
          {cliente && <p className="page-subtitle">Cliente: {cliente.name}</p>}
        </div>
        {procedimento && (
          <Link to={`/procedimentos/${procedimento.id}`} className="btn-secondary">
            Consultar procedimento-base
          </Link>
        )}
      </div>

      <div className="case-summary">
        <label>
          Status
          <select value={caso.status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prazo
          <input type="date" value={caso.deadline || ""} onChange={handleDeadlineChange} />
        </label>
        <label className="grow">
          Próxima ação
          <input defaultValue={caso.nextAction} onBlur={handleNextActionBlur} />
        </label>
        <div className="progress-info">
          Checklist: {progresso.done}/{progresso.total}
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${progresso.total ? (progresso.done / progresso.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? "tab active" : "tab"} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Checklist" && (
        <CaseChecklist caseId={id} onProgressChange={handleProgressChange} />
      )}
      {tab === "Documentos" && <DocumentsPanel parentPath="cases" parentId={id} />}
      {tab === "Anotações" && <NotesPanel parentPath="cases" parentId={id} />}
      {tab === "Histórico" && <HistoryPanel parentPath="cases" parentId={id} />}
      {tab === "Lições aprendidas" && (
        <LessonsPanel caseId={id} procedureId={caso.procedureId} />
      )}
    </div>
  );
}
