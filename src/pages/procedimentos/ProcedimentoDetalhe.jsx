import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getOne,
  listenSubCollection,
  createSubItem,
  updateSubItem,
  deleteSubItem,
  listenCollectionWhere,
} from "@/data/dataLayer";

const TABS = ["Informações", "Checklist modelo", "Documentos necessários", "Casos vinculados"];

export default function ProcedimentoDetalhe() {
  const { user } = useAuth();
  const { id } = useParams();
  const [procedimento, setProcedimento] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [checklist, setChecklist] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [casos, setCasos] = useState([]);

  useEffect(() => {
    getOne(user.uid, "procedures", id).then(setProcedimento);
  }, [user.uid, id]);

  useEffect(() => {
    const unsub = listenSubCollection(user.uid, "procedures", id, "checklistTemplate", setChecklist);
    return unsub;
  }, [user.uid, id]);

  useEffect(() => {
    const unsub = listenSubCollection(
      user.uid,
      "procedures",
      id,
      "documentRequirements",
      setDocumentos,
      "name"
    );
    return unsub;
  }, [user.uid, id]);

  useEffect(() => {
    const unsub = listenCollectionWhere(user.uid, "cases", "procedureId", id, setCasos);
    return unsub;
  }, [user.uid, id]);

  if (!procedimento) return <p className="page">Carregando...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link to="/procedimentos" className="back-link">
            ← Procedimentos
          </Link>
          <h1>{procedimento.name}</h1>
        </div>
        <Link to={`/procedimentos/${id}/editar`} className="btn-secondary">
          Editar
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? "tab active" : "tab"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Informações" && (
        <div className="info-grid">
          <Info label="Descrição" value={procedimento.description} />
          <Info label="Objetivo" value={procedimento.purpose} />
          <Info label="Quando utilizar" value={procedimento.whenToUse} />
          <Info label="Requisitos" value={procedimento.requirements} />
          <Info label="Prazos" value={procedimento.deadlines} />
          <Info label="Custos" value={procedimento.costs} />
          <Info label="Dúvidas frequentes" value={procedimento.faq} />
          <Info label="Erros comuns" value={procedimento.commonMistakes} />
          <Info label="Dicas para próximos casos" value={procedimento.tips} />
        </div>
      )}

      {tab === "Checklist modelo" && (
        <ChecklistTemplate uid={user.uid} procedureId={id} items={checklist} />
      )}

      {tab === "Documentos necessários" && (
        <DocumentRequirements uid={user.uid} procedureId={id} items={documentos} />
      )}

      {tab === "Casos vinculados" && (
        <div className="card-list">
          {casos.length === 0 && <p className="empty-state">Nenhum caso vinculado ainda.</p>}
          {casos.map((c) => (
            <Link key={c.id} to={`/casos/${c.id}`} className="list-card">
              <div className="list-card-title">{c.title}</div>
              <div className="list-card-subtitle">{c.status}</div>
            </Link>
          ))}
        </div>
      )}
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

function ChecklistTemplate({ uid, procedureId, items }) {
  const [stepLabel, setStepLabel] = useState("");
  const [taskLabel, setTaskLabel] = useState("");

  async function addItem(e) {
    e.preventDefault();
    if (!taskLabel.trim()) return;
    await createSubItem(uid, "procedures", procedureId, "checklistTemplate", {
      stepLabel: stepLabel.trim() || "Geral",
      taskLabel: taskLabel.trim(),
      order: items.length,
    });
    setTaskLabel("");
  }

  async function removeItem(itemId) {
    await deleteSubItem(uid, "procedures", procedureId, "checklistTemplate", itemId);
  }

  const grouped = items.reduce((acc, item) => {
    const step = item.stepLabel || "Geral";
    acc[step] = acc[step] || [];
    acc[step].push(item);
    return acc;
  }, {});

  return (
    <div>
      <form className="inline-form" onSubmit={addItem}>
        <input
          placeholder="Etapa (ex: Documentos)"
          value={stepLabel}
          onChange={(e) => setStepLabel(e.target.value)}
        />
        <input
          placeholder="Tarefa"
          value={taskLabel}
          onChange={(e) => setTaskLabel(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Adicionar
        </button>
      </form>

      {Object.entries(grouped).map(([step, tasks]) => (
        <div key={step} className="checklist-group">
          <h3>{step}</h3>
          <ul className="checklist">
            {tasks.map((task) => (
              <li key={task.id}>
                <span>{task.taskLabel}</span>
                <button className="btn-link" onClick={() => removeItem(task.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {items.length === 0 && <p className="empty-state">Nenhum item no checklist modelo ainda.</p>}
    </div>
  );
}

function DocumentRequirements({ uid, procedureId, items }) {
  const [name, setName] = useState("");
  const [whereToGet, setWhereToGet] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  async function addItem(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await createSubItem(uid, "procedures", procedureId, "documentRequirements", {
      name: name.trim(),
      whereToGet: whereToGet.trim(),
      url: url.trim(),
      notes: notes.trim(),
    });
    setName("");
    setWhereToGet("");
    setUrl("");
    setNotes("");
  }

  async function removeItem(itemId) {
    await deleteSubItem(uid, "procedures", procedureId, "documentRequirements", itemId);
  }

  return (
    <div>
      <form className="form" onSubmit={addItem}>
        <label>
          Documento
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Onde conseguir
          <input value={whereToGet} onChange={(e) => setWhereToGet(e.target.value)} />
        </label>
        <label>
          Site (opcional)
          <input value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label>
          Observações
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Adicionar documento
          </button>
        </div>
      </form>

      <div className="card-list">
        {items.map((doc) => (
          <div key={doc.id} className="list-card static">
            <div className="list-card-title">{doc.name}</div>
            {doc.whereToGet && <div className="list-card-subtitle">Onde: {doc.whereToGet}</div>}
            {doc.url && (
              <a href={doc.url} target="_blank" rel="noreferrer" className="list-card-link">
                {doc.url}
              </a>
            )}
            {doc.notes && <div className="list-card-notes">{doc.notes}</div>}
            <button className="btn-link" onClick={() => removeItem(doc.id)}>
              Remover
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="empty-state">Nenhum documento cadastrado ainda.</p>}
      </div>
    </div>
  );
}
