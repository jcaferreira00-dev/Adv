import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listenSubCollection,
  createSubItem,
  updateSubItem,
  deleteSubItem,
} from "@/data/dataLayer";

export default function LessonsPanel({ caseId, procedureId }) {
  const { user } = useAuth();
  const [licoes, setLicoes] = useState([]);
  const [texto, setTexto] = useState("");
  const [sugestaoChecklist, setSugestaoChecklist] = useState("");

  useEffect(() => {
    const unsub = listenSubCollection(user.uid, "cases", caseId, "lessons", setLicoes, "createdAt");
    return unsub;
  }, [user.uid, caseId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await createSubItem(user.uid, "cases", caseId, "lessons", {
      text: texto.trim(),
      suggestedChecklistItem: sugestaoChecklist.trim(),
      promoted: false,
      createdAt: Date.now(),
    });
    setTexto("");
    setSugestaoChecklist("");
  }

  async function handlePromote(licao) {
    // Adiciona a lição como conhecimento do procedimento-base
    await createSubItem(user.uid, "procedures", procedureId, "knowledgeEntries", {
      text: licao.text,
      suggestedChecklistItem: licao.suggestedChecklistItem || "",
      createdAt: Date.now(),
    });

    // Se sugeriu um novo item de checklist, adiciona também ao checklist modelo
    if (licao.suggestedChecklistItem?.trim()) {
      await createSubItem(user.uid, "procedures", procedureId, "checklistTemplate", {
        stepLabel: "Da experiência anterior",
        taskLabel: licao.suggestedChecklistItem.trim(),
        order: 999,
      });
    }

    await updateSubItem(user.uid, "cases", caseId, "lessons", licao.id, { promoted: true });
  }

  async function handleRemove(id) {
    await deleteSubItem(user.uid, "cases", caseId, "lessons", id);
  }

  return (
    <div>
      <form className="form" onSubmit={handleAdd}>
        <label>
          O que você aprendeu com este caso?
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="Ex: A certidão X pode ser solicitada pelo site Y."
          />
        </label>
        <label>
          Sugestão de novo item de checklist (opcional)
          <input
            value={sugestaoChecklist}
            onChange={(e) => setSugestaoChecklist(e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Registrar lição
          </button>
        </div>
      </form>

      <div className="card-list">
        {licoes.length === 0 && <p className="empty-state">Nenhuma lição registrada ainda.</p>}
        {licoes.map((licao) => (
          <div key={licao.id} className="list-card static">
            <div className="list-card-notes">{licao.text}</div>
            {licao.suggestedChecklistItem && (
              <div className="list-card-subtitle">
                Sugestão de checklist: {licao.suggestedChecklistItem}
              </div>
            )}
            <div className="card-actions">
              {licao.promoted ? (
                <span className="status-tag ok">Incorporada ao procedimento</span>
              ) : (
                <button className="btn-secondary" onClick={() => handlePromote(licao)}>
                  Incorporar ao procedimento
                </button>
              )}
              <button className="btn-link" onClick={() => handleRemove(licao.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
