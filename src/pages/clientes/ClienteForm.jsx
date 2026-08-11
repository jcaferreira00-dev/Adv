import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createItem, getOne, updateItem } from "@/data/dataLayer";

const emptyForm = {
  name: "",
  docNumber: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  profession: "",
  birthDate: "",
  maritalStatus: "",
  notes: "",
};

export default function ClienteForm() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    getOne(user.uid, "clients", id).then((data) => {
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
      await updateItem(user.uid, "clients", id, form);
      navigate(`/clientes/${id}`);
    } else {
      const newId = await createItem(user.uid, "clients", form);
      navigate(`/clientes/${newId}`);
    }
  }

  if (loading) return <p className="page">Carregando...</p>;

  return (
    <div className="page">
      <h1>{editing ? "Editar cliente" : "Novo cliente"}</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input value={form.name} onChange={handleChange("name")} required />
        </label>
        <label>
          CPF/CNPJ
          <input value={form.docNumber} onChange={handleChange("docNumber")} />
        </label>
        <label>
          Telefone
          <input value={form.phone} onChange={handleChange("phone")} />
        </label>
        <label>
          WhatsApp
          <input value={form.whatsapp} onChange={handleChange("whatsapp")} />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={handleChange("email")} />
        </label>
        <label>
          Endereço
          <input value={form.address} onChange={handleChange("address")} />
        </label>
        <label>
          Profissão
          <input value={form.profession} onChange={handleChange("profession")} />
        </label>
        <label>
          Data de nascimento
          <input type="date" value={form.birthDate} onChange={handleChange("birthDate")} />
        </label>
        <label>
          Estado civil
          <input value={form.maritalStatus} onChange={handleChange("maritalStatus")} />
        </label>
        <label>
          Observações
          <textarea value={form.notes} onChange={handleChange("notes")} rows={3} />
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
