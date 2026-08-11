import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createItem, getOne, updateItem } from "@/data/dataLayer";

const emptyForm = {
  name: "",
  description: "",
  purpose: "",
  whenToUse: "",
  requirements: "",
  deadlines: "",
  costs: "",
  faq: "",
  commonMistakes: "",
  tips: "",
};

export default function ProcedimentoForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    getOne(user.uid, "procedures", id).then((data) => {
      if (data) setForm({ ...emptyForm, ...data });
      setLoading(false);
    });
  }, [editing, id, user.uid]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await updateItem(user.uid, "procedures", id, form);
      navigate(`/procedimentos/${id}`);
    } else {
      const newId = await createItem(user.uid, "procedures", form);
      navigate(`/procedimentos/${newId}`);
    }
  }

  if (loading) return <p className="page">Carregando...</p>;

  return (
    <div className="page">
      <h1>{editing ? "Editar procedimento" : "Novo procedimento"}</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Nome do procedimento
          <input value={form.name} onChange={handleChange("name")} required />
        </label>
        <label>
          Descrição
          <textarea value={form.description} onChange={handleChange("description")} rows={3} />
        </label>
        <label>
          Objetivo
          <textarea value={form.purpose} onChange={handleChange("purpose")} rows={2} />
        </label>
        <label>
          Quando utilizar
          <textarea value={form.whenToUse} onChange={handleChange("whenToUse")} rows={2} />
        </label>
        <label>
          Requisitos
          <textarea value={form.requirements} onChange={handleChange("requirements")} rows={3} />
        </label>
        <label>
          Prazos
          <textarea value={form.deadlines} onChange={handleChange("deadlines")} rows={2} />
        </label>
        <label>
          Custos
          <textarea value={form.costs} onChange={handleChange("costs")} rows={2} />
        </label>
        <label>
          Dúvidas frequentes
          <textarea value={form.faq} onChange={handleChange("faq")} rows={3} />
        </label>
        <label>
          Erros comuns
          <textarea value={form.commonMistakes} onChange={handleChange("commonMistakes")} rows={3} />
        </label>
        <label>
          Dicas para próximos casos
          <textarea value={form.tips} onChange={handleChange("tips")} rows={3} />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
