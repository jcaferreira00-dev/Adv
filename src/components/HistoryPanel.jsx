import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listenSubCollection, createSubItem, deleteSubItem } from "@/data/dataLayer";

export default function HistoryPanel({ parentPath, parentId }) {
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const unsub = listenSubCollection(user.uid, parentPath, parentId, "history", setEventos, "createdAt");
    return unsub;
  }, [user.uid, parentPath, parentId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await createSubItem(user.uid, parentPath, parentId, "history", {
      text: texto.trim(),
      createdAt: Date.now(),
    });
    setTexto("");
  }

  async function handleRemove(id) {
    await deleteSubItem(user.uid, parentPath, parentId, "history", id);
  }

  const ordenados = eventos.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div>
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="Registrar novo evento..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Registrar
        </button>
      </form>

      <ul className="timeline">
        {ordenados.length === 0 && <p className="empty-state">Nenhum evento registrado ainda.</p>}
        {ordenados.map((ev) => (
          <li key={ev.id}>
            <div className="timeline-date">
              {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("pt-BR") : ""}
            </div>
            <div className="timeline-text">{ev.text}</div>
            <button className="btn-link" onClick={() => handleRemove(ev.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
