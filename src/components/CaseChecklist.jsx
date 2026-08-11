import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listenSubCollection, updateSubItem, createSubItem, deleteSubItem } from "@/data/dataLayer";

export default function CaseChecklist({ caseId, onProgressChange }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [stepLabel, setStepLabel] = useState("");
  const [taskLabel, setTaskLabel] = useState("");

  useEffect(() => {
    const unsub = listenSubCollection(user.uid, "cases", caseId, "checklist", setItems, "order");
    return unsub;
  }, [user.uid, caseId]);

  useEffect(() => {
    if (!onProgressChange) return;
    const done = items.filter((i) => i.done).length;
    onProgressChange({ done, total: items.length });
  }, [items, onProgressChange]);

  async function toggle(item) {
    await updateSubItem(user.uid, "cases", caseId, "checklist", item.id, { done: !item.done });
  }

  async function updateNotes(item, notes) {
    await updateSubItem(user.uid, "cases", caseId, "checklist", item.id, { notes });
  }

  async function addItem(e) {
    e.preventDefault();
    if (!taskLabel.trim()) return;
    await createSubItem(user.uid, "cases", caseId, "checklist", {
      stepLabel: stepLabel.trim() || "Geral",
      taskLabel: taskLabel.trim(),
      done: false,
      notes: "",
      order: items.length,
    });
    setTaskLabel("");
  }

  async function removeItem(id) {
    await deleteSubItem(user.uid, "cases", caseId, "checklist", id);
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
          placeholder="Etapa"
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
            {tasks.map((item) => (
              <li key={item.id}>
                <label className="checklist-item">
                  <input type="checkbox" checked={!!item.done} onChange={() => toggle(item)} />
                  <span className={item.done ? "done" : ""}>{item.taskLabel}</span>
                </label>
                <input
                  className="checklist-notes"
                  placeholder="Observação"
                  defaultValue={item.notes}
                  onBlur={(e) => updateNotes(item, e.target.value)}
                />
                <button className="btn-link" onClick={() => removeItem(item.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {items.length === 0 && <p className="empty-state">Nenhum item no checklist ainda.</p>}
    </div>
  );
}
