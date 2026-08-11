import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listenCollection, createItem, deleteItem } from "@/data/dataLayer";

const emptyForm = {
  name: "",
  institution: "",
  phone: "",
  whatsapp: "",
  email: "",
  site: "",
  notes: "",
};

export default function Contatos() {
  const { user } = useAuth();
  const [contatos, setContatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const unsub = listenCollection(user.uid, "contacts", setContatos, "name");
    return unsub;
  }, [user.uid]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createItem(user.uid, "contacts", form);
    setForm(emptyForm);
    setMostrarForm(false);
  }

  async function handleRemove(id) {
    await deleteItem(user.uid, "contacts", id);
  }

  const filtrados = contatos.filter(
    (c) =>
      c.name?.toLowerCase().includes(busca.toLowerCase()) ||
      c.institution?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Contatos</h1>
        <button className="btn-primary" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "Novo contato"}
        </button>
      </div>

      {mostrarForm && (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input value={form.name} onChange={handleChange("name")} required />
          </label>
          <label>
            Instituição
            <input value={form.institution} onChange={handleChange("institution")} />
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
            <input value={form.email} onChange={handleChange("email")} />
          </label>
          <label>
            Site
            <input value={form.site} onChange={handleChange("site")} />
          </label>
          <label>
            Observações
            <textarea value={form.notes} onChange={handleChange("notes")} rows={2} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Salvar contato
            </button>
          </div>
        </form>
      )}

      <input
        className="search-input"
        placeholder="Buscar contato..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card-list">
        {filtrados.length === 0 && <p className="empty-state">Nenhum contato cadastrado ainda.</p>}
        {filtrados.map((c) => (
          <div key={c.id} className="list-card static">
            <div className="list-card-title">{c.name}</div>
            {c.institution && <div className="list-card-subtitle">{c.institution}</div>}
            {c.phone && <div className="list-card-notes">Telefone: {c.phone}</div>}
            {c.whatsapp && <div className="list-card-notes">WhatsApp: {c.whatsapp}</div>}
            {c.email && <div className="list-card-notes">E-mail: {c.email}</div>}
            {c.site && (
              <a href={c.site} target="_blank" rel="noreferrer" className="list-card-link">
                {c.site}
              </a>
            )}
            <button className="btn-link" onClick={() => handleRemove(c.id)}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
