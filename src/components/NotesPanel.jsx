import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listenSubCollection, createSubItem, deleteSubItem } from "@/data/dataLayer";

export default function NotesPanel({ parentPath, parentId }) {
  const { user } = useAuth();
  const [notas, setNotas] = useState([]);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const unsub = listenSubCollection(user.uid, parentPath, parentId, "notes", setNotas, "createdAt");
    return unsub;
  }, [user.uid, parentPath, parentId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await createSubItem(user.uid, parentPath, parentId, "notes", {
      text: texto.trim(),
      createdAt: Date.now(),
    });
    setTexto("");
  }

  async function handleRemove(id) {
    await deleteSubItem(user.uid, parentPath, parentId, "notes", id);
  }

  return (
    <div>
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="Escrever uma anotação..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Adicionar
        </button>
      </form>

      <div className="card-list">
        {notas.length === 0 && <p className="empty-state">Nenhuma anotação ainda.</p>}
        {notas
          .slice()
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((n) => (
            <div key={n.id} className="list-card static">
              <div className="list-card-notes">{n.text}</div>
              <button className="btn-link" onClick={() => handleRemove(n.id)}>
                Remover
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
