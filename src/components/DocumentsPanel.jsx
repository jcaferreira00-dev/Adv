import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listenSubCollection,
  createSubItem,
  updateSubItem,
  deleteSubItem,
} from "@/data/dataLayer";
import { uploadFile, removeFile } from "@/data/storageDataLayer";

export default function DocumentsPanel({ parentPath, parentId }) {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const unsub = listenSubCollection(
      user.uid,
      parentPath,
      parentId,
      "documents",
      setDocumentos,
      "createdAt"
    );
    return unsub;
  }, [user.uid, parentPath, parentId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!descricao.trim() && !arquivo) return;
    setEnviando(true);
    try {
      let fileData = null;
      if (arquivo) {
        fileData = await uploadFile(user.uid, `${parentPath}/${parentId}`, arquivo);
      }
      await createSubItem(user.uid, parentPath, parentId, "documents", {
        description: descricao.trim() || arquivo?.name || "Documento",
        status: fileData ? "recebido" : "pendente",
        fileUrl: fileData?.url || null,
        filePath: fileData?.path || null,
        createdAt: Date.now(),
      });
      setDescricao("");
      setArquivo(null);
      e.target.reset();
    } finally {
      setEnviando(false);
    }
  }

  async function toggleStatus(doc) {
    await updateSubItem(user.uid, parentPath, parentId, "documents", doc.id, {
      status: doc.status === "recebido" ? "pendente" : "recebido",
    });
  }

  async function handleRemove(doc) {
    if (doc.filePath) {
      await removeFile(doc.filePath, user.uid).catch(() => {});
    }
    await deleteSubItem(user.uid, parentPath, parentId, "documents", doc.id);
  }

  return (
    <div>
      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="Nome do documento"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input type="file" onChange={(e) => setArquivo(e.target.files[0] || null)} />
        <button type="submit" className="btn-primary" disabled={enviando}>
          {enviando ? "Enviando..." : "Adicionar"}
        </button>
      </form>

      <div className="card-list">
        {documentos.length === 0 && <p className="empty-state">Nenhum documento cadastrado ainda.</p>}
        {documentos.map((doc) => (
          <div key={doc.id} className="list-card static">
            <div className="list-card-title">{doc.description}</div>
            <button
              className={doc.status === "recebido" ? "status-tag ok" : "status-tag pending"}
              onClick={() => toggleStatus(doc)}
            >
              {doc.status === "recebido" ? "Recebido" : "Pendente"}
            </button>
            {doc.fileUrl && (
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="list-card-link">
                Abrir arquivo
              </a>
            )}
            <button className="btn-link" onClick={() => handleRemove(doc)}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
