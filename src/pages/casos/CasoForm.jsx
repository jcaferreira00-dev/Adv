import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createItem,
  getAllOnce,
  getSubCollectionOnce,
  createSubItem,
} from "@/data/dataLayer";

export default function CasoForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [clientes, setClientes] = useState([]);
  const [procedimentos, setProcedimentos] = useState([]);
  const [clientId, setClientId] = useState(searchParams.get("clienteId") || "");
  const [procedureId, setProcedureId] = useState(searchParams.get("procedimentoId") || "");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getAllOnce(user.uid, "clients", "name").then(setClientes);
    getAllOnce(user.uid, "procedures", "name").then(setProcedimentos);
  }, [user.uid]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!clientId || !procedureId || !title.trim()) return;
    setSalvando(true);
    try {
      const caseId = await createItem(user.uid, "cases", {
        clientId,
        procedureId,
        title: title.trim(),
        status: "Em andamento",
        nextAction: nextAction.trim(),
        deadline: deadline || null,
      });

      // Copia o checklist modelo do procedimento para o novo caso (snapshot editável)
      const checklistTemplate = await getSubCollectionOnce(
        user.uid,
        "procedures",
        procedureId,
        "checklistTemplate"
      );
      await Promise.all(
        checklistTemplate.map((item, index) =>
          createSubItem(user.uid, "cases", caseId, "checklist", {
            stepLabel: item.stepLabel,
            taskLabel: item.taskLabel,
            done: false,
            notes: "",
            order: index,
          })
        )
      );

      navigate(`/casos/${caseId}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="page">
      <h1>Novo caso</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Cliente
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Procedimento
          <select value={procedureId} onChange={(e) => setProcedureId(e.target.value)} required>
            <option value="">Selecione um procedimento</option>
            {procedimentos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Título do caso
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Inventário do pai de João"
            required
          />
        </label>
        <label>
          Próxima ação
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
        </label>
        <label>
          Prazo
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? "Criando..." : "Criar caso"}
          </button>
        </div>
      </form>
    </div>
  );
}
