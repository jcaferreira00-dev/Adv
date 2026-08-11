// app.js — Gestão Jurídica (SPA vanilla, sem build step)
import {
  watchAuth, login, registrar, logout, watchEntity,
  criar as criarNuvem, atualizar as atualizarNuvem, remover as removerNuvem, definirComId as definirComIdNuvem,
  uid4,
} from "./cloud-sync.js";

const root = document.getElementById("app");

// ---------------------------------------------------------------- dados locais
// O app funciona sem login: os dados ficam salvos neste aparelho (localStorage).
// Ao entrar com uma conta (em Configurações), passa a sincronizar com a nuvem.
const LOCAL_KEY = "adv_dados_local_v1";
function nowStamp() {
  const d = new Date();
  return { seconds: Math.floor(d.getTime() / 1000), toDate: () => d };
}
function carregarLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const d = raw ? JSON.parse(raw) : {};
    return {
      clientes: Array.isArray(d.clientes) ? d.clientes : [],
      procedimentos: Array.isArray(d.procedimentos) ? d.procedimentos : [],
      casos: Array.isArray(d.casos) ? d.casos : [],
      contatos: Array.isArray(d.contatos) ? d.contatos : [],
    };
  } catch (e) {
    return { clientes: [], procedimentos: [], casos: [], contatos: [] };
  }
}
function salvarLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({
      clientes: state.clientes, procedimentos: state.procedimentos,
      casos: state.casos, contatos: state.contatos,
    }));
  } catch (e) { /* localStorage indisponível ou cheio — ignora */ }
}

const dadosIniciais = carregarLocal();

const state = {
  user: null,
  clientes: dadosIniciais.clientes,
  procedimentos: dadosIniciais.procedimentos,
  casos: dadosIniciais.casos,
  contatos: dadosIniciais.contatos,
  unsubs: [],
  authError: "",
  authBusy: false,
  authMode: "login", // "login" | "registrar" — usado dentro de Configurações
};

// Sem login, o CRUD abaixo mexe direto no localStorage.
// Com login, delega para o Firestore (cloud-sync.js), que sincroniza via onSnapshot.
const Dados = {
  async criar(entity, data) {
    if (state.user) return await criarNuvem(state.user.uid, entity, data);
    const item = { id: uid4(), ...data, createdAt: nowStamp(), updatedAt: nowStamp() };
    state[entity] = [item, ...state[entity]];
    salvarLocal();
    render();
    return item.id;
  },
  async atualizar(entity, id, data) {
    if (state.user) return await atualizarNuvem(state.user.uid, entity, id, data);
    state[entity] = state[entity].map((x) => (x.id === id ? { ...x, ...data, updatedAt: nowStamp() } : x));
    salvarLocal();
    render();
  },
  async remover(entity, id) {
    if (state.user) return await removerNuvem(state.user.uid, entity, id);
    state[entity] = state[entity].filter((x) => x.id !== id);
    salvarLocal();
    render();
  },
  async definirComId(entity, id, data) {
    if (state.user) return await definirComIdNuvem(state.user.uid, entity, id, data);
    const idx = state[entity].findIndex((x) => x.id === id);
    if (idx >= 0) state[entity][idx] = { ...state[entity][idx], ...data, updatedAt: nowStamp() };
    else state[entity] = [{ id, ...data, createdAt: nowStamp(), updatedAt: nowStamp() }, ...state[entity]];
    salvarLocal();
    render();
  },
};

// Ao entrar/criar conta, envia pra nuvem o que já existia neste aparelho — nada se perde.
async function mesclarLocalNaNuvem(uid, dadosLocais) {
  const entidades = ["clientes", "procedimentos", "casos", "contatos"];
  for (const ent of entidades) {
    for (const item of dadosLocais[ent] || []) {
      const { id, createdAt, updatedAt, ...resto } = item;
      if (!id) continue;
      try { await definirComIdNuvem(uid, ent, id, resto); } catch (e) { /* segue os demais itens */ }
    }
  }
}

// ---------------------------------------------------------------- helpers
function esc(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function nl2br(s) {
  return esc(s).replace(/\n/g, "<br>");
}
function fmtDate(d) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("pt-BR");
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}
function byId(list, id) {
  return list.find((x) => x.id === id);
}
function nomeCliente(id) {
  const c = byId(state.clientes, id);
  return c ? c.nome : "Cliente removido";
}
function nomeProcedimento(id) {
  const p = byId(state.procedimentos, id);
  return p ? p.nome : "Procedimento removido";
}
function statusClass(s) {
  const m = { "Em andamento": "ativo", "Suspenso": "suspenso", "Concluído": "concluido" };
  return m[s] || "ativo";
}
function go(hash) {
  window.location.hash = hash;
}
function qs(id) {
  return document.getElementById(id);
}
function val(id) {
  const el = qs(id);
  return el ? el.value : "";
}

window.App = {}; // expõe todas as ações usadas via onclick/onsubmit no HTML
const App = window.App;

// ---------------------------------------------------------------- boot
watchAuth(
  (user) => {
    state.user = user;
    attachListeners();
    render();
  },
  () => {
    state.user = null;
    detachListeners();
    const local = carregarLocal();
    state.clientes = local.clientes;
    state.procedimentos = local.procedimentos;
    state.casos = local.casos;
    state.contatos = local.contatos;
    render();
  }
);

window.addEventListener("hashchange", render);

function attachListeners() {
  detachListeners();
  const uid = state.user.uid;
  state.unsubs.push(watchEntity(uid, "clientes", (items) => { state.clientes = items; render(); }));
  state.unsubs.push(watchEntity(uid, "procedimentos", (items) => { state.procedimentos = items; render(); }));
  state.unsubs.push(watchEntity(uid, "casos", (items) => { state.casos = items; render(); }));
  state.unsubs.push(watchEntity(uid, "contatos", (items) => { state.contatos = items; render(); }));
}
function detachListeners() {
  state.unsubs.forEach((u) => u && u());
  state.unsubs = [];
}

// ---------------------------------------------------------------- autenticação (dentro de Configurações)
App.setAuthMode = function (m) { state.authMode = m; state.authError = ""; render(); };
App.doLogin = async function (e) {
  e.preventDefault();
  state.authError = ""; state.authBusy = true; render();
  const snapshot = { clientes: state.clientes, procedimentos: state.procedimentos, casos: state.casos, contatos: state.contatos };
  try {
    const user = await login(val("cfg-email"), val("cfg-senha"));
    await mesclarLocalNaNuvem(user.uid, snapshot);
    state.authBusy = false;
    go("#/config");
  } catch (err) {
    state.authError = traduzErro(err); state.authBusy = false; render();
  }
};
App.doRegister = async function (e) {
  e.preventDefault();
  state.authError = ""; state.authBusy = true; render();
  const snapshot = { clientes: state.clientes, procedimentos: state.procedimentos, casos: state.casos, contatos: state.contatos };
  try {
    const user = await registrar(val("cfg-email"), val("cfg-senha"));
    await mesclarLocalNaNuvem(user.uid, snapshot);
    state.authBusy = false;
    go("#/config");
  } catch (err) {
    state.authError = traduzErro(err); state.authBusy = false; render();
  }
};
App.doLogout = async function () {
  await logout();
  go("#/config");
};
function traduzErro(err) {
  const code = err && err.code || "";
  const map = {
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  };
  return map[code] || "Não foi possível concluir. Tente novamente.";
}

// ---------------------------------------------------------------- shell
function shell(innerHtml, activeTab) {
  const tabs = [
    { href: "#/", icon: "dashboard", label: "Início", key: "dashboard" },
    { href: "#/clientes", icon: "groups", label: "Clientes", key: "clientes" },
    { href: "#/procedimentos", icon: "checklist", label: "Procedim.", key: "procedimentos" },
    { href: "#/casos", icon: "gavel", label: "Casos", key: "casos" },
    { href: "#/busca", icon: "search", label: "Busca", key: "busca" },
  ];
  return `
  <div class="layout">
    <nav class="sidebar">
      <div class="brand"><span class="material-symbols-outlined">balance</span><span>Gestão Jurídica</span></div>
      <div class="sidebar-links">
        ${tabs.map((t) => `<a href="${t.href}" class="${activeTab === t.key ? "active" : ""}"><span class="material-symbols-outlined">${t.icon}</span>${t.label}</a>`).join("")}
      </div>
      <a href="#/config" class="sidebar-logout ${activeTab === "config" ? "active-cfg" : ""}" style="text-decoration:none;margin-bottom:6px;"><span class="material-symbols-outlined">settings</span> Configurações</a>
      ${state.user ? `<button class="sidebar-logout" onclick="App.doLogout()"><span class="material-symbols-outlined">logout</span> Sair</button>` : ""}
    </nav>
    <div class="main">
      <div class="topbar">
        <div class="brand"><span class="material-symbols-outlined">balance</span><span>Gestão Jurídica</span></div>
        <div style="display:flex;gap:2px;">
          <a class="iconbtn" title="Configurações" href="#/config"><span class="material-symbols-outlined">settings</span></a>
          ${state.user ? `<button class="iconbtn" title="Sair" onclick="App.doLogout()"><span class="material-symbols-outlined">logout</span></button>` : ""}
        </div>
      </div>
      <div class="content">${innerHtml}</div>
    </div>
  </div>
  <div class="tabbar">
    ${tabs.map((t) => `<a href="${t.href}" class="${activeTab === t.key ? "active" : ""}"><span class="material-symbols-outlined">${t.icon}</span>${t.label}</a>`).join("")}
  </div>`;
}

// ---------------------------------------------------------------- router
function render() {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

  if (parts.length === 0) { root.innerHTML = shell(viewDashboard(), "dashboard"); return; }

  const section = parts[0];

  if (section === "busca") { root.innerHTML = shell(viewBusca(), "busca"); return; }
  if (section === "contatos") { root.innerHTML = shell(viewContatos(), "dashboard"); attachContatoForm(); return; }
  if (section === "config") { root.innerHTML = shell(viewConfig(), "config"); return; }

  if (section === "clientes") {
    if (parts.length === 1) { root.innerHTML = shell(viewListaClientes(), "clientes"); return; }
    if (parts[1] === "novo") { root.innerHTML = shell(viewFormCliente(null), "clientes"); return; }
    if (parts[2] === "editar") { root.innerHTML = shell(viewFormCliente(parts[1]), "clientes"); return; }
    root.innerHTML = shell(viewDetalheCliente(parts[1]), "clientes"); attachClienteDetailForms(parts[1]); return;
  }

  if (section === "procedimentos") {
    if (parts.length === 1) { root.innerHTML = shell(viewListaProcedimentos(), "procedimentos"); return; }
    if (parts[1] === "novo") { root.innerHTML = shell(viewFormProcedimento(null), "procedimentos"); return; }
    if (parts[2] === "editar") { root.innerHTML = shell(viewFormProcedimento(parts[1]), "procedimentos"); return; }
    root.innerHTML = shell(viewDetalheProcedimento(parts[1]), "procedimentos"); attachProcedimentoDetailForms(parts[1]); return;
  }

  if (section === "casos") {
    if (parts.length === 1) { root.innerHTML = shell(viewListaCasos(), "casos"); return; }
    if (parts[1] === "novo") { root.innerHTML = shell(viewFormCaso(), "casos"); return; }
    root.innerHTML = shell(viewDetalheCaso(parts[1]), "casos"); attachCasoDetailForms(parts[1]); return;
  }

  root.innerHTML = shell(viewDashboard(), "dashboard");
}

// ---------------------------------------------------------------- dashboard
function viewDashboard() {
  const casosAtivos = state.casos.filter((c) => c.status === "Em andamento");
  const comPrazo = state.casos
    .filter((c) => c.prazo)
    .map((c) => ({ ...c, dias: daysUntil(c.prazo) }))
    .filter((c) => c.dias !== null && c.dias >= -3)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 6);

  return `
  <h1>Olá</h1>
  <p style="color:var(--text-dim);margin-bottom:18px;">Visão geral do seu escritório.</p>

  <div class="kpi-row">
    <div class="kpi"><div class="num mono">${state.clientes.length}</div><div class="label">Clientes</div></div>
    <div class="kpi"><div class="num mono">${casosAtivos.length}</div><div class="label">Casos ativos</div></div>
    <div class="kpi"><div class="num mono">${state.procedimentos.length}</div><div class="label">Procedimentos</div></div>
    <div class="kpi"><div class="num mono">${state.casos.length}</div><div class="label">Casos no total</div></div>
  </div>

  <div class="section-title"><h2>Prazos próximos</h2></div>
  ${comPrazo.length === 0 ? `<p class="empty-state">Nenhum prazo cadastrado nos próximos dias.</p>` : `<div class="grid-list">
    ${comPrazo.map((c) => `
      <a class="list-card link" href="#/casos/${c.id}">
        <div class="list-card-title">${esc(c.titulo)}</div>
        <div class="list-card-subtitle">${esc(nomeCliente(c.clienteId))} · ${fmtDate(c.prazo)}</div>
        <span class="status-tag ${c.dias < 0 ? "prazo" : c.dias <= 3 ? "prazo" : "ativo"}" style="margin-top:8px;display:inline-block;">
          ${c.dias < 0 ? `Atrasado há ${Math.abs(c.dias)}d` : c.dias === 0 ? "Vence hoje" : `Em ${c.dias} dia(s)`}
        </span>
      </a>`).join("")}
  </div>`}

  <div class="section-title"><h2>Casos ativos</h2><a href="#/casos" style="color:var(--gold-soft);font-size:.85rem;">ver todos</a></div>
  ${casosAtivos.length === 0 ? `<p class="empty-state">Nenhum caso em andamento.</p>` : `<div class="grid-list">
    ${casosAtivos.slice(0, 5).map((c) => `
      <a class="list-card link" href="#/casos/${c.id}">
        <div class="list-card-title">${esc(c.titulo)}</div>
        <div class="list-card-subtitle">${esc(nomeCliente(c.clienteId))} · ${esc(nomeProcedimento(c.procedimentoId))}</div>
        ${c.proximaAcao ? `<div class="list-card-notes">Próxima ação: ${esc(c.proximaAcao)}</div>` : ""}
      </a>`).join("")}
  </div>`}
  `;
}

// ---------------------------------------------------------------- busca
function viewBusca() {
  const q = (state.buscaTexto || "").trim().toLowerCase();
  let resultados = { clientes: [], procedimentos: [], casos: [] };
  if (q.length >= 2) {
    resultados.clientes = state.clientes.filter((c) => (c.nome || "").toLowerCase().includes(q));
    resultados.procedimentos = state.procedimentos.filter((p) => (p.nome || "").toLowerCase().includes(q));
    resultados.casos = state.casos.filter((c) => (c.titulo || "").toLowerCase().includes(q));
  }
  const total = resultados.clientes.length + resultados.procedimentos.length + resultados.casos.length;
  return `
  <h1>Busca</h1>
  <div class="searchbar">
    <span class="material-symbols-outlined">search</span>
    <input id="busca-input" placeholder="Buscar clientes, casos, procedimentos…" value="${esc(state.buscaTexto || "")}" oninput="App.onBusca(this.value)" autofocus>
  </div>
  ${q.length < 2 ? `<p class="empty-state">Digite pelo menos 2 letras para buscar.</p>` :
    total === 0 ? `<p class="empty-state">Nada encontrado para "${esc(q)}".</p>` : `
    ${resultados.clientes.length ? `<div class="search-group-label">Clientes</div>${resultados.clientes.map((c) => `
      <a class="list-card link" href="#/clientes/${c.id}"><div class="list-card-title">${esc(c.nome)}</div>${c.telefone ? `<div class="list-card-subtitle">${esc(c.telefone)}</div>` : ""}</a>`).join("")}` : ""}
    ${resultados.procedimentos.length ? `<div class="search-group-label">Procedimentos</div>${resultados.procedimentos.map((p) => `
      <a class="list-card link" href="#/procedimentos/${p.id}"><div class="list-card-title">${esc(p.nome)}</div></a>`).join("")}` : ""}
    ${resultados.casos.length ? `<div class="search-group-label">Casos</div>${resultados.casos.map((c) => `
      <a class="list-card link" href="#/casos/${c.id}"><div class="list-card-title">${esc(c.titulo)}</div><div class="list-card-subtitle">${esc(nomeCliente(c.clienteId))}</div></a>`).join("")}` : ""}
  `}`;
}
App.onBusca = function (v) {
  state.buscaTexto = v;
  const focusPos = qs("busca-input") ? qs("busca-input").selectionStart : null;
  render();
  const inp = qs("busca-input");
  if (inp) { inp.focus(); if (focusPos !== null) inp.setSelectionRange(focusPos, focusPos); }
};

// ---------------------------------------------------------------- contatos
function viewContatos() {
  const list = state.contatos.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  return `
  <h1>Contatos úteis</h1>
  <p style="color:var(--text-dim);margin-bottom:18px;">Cartórios, fóruns, peritos, parceiros.</p>

  <form class="form" onsubmit="App.addContato(event)">
    <label><span>Nome</span><input id="ct-nome" required></label>
    <label><span>Categoria</span><input id="ct-categoria" placeholder="Ex: Cartório, Perito, Fórum"></label>
    <label><span>Telefone</span><input id="ct-telefone"></label>
    <label><span>E-mail</span><input id="ct-email" type="email"></label>
    <label><span>Observações</span><textarea id="ct-obs" rows="2"></textarea></label>
    <button class="btn-primary" type="submit">Adicionar contato</button>
  </form>

  <div class="section-title"><h2>Lista</h2></div>
  ${list.length === 0 ? `<p class="empty-state">Nenhum contato cadastrado ainda.</p>` : `<div class="grid-list">
    ${list.map((c) => `
      <div class="list-card">
        <div class="list-card-title">${esc(c.nome)}</div>
        ${c.categoria ? `<div class="list-card-subtitle">${esc(c.categoria)}</div>` : ""}
        ${c.telefone ? `<div class="list-card-notes">Tel: ${esc(c.telefone)}</div>` : ""}
        ${c.email ? `<div class="list-card-notes">${esc(c.email)}</div>` : ""}
        ${c.observacoes ? `<div class="list-card-notes">${nl2br(c.observacoes)}</div>` : ""}
        <div class="btn-row"><button class="btn-link" onclick="App.removerContato('${c.id}')">Remover</button></div>
      </div>`).join("")}
  </div>`}
  `;
}
function attachContatoForm() {}
App.addContato = async function (e) {
  e.preventDefault();
  const nome = val("ct-nome").trim();
  if (!nome) return;
  await Dados.criar("contatos", {
    nome, categoria: val("ct-categoria").trim(), telefone: val("ct-telefone").trim(),
    email: val("ct-email").trim(), observacoes: val("ct-obs").trim(),
  });
};
App.removerContato = async function (id) {
  if (!confirm("Remover este contato?")) return;
  await Dados.remover("contatos", id);
};

// ================================================================ CLIENTES
function viewListaClientes() {
  const list = state.clientes.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  return `
  <div class="page-header"><h1>Clientes</h1><a href="#/clientes/novo" class="btn-primary">+ Novo</a></div>
  ${list.length === 0 ? `<p class="empty-state">Nenhum cliente cadastrado ainda.</p>` : `<div class="grid-list">
    ${list.map((c) => `
      <a class="list-card link" href="#/clientes/${c.id}">
        <div class="list-card-title">${esc(c.nome)}</div>
        <div class="list-card-subtitle">${esc(c.telefone || c.email || "")}</div>
      </a>`).join("")}
  </div>`}
  `;
}

function viewFormCliente(id) {
  const editing = !!id;
  const c = editing ? byId(state.clientes, id) : null;
  if (editing && !c) return `<p class="empty-state">Cliente não encontrado.</p>`;
  return `
  <a class="back-link" href="${editing ? "#/clientes/" + id : "#/clientes"}"><span class="material-symbols-outlined">arrow_back</span> Voltar</a>
  <h1>${editing ? "Editar cliente" : "Novo cliente"}</h1>
  <form class="form" onsubmit="App.salvarCliente(event, ${editing ? `'${id}'` : "null"})">
    <label><span>Nome completo</span><input id="cl-nome" required value="${esc(c?.nome)}"></label>
    <label><span>CPF/CNPJ</span><input id="cl-cpf" value="${esc(c?.cpfCnpj)}"></label>
    <label><span>Telefone</span><input id="cl-tel" value="${esc(c?.telefone)}"></label>
    <label><span>E-mail</span><input id="cl-email" type="email" value="${esc(c?.email)}"></label>
    <label><span>Endereço</span><input id="cl-end" value="${esc(c?.endereco)}"></label>
    <label><span>Observações</span><textarea id="cl-obs" rows="3">${esc(c?.observacoes)}</textarea></label>
    <div class="form-actions"><button class="btn-primary" type="submit">${editing ? "Salvar alterações" : "Cadastrar cliente"}</button></div>
  </form>
  `;
}
App.salvarCliente = async function (e, id) {
  e.preventDefault();
  const data = {
    nome: val("cl-nome").trim(), cpfCnpj: val("cl-cpf").trim(), telefone: val("cl-tel").trim(),
    email: val("cl-email").trim(), endereco: val("cl-end").trim(), observacoes: val("cl-obs").trim(),
  };
  if (!data.nome) return;
  if (id) {
    await Dados.atualizar("clientes", id, data);
    go("#/clientes/" + id);
  } else {
    data.documentos = []; data.anotacoes = []; data.historico = [];
    const newId = await Dados.criar("clientes", data);
    go("#/clientes/" + newId);
  }
};
App.removerCliente = async function (id) {
  if (!confirm("Remover este cliente? Os casos vinculados não serão apagados, mas ficarão sem cliente.")) return;
  await Dados.remover("clientes", id);
  go("#/clientes");
};

const CLIENTE_TABS = ["Info", "Documentos", "Anotações", "Histórico", "Casos"];
function viewDetalheCliente(id) {
  const c = byId(state.clientes, id);
  if (!c) return `<p class="empty-state">Cliente não encontrado.</p>`;
  const tab = state.tabCliente || "Info";
  const casosVinculados = state.casos.filter((cs) => cs.clienteId === id);

  return `
  <a class="back-link" href="#/clientes"><span class="material-symbols-outlined">arrow_back</span> Clientes</a>
  <div class="page-header"><h1>${esc(c.nome)}</h1><a href="#/clientes/${id}/editar" class="btn-secondary">Editar</a></div>

  <div class="tabs">${CLIENTE_TABS.map((t) => `<button class="tab ${tab === t ? "active" : ""}" onclick="App.setTabCliente('${t}')">${t}</button>`).join("")}</div>

  ${tab === "Info" ? `
    <div class="info-grid">
      ${infoBlock("CPF/CNPJ", c.cpfCnpj)}
      ${infoBlock("Telefone", c.telefone)}
      ${infoBlock("E-mail", c.email)}
      ${infoBlock("Endereço", c.endereco)}
      ${infoBlock("Observações", c.observacoes)}
    </div>
    <div class="btn-row"><button class="btn-danger" onclick="App.removerCliente('${id}')">Remover cliente</button></div>
  ` : ""}

  ${tab === "Documentos" ? listaDocumentos("clientes", c, id) : ""}
  ${tab === "Anotações" ? listaAnotacoes("clientes", c, id) : ""}
  ${tab === "Histórico" ? listaHistorico("clientes", c, id) : ""}

  ${tab === "Casos" ? (casosVinculados.length === 0 ? `<p class="empty-state">Nenhum caso vinculado ainda.</p>` :
    casosVinculados.map((cs) => `
      <a class="list-card link" href="#/casos/${cs.id}">
        <div class="list-card-title">${esc(cs.titulo)}</div>
        <div class="list-card-subtitle">${esc(cs.status)}</div>
      </a>`).join("")) : ""}
  `;
}
App.setTabCliente = function (t) { state.tabCliente = t; render(); };
function attachClienteDetailForms() {}

function infoBlock(label, value) {
  if (!value) return "";
  return `<div class="info-block"><div class="info-label">${esc(label)}</div><div class="info-value">${nl2br(value)}</div></div>`;
}

// ================================================================ helpers genéricos: documentos / anotações / histórico
// Reutilizados por clientes, procedimentos e casos (arrays dentro do próprio doc).

function listaDocumentos(entity, item, id) {
  const docs = item.documentos || [];
  return `
  <form class="form" onsubmit="App.addDocumento(event, '${entity}', '${id}')">
    <label><span>Nome do documento</span><input id="doc-nome" required placeholder="Ex: RG, Certidão de nascimento"></label>
    <label><span>Link (opcional)</span><input id="doc-url" placeholder="https://…"></label>
    <div class="form-actions"><button class="btn-primary" type="submit">Adicionar documento</button></div>
  </form>
  ${docs.length === 0 ? `<p class="empty-state">Nenhum documento anexado ainda.</p>` :
    docs.map((d) => `
      <div class="list-card static">
        <div class="list-card-title">${esc(d.nome)}</div>
        ${d.url ? `<a class="list-card-link" href="${esc(d.url)}" target="_blank" rel="noreferrer">${esc(d.url)}</a>` : ""}
        <div class="btn-row"><button class="btn-link" onclick="App.removerItem('${entity}', '${id}', 'documentos', '${d.id}')">Remover</button></div>
      </div>`).join("")}
  `;
}
App.addDocumento = async function (e, entity, id) {
  e.preventDefault();
  const nome = val("doc-nome").trim();
  if (!nome) return;
  const item = byId(state[entity], id);
  const documentos = [...(item.documentos || []), { id: uid4(), nome, url: val("doc-url").trim() }];
  await Dados.atualizar(entity, id, { documentos });
};

function listaAnotacoes(entity, item, id) {
  const anotacoes = (item.anotacoes || []).slice().reverse();
  return `
  <form class="form" onsubmit="App.addAnotacao(event, '${entity}', '${id}')">
    <label><span>Nova anotação</span><textarea id="an-texto" rows="3" required></textarea></label>
    <div class="form-actions"><button class="btn-primary" type="submit">Adicionar</button></div>
  </form>
  ${anotacoes.length === 0 ? `<p class="empty-state">Nenhuma anotação ainda.</p>` :
    anotacoes.map((a) => `
      <div class="list-card static">
        <div class="list-card-notes">${nl2br(a.texto)}</div>
        <div class="list-card-subtitle" style="margin-top:6px;">${esc(a.data)}</div>
        <div class="btn-row"><button class="btn-link" onclick="App.removerItem('${entity}', '${id}', 'anotacoes', '${a.id}')">Remover</button></div>
      </div>`).join("")}
  `;
}
App.addAnotacao = async function (e, entity, id) {
  e.preventDefault();
  const texto = val("an-texto").trim();
  if (!texto) return;
  const item = byId(state[entity], id);
  const anotacoes = [...(item.anotacoes || []), { id: uid4(), texto, data: fmtDate(new Date().toISOString().slice(0, 10)) }];
  await Dados.atualizar(entity, id, { anotacoes });
};

function listaHistorico(entity, item, id) {
  const historico = (item.historico || []).slice().reverse();
  return `
  <form class="form" onsubmit="App.addHistorico(event, '${entity}', '${id}')">
    <label><span>Registrar evento</span><input id="hi-texto" required placeholder="Ex: Petição protocolada"></label>
    <div class="form-actions"><button class="btn-primary" type="submit">Registrar</button></div>
  </form>
  ${historico.length === 0 ? `<p class="empty-state">Nenhum evento registrado ainda.</p>` :
    `<ul class="checklist">${historico.map((h) => `
      <li><span>${esc(h.texto)}</span><span class="list-card-subtitle mono">${esc(h.data)}</span>
        <button class="btn-link" onclick="App.removerItem('${entity}', '${id}', 'historico', '${h.id}')">✕</button>
      </li>`).join("")}</ul>`}
  `;
}
App.addHistorico = async function (e, entity, id) {
  e.preventDefault();
  const texto = val("hi-texto").trim();
  if (!texto) return;
  const item = byId(state[entity], id);
  const historico = [...(item.historico || []), { id: uid4(), texto, data: fmtDate(new Date().toISOString().slice(0, 10)) }];
  await Dados.atualizar(entity, id, { historico });
};

App.removerItem = async function (entity, id, field, itemId) {
  const item = byId(state[entity], id);
  const updated = (item[field] || []).filter((x) => x.id !== itemId);
  await Dados.atualizar(entity, id, { [field]: updated });
};

// ================================================================ PROCEDIMENTOS
function viewListaProcedimentos() {
  const list = state.procedimentos.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  return `
  <div class="page-header"><h1>Procedimentos</h1><a href="#/procedimentos/novo" class="btn-primary">+ Novo</a></div>
  <p style="color:var(--text-dim);margin-bottom:16px;">Modelos reutilizáveis: cada novo caso nasce a partir de um procedimento.</p>
  ${list.length === 0 ? `<p class="empty-state">Nenhum procedimento cadastrado ainda.</p>` : `<div class="grid-list">
    ${list.map((p) => `
      <a class="list-card link" href="#/procedimentos/${p.id}">
        <div class="list-card-title">${esc(p.nome)}</div>
        ${p.descricao ? `<div class="list-card-subtitle">${esc(p.descricao)}</div>` : ""}
      </a>`).join("")}
  </div>`}
  `;
}

function viewFormProcedimento(id) {
  const editing = !!id;
  const p = editing ? byId(state.procedimentos, id) : null;
  if (editing && !p) return `<p class="empty-state">Procedimento não encontrado.</p>`;
  const campos = [
    ["nome", "Nome do procedimento", "input", true],
    ["descricao", "Descrição", "textarea"],
    ["objetivo", "Objetivo", "textarea"],
    ["quandoUsar", "Quando utilizar", "textarea"],
    ["requisitos", "Requisitos", "textarea"],
    ["prazos", "Prazos legais", "textarea"],
    ["custos", "Custos", "textarea"],
    ["faq", "Dúvidas frequentes", "textarea"],
    ["errosComuns", "Erros comuns", "textarea"],
    ["dicas", "Dicas para próximos casos", "textarea"],
  ];
  return `
  <a class="back-link" href="${editing ? "#/procedimentos/" + id : "#/procedimentos"}"><span class="material-symbols-outlined">arrow_back</span> Voltar</a>
  <h1>${editing ? "Editar procedimento" : "Novo procedimento"}</h1>
  <form class="form" onsubmit="App.salvarProcedimento(event, ${editing ? `'${id}'` : "null"})">
    ${campos.map(([key, label, tag, req]) => `
      <label><span>${label}</span>${tag === "textarea"
        ? `<textarea id="pr-${key}" rows="3">${esc(p?.[key])}</textarea>`
        : `<input id="pr-${key}" ${req ? "required" : ""} value="${esc(p?.[key])}">`}</label>
    `).join("")}
    <div class="form-actions"><button class="btn-primary" type="submit">${editing ? "Salvar alterações" : "Criar procedimento"}</button></div>
  </form>
  `;
}
App.salvarProcedimento = async function (e, id) {
  e.preventDefault();
  const keys = ["nome", "descricao", "objetivo", "quandoUsar", "requisitos", "prazos", "custos", "faq", "errosComuns", "dicas"];
  const data = {};
  keys.forEach((k) => (data[k] = val("pr-" + k).trim()));
  if (!data.nome) return;
  if (id) {
    await Dados.atualizar("procedimentos", id, data);
    go("#/procedimentos/" + id);
  } else {
    data.checklistModelo = []; data.documentosNecessarios = []; data.conhecimentos = [];
    const newId = await Dados.criar("procedimentos", data);
    go("#/procedimentos/" + newId);
  }
};
App.removerProcedimento = async function (id) {
  if (!confirm("Remover este procedimento-base?")) return;
  await Dados.remover("procedimentos", id);
  go("#/procedimentos");
};

const PROC_TABS = ["Info", "Checklist modelo", "Documentos necessários", "Conhecimentos", "Casos"];
function viewDetalheProcedimento(id) {
  const p = byId(state.procedimentos, id);
  if (!p) return `<p class="empty-state">Procedimento não encontrado.</p>`;
  const tab = state.tabProc || "Info";
  const casosVinculados = state.casos.filter((cs) => cs.procedimentoId === id);
  const checklist = p.checklistModelo || [];
  const grupos = {};
  checklist.forEach((it) => { (grupos[it.etapa || "Geral"] = grupos[it.etapa || "Geral"] || []).push(it); });

  return `
  <a class="back-link" href="#/procedimentos"><span class="material-symbols-outlined">arrow_back</span> Procedimentos</a>
  <div class="page-header"><h1>${esc(p.nome)}</h1><a href="#/procedimentos/${id}/editar" class="btn-secondary">Editar</a></div>

  <div class="tabs">${PROC_TABS.map((t) => `<button class="tab ${tab === t ? "active" : ""}" onclick="App.setTabProc('${t}')">${t}</button>`).join("")}</div>

  ${tab === "Info" ? `
    <div class="info-grid">
      ${infoBlock("Descrição", p.descricao)}
      ${infoBlock("Objetivo", p.objetivo)}
      ${infoBlock("Quando utilizar", p.quandoUsar)}
      ${infoBlock("Requisitos", p.requisitos)}
      ${infoBlock("Prazos legais", p.prazos)}
      ${infoBlock("Custos", p.custos)}
      ${infoBlock("Dúvidas frequentes", p.faq)}
      ${infoBlock("Erros comuns", p.errosComuns)}
      ${infoBlock("Dicas para próximos casos", p.dicas)}
    </div>
    <div class="btn-row"><button class="btn-danger" onclick="App.removerProcedimento('${id}')">Remover procedimento</button></div>
  ` : ""}

  ${tab === "Checklist modelo" ? `
    <form class="inline-form" onsubmit="App.addChecklistModelo(event, '${id}')">
      <input id="cm-etapa" placeholder="Etapa (ex: Documentos)">
      <input id="cm-tarefa" placeholder="Tarefa" required>
      <button class="btn-primary" type="submit">Adicionar</button>
    </form>
    ${Object.keys(grupos).length === 0 ? `<p class="empty-state">Nenhum item no checklist modelo ainda.</p>` :
      Object.entries(grupos).map(([etapa, itens]) => `
        <div class="checklist-group"><h3>${esc(etapa)}</h3>
          <ul class="checklist">${itens.map((it) => `
            <li><span>${esc(it.tarefa)}</span><button class="btn-link" onclick="App.removerItem('procedimentos', '${id}', 'checklistModelo', '${it.id}')">Remover</button></li>
          `).join("")}</ul>
        </div>`).join("")}
  ` : ""}

  ${tab === "Documentos necessários" ? `
    <form class="form" onsubmit="App.addDocNecessario(event, '${id}')">
      <label><span>Documento</span><input id="dn-nome" required></label>
      <label><span>Onde conseguir</span><input id="dn-onde"></label>
      <label><span>Link (opcional)</span><input id="dn-url"></label>
      <label><span>Observações</span><input id="dn-obs"></label>
      <div class="form-actions"><button class="btn-primary" type="submit">Adicionar documento</button></div>
    </form>
    ${(p.documentosNecessarios || []).length === 0 ? `<p class="empty-state">Nenhum documento cadastrado ainda.</p>` :
      p.documentosNecessarios.map((d) => `
        <div class="list-card static">
          <div class="list-card-title">${esc(d.nome)}</div>
          ${d.onde ? `<div class="list-card-subtitle">Onde: ${esc(d.onde)}</div>` : ""}
          ${d.url ? `<a class="list-card-link" href="${esc(d.url)}" target="_blank" rel="noreferrer">${esc(d.url)}</a>` : ""}
          ${d.obs ? `<div class="list-card-notes">${esc(d.obs)}</div>` : ""}
          <div class="btn-row"><button class="btn-link" onclick="App.removerItem('procedimentos', '${id}', 'documentosNecessarios', '${d.id}')">Remover</button></div>
        </div>`).join("")}
  ` : ""}

  ${tab === "Conhecimentos" ? `
    ${(p.conhecimentos || []).length === 0 ? `<p class="empty-state">Nenhum conhecimento incorporado ainda. Lições registradas em casos vinculados podem ser incorporadas aqui.</p>` :
      p.conhecimentos.slice().reverse().map((k) => `
        <div class="list-card static">
          <div class="list-card-notes">${nl2br(k.texto)}</div>
          ${k.sugestaoChecklist ? `<div class="list-card-subtitle" style="margin-top:6px;">Virou item de checklist: ${esc(k.sugestaoChecklist)}</div>` : ""}
        </div>`).join("")}
  ` : ""}

  ${tab === "Casos" ? (casosVinculados.length === 0 ? `<p class="empty-state">Nenhum caso vinculado ainda.</p>` :
    casosVinculados.map((cs) => `
      <a class="list-card link" href="#/casos/${cs.id}">
        <div class="list-card-title">${esc(cs.titulo)}</div>
        <div class="list-card-subtitle">${esc(cs.status)}</div>
      </a>`).join("")) : ""}
  `;
}
App.setTabProc = function (t) { state.tabProc = t; render(); };
function attachProcedimentoDetailForms() {}

App.addChecklistModelo = async function (e, id) {
  e.preventDefault();
  const tarefa = val("cm-tarefa").trim();
  if (!tarefa) return;
  const p = byId(state.procedimentos, id);
  const checklistModelo = [...(p.checklistModelo || []), { id: uid4(), etapa: val("cm-etapa").trim() || "Geral", tarefa }];
  await Dados.atualizar("procedimentos", id, { checklistModelo });
};
App.addDocNecessario = async function (e, id) {
  e.preventDefault();
  const nome = val("dn-nome").trim();
  if (!nome) return;
  const p = byId(state.procedimentos, id);
  const documentosNecessarios = [...(p.documentosNecessarios || []), {
    id: uid4(), nome, onde: val("dn-onde").trim(), url: val("dn-url").trim(), obs: val("dn-obs").trim(),
  }];
  await Dados.atualizar("procedimentos", id, { documentosNecessarios });
};

// ================================================================ CASOS
function viewListaCasos() {
  const list = state.casos.slice().sort((a, b) => (a.createdAt?.seconds || 0) < (b.createdAt?.seconds || 0) ? 1 : -1);
  return `
  <div class="page-header"><h1>Casos</h1><a href="#/casos/novo" class="btn-primary">+ Novo</a></div>
  ${list.length === 0 ? `<p class="empty-state">Nenhum caso cadastrado ainda.</p>` : `<div class="grid-list">
    ${list.map((c) => `
      <a class="list-card link" href="#/casos/${c.id}">
        <div class="list-card-title">${esc(c.titulo)}</div>
        <div class="list-card-subtitle">${esc(nomeCliente(c.clienteId))} · ${esc(nomeProcedimento(c.procedimentoId))}</div>
        <span class="status-tag ${statusClass(c.status)}" style="margin-top:8px;display:inline-block;">${esc(c.status)}</span>
        ${c.prazo ? `<span class="list-card-subtitle" style="margin-left:8px;">Prazo: ${fmtDate(c.prazo)}</span>` : ""}
      </a>`).join("")}
  </div>`}
  `;
}

function viewFormCaso() {
  const clientes = state.clientes.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  const procedimentos = state.procedimentos.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
  if (clientes.length === 0 || procedimentos.length === 0) {
    return `
    <a class="back-link" href="#/casos"><span class="material-symbols-outlined">arrow_back</span> Voltar</a>
    <h1>Novo caso</h1>
    <p class="empty-state">${clientes.length === 0 ? "Cadastre um cliente" : "Cadastre um procedimento"} antes de criar um caso.<br>
      <a href="${clientes.length === 0 ? "#/clientes/novo" : "#/procedimentos/novo"}" style="color:var(--gold-soft);">Criar agora</a></p>`;
  }
  return `
  <a class="back-link" href="#/casos"><span class="material-symbols-outlined">arrow_back</span> Voltar</a>
  <h1>Novo caso</h1>
  <form class="form" onsubmit="App.salvarCaso(event)">
    <label><span>Cliente</span><select id="cs-cliente" required>
      <option value="">Selecione um cliente</option>
      ${clientes.map((c) => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}
    </select></label>
    <label><span>Procedimento</span><select id="cs-procedimento" required>
      <option value="">Selecione um procedimento</option>
      ${procedimentos.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")}
    </select></label>
    <label><span>Título do caso</span><input id="cs-titulo" required placeholder="Ex: Inventário do pai de João"></label>
    <label><span>Próxima ação</span><input id="cs-proxima"></label>
    <label><span>Prazo</span><input id="cs-prazo" type="date"></label>
    <div class="form-actions"><button class="btn-primary" type="submit">Criar caso</button></div>
  </form>
  `;
}
App.salvarCaso = async function (e) {
  e.preventDefault();
  const clienteId = val("cs-cliente"), procedimentoId = val("cs-procedimento"), titulo = val("cs-titulo").trim();
  if (!clienteId || !procedimentoId || !titulo) return;
  const proc = byId(state.procedimentos, procedimentoId);
  const checklist = (proc.checklistModelo || []).map((it) => ({ id: uid4(), etapa: it.etapa, tarefa: it.tarefa, concluido: false }));
  const newId = await Dados.criar("casos", {
    clienteId, procedimentoId, titulo, status: "Em andamento",
    proximaAcao: val("cs-proxima").trim(), prazo: val("cs-prazo") || null,
    checklist, documentos: [], anotacoes: [], historico: [], licoes: [],
  });
  go("#/casos/" + newId);
};
App.removerCaso = async function (id) {
  if (!confirm("Remover este caso? Esta ação não pode ser desfeita.")) return;
  await Dados.remover("casos", id);
  go("#/casos");
};

const CASO_TABS = ["Checklist", "Documentos", "Anotações", "Histórico", "Lições"];
function viewDetalheCaso(id) {
  const c = byId(state.casos, id);
  if (!c) return `<p class="empty-state">Caso não encontrado.</p>`;
  const tab = state.tabCaso || "Checklist";
  const checklist = c.checklist || [];
  const feitos = checklist.filter((it) => it.concluido).length;

  return `
  <a class="back-link" href="#/casos"><span class="material-symbols-outlined">arrow_back</span> Casos</a>
  <div class="page-header"><h1>${esc(c.titulo)}</h1></div>
  <p style="color:var(--text-dim);margin:-8px 0 14px;">
    <a href="#/clientes/${c.clienteId}" style="color:var(--gold-soft);">${esc(nomeCliente(c.clienteId))}</a>
    · <a href="#/procedimentos/${c.procedimentoId}" style="color:var(--gold-soft);">${esc(nomeProcedimento(c.procedimentoId))}</a>
  </p>

  <div class="card">
    <label style="display:block;margin-bottom:10px;">
      <span class="list-card-subtitle" style="display:block;margin-bottom:4px;">Status</span>
      <select onchange="App.atualizarCasoCampo('${id}', 'status', this.value)" style="width:100%;background:var(--bg-elev);border:1px solid var(--border);border-radius:9px;padding:9px 11px;color:var(--text);">
        ${["Em andamento", "Suspenso", "Concluído"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
    </label>
    <label style="display:block;margin-bottom:10px;">
      <span class="list-card-subtitle" style="display:block;margin-bottom:4px;">Próxima ação</span>
      <input value="${esc(c.proximaAcao)}" onchange="App.atualizarCasoCampo('${id}', 'proximaAcao', this.value)" style="width:100%;background:var(--bg-elev);border:1px solid var(--border);border-radius:9px;padding:9px 11px;color:var(--text);">
    </label>
    <label style="display:block;">
      <span class="list-card-subtitle" style="display:block;margin-bottom:4px;">Prazo</span>
      <input type="date" value="${esc(c.prazo || "")}" onchange="App.atualizarCasoCampo('${id}', 'prazo', this.value)" style="width:100%;background:var(--bg-elev);border:1px solid var(--border);border-radius:9px;padding:9px 11px;color:var(--text);">
    </label>
  </div>

  <div class="tabs">${CASO_TABS.map((t) => `<button class="tab ${tab === t ? "active" : ""}" onclick="App.setTabCaso('${t}')">${t}${t === "Checklist" && checklist.length ? ` (${feitos}/${checklist.length})` : ""}</button>`).join("")}</div>

  ${tab === "Checklist" ? `
    <form class="inline-form" onsubmit="App.addChecklistCaso(event, '${id}')">
      <input id="cc-etapa" placeholder="Etapa">
      <input id="cc-tarefa" placeholder="Tarefa" required>
      <button class="btn-primary" type="submit">Adicionar</button>
    </form>
    ${checklist.length === 0 ? `<p class="empty-state">Nenhum item no checklist. Se veio de um procedimento com checklist modelo, os itens aparecem aqui automaticamente.</p>` : `
      <ul class="checklist">${checklist.map((it) => `
        <li class="${it.concluido ? "done" : ""}">
          <div class="check-circle ${it.concluido ? "checked" : ""}" onclick="App.toggleChecklistCaso('${id}', '${it.id}')">
            ${it.concluido ? '<span class="material-symbols-outlined">check</span>' : ""}
          </div>
          <span>${esc(it.tarefa)}${it.etapa && it.etapa !== "Geral" ? ` <span style="color:var(--text-faint);">· ${esc(it.etapa)}</span>` : ""}</span>
          <button class="btn-link" onclick="App.removerItem('casos', '${id}', 'checklist', '${it.id}')">✕</button>
        </li>`).join("")}</ul>`}
  ` : ""}

  ${tab === "Documentos" ? listaDocumentos("casos", c, id) : ""}
  ${tab === "Anotações" ? listaAnotacoes("casos", c, id) : ""}
  ${tab === "Histórico" ? listaHistorico("casos", c, id) : ""}

  ${tab === "Lições" ? `
    <form class="form" onsubmit="App.addLicao(event, '${id}')">
      <label><span>O que você aprendeu com este caso?</span><textarea id="li-texto" rows="3" required placeholder="Ex: A certidão X pode ser pedida pelo site Y."></textarea></label>
      <label><span>Sugestão de novo item de checklist (opcional)</span><input id="li-sugestao"></label>
      <div class="form-actions"><button class="btn-primary" type="submit">Registrar lição</button></div>
    </form>
    ${(c.licoes || []).length === 0 ? `<p class="empty-state">Nenhuma lição registrada ainda.</p>` :
      c.licoes.slice().reverse().map((l) => `
        <div class="list-card static">
          <div class="list-card-notes">${nl2br(l.texto)}</div>
          ${l.sugestaoChecklist ? `<div class="list-card-subtitle" style="margin-top:6px;">Sugestão de checklist: ${esc(l.sugestaoChecklist)}</div>` : ""}
          <div class="btn-row">
            ${l.incorporado ? `<span class="status-tag ok">Incorporada ao procedimento</span>` :
              `<button class="btn-secondary" onclick="App.incorporarLicao('${id}', '${l.id}')">Incorporar ao procedimento</button>`}
            <button class="btn-link" onclick="App.removerItem('casos', '${id}', 'licoes', '${l.id}')">Remover</button>
          </div>
        </div>`).join("")}
  ` : ""}

  <div class="btn-row" style="margin-top:22px;"><button class="btn-danger" onclick="App.removerCaso('${id}')">Remover caso</button></div>
  `;
}
App.setTabCaso = function (t) { state.tabCaso = t; render(); };
function attachCasoDetailForms() {}

App.atualizarCasoCampo = async function (id, campo, valor) {
  await Dados.atualizar("casos", id, { [campo]: campo === "prazo" ? (valor || null) : valor });
};
App.addChecklistCaso = async function (e, id) {
  e.preventDefault();
  const tarefa = val("cc-tarefa").trim();
  if (!tarefa) return;
  const c = byId(state.casos, id);
  const checklist = [...(c.checklist || []), { id: uid4(), etapa: val("cc-etapa").trim() || "Geral", tarefa, concluido: false }];
  await Dados.atualizar("casos", id, { checklist });
};
App.toggleChecklistCaso = async function (id, itemId) {
  const c = byId(state.casos, id);
  const checklist = (c.checklist || []).map((it) => it.id === itemId ? { ...it, concluido: !it.concluido } : it);
  await Dados.atualizar("casos", id, { checklist });
};
App.addLicao = async function (e, id) {
  e.preventDefault();
  const texto = val("li-texto").trim();
  if (!texto) return;
  const c = byId(state.casos, id);
  const licoes = [...(c.licoes || []), { id: uid4(), texto, sugestaoChecklist: val("li-sugestao").trim(), incorporado: false }];
  await Dados.atualizar("casos", id, { licoes });
};
App.incorporarLicao = async function (casoId, licaoId) {
  const c = byId(state.casos, casoId);
  const licao = (c.licoes || []).find((l) => l.id === licaoId);
  if (!licao) return;
  const p = byId(state.procedimentos, c.procedimentoId);
  if (p) {
    const conhecimentos = [...(p.conhecimentos || []), { id: uid4(), texto: licao.texto, sugestaoChecklist: licao.sugestaoChecklist || "" }];
    const patch = { conhecimentos };
    if (licao.sugestaoChecklist && licao.sugestaoChecklist.trim()) {
      patch.checklistModelo = [...(p.checklistModelo || []), { id: uid4(), etapa: "Da experiência anterior", tarefa: licao.sugestaoChecklist.trim() }];
    }
    await Dados.atualizar("procedimentos", p.id, patch);
  }
  const licoes = (c.licoes || []).map((l) => l.id === licaoId ? { ...l, incorporado: true } : l);
  await Dados.atualizar("casos", casoId, { licoes });
};

render();

// ================================================================ CONFIGURAÇÕES / BACKUP
function viewConfig() {
  const totalRegistros = state.clientes.length + state.procedimentos.length + state.casos.length + state.contatos.length;
  return `
  <h1>Configurações</h1>
  <p style="color:var(--text-dim);margin-bottom:20px;">Backup local dos seus dados — nada aqui afeta outros apps.</p>

  <div class="card">
    <h3>Sincronização na nuvem</h3>
    ${state.user ? `
      <p style="color:var(--text-dim);font-size:.88rem;margin:6px 0 14px;line-height:1.5;">
        Conectado como <strong style="color:var(--text);">${esc(state.user.email)}</strong>. Seus dados estão sincronizados e disponíveis em qualquer aparelho onde você entrar com esta conta.
      </p>
      <button class="btn-secondary" onclick="App.doLogout()">
        <span class="material-symbols-outlined" style="font-size:18px;vertical-align:-3px;">logout</span> Sair da conta
      </button>
    ` : `
      <p style="color:var(--text-dim);font-size:.88rem;margin:6px 0 14px;line-height:1.5;">
        Sem login, seus dados ficam salvos apenas neste aparelho. Entre com uma conta (ou crie uma) para sincronizar entre celular, tablet e computador.
      </p>
      ${state.authError ? `<div class="error-msg">${esc(state.authError)}</div>` : ""}
      <form class="form" onsubmit="${state.authMode === "registrar" ? "App.doRegister(event)" : "App.doLogin(event)"}" style="margin-bottom:6px;">
        <label><span>E-mail</span><input id="cfg-email" type="email" required autocomplete="email"></label>
        <label><span>Senha</span><input id="cfg-senha" type="password" required ${state.authMode === "registrar" ? 'minlength="6" autocomplete="new-password"' : 'autocomplete="current-password"'}></label>
        <button class="btn-primary" type="submit" ${state.authBusy ? "disabled" : ""}>
          ${state.authBusy ? "Aguarde…" : (state.authMode === "registrar" ? "Criar conta" : "Entrar")}
        </button>
      </form>
      <div style="font-size:.86rem;color:var(--text-dim);">
        ${state.authMode === "registrar"
          ? `Já tem conta? <a href="#" onclick="event.preventDefault();App.setAuthMode('login')" style="color:var(--gold-soft);">Entrar</a>`
          : `Não tem conta? <a href="#" onclick="event.preventDefault();App.setAuthMode('registrar')" style="color:var(--gold-soft);">Criar conta</a>`}
      </div>
    `}
  </div>

  <div class="card">
    <h3>Exportar backup</h3>
    <p style="color:var(--text-dim);font-size:.88rem;margin:6px 0 14px;line-height:1.5;">
      Baixa um arquivo .json com todos os clientes, procedimentos, casos e contatos (${totalRegistros} registro${totalRegistros === 1 ? "" : "s"} no total). Guarde esse arquivo — é a sua cópia de segurança.
    </p>
    <button class="btn-primary" onclick="App.exportarBackup()">
      <span class="material-symbols-outlined" style="font-size:18px;vertical-align:-3px;">download</span> Exportar backup (.json)
    </button>
  </div>

  <div class="card">
    <h3>Importar backup</h3>
    <p style="color:var(--text-dim);font-size:.88rem;margin:6px 0 14px;line-height:1.5;">
      Escolha um arquivo .json exportado por este app. Os registros do arquivo são gravados por cima dos dados atuais (por ID) — nada existente é apagado nesse processo.
    </p>
    <label class="btn-secondary" style="display:inline-block;cursor:pointer;">
      Escolher arquivo…
      <input type="file" accept="application/json" onchange="App.importarBackupArquivo(event)" style="display:none;">
    </label>
    <div id="import-status" style="margin-top:10px;font-size:.85rem;color:var(--text-dim);"></div>
  </div>

  <div class="card" style="border-color:rgba(224,100,95,.35);">
    <h3 style="color:var(--danger);">Limpar tudo</h3>
    <p style="color:var(--text-dim);font-size:.88rem;margin:6px 0 14px;line-height:1.5;">
      Apaga permanentemente todos os clientes, procedimentos, casos e contatos deste app. Não pode ser desfeito — exporte um backup antes de continuar.
    </p>
    <button class="btn-danger" onclick="App.limparTudo()">Apagar todos os dados</button>
  </div>
  `;
}

App.exportarBackup = function () {
  const dados = {
    versao: 1,
    exportadoEm: new Date().toISOString(),
    clientes: state.clientes,
    procedimentos: state.procedimentos,
    casos: state.casos,
    contatos: state.contatos,
  };
  const json = JSON.stringify(dados, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v), 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `backup-gestao-juridica-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

App.importarBackupArquivo = async function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = qs("import-status");
  if (statusEl) statusEl.textContent = "Importando…";
  try {
    const text = await file.text();
    const dados = JSON.parse(text);
    const entidades = ["clientes", "procedimentos", "casos", "contatos"];
    let total = 0;
    for (const ent of entidades) {
      const lista = Array.isArray(dados[ent]) ? dados[ent] : [];
      for (const item of lista) {
        const { id, createdAt, updatedAt, ...resto } = item;
        if (!id) continue;
        await Dados.definirComId(ent, id, resto);
        total++;
      }
    }
    if (statusEl) statusEl.textContent = `Importação concluída: ${total} registro(s).`;
  } catch (err) {
    if (statusEl) statusEl.textContent = "Não foi possível importar esse arquivo. Verifique se é um backup válido.";
  }
  e.target.value = "";
};

App.limparTudo = async function () {
  const ok1 = confirm(
    "Isso vai apagar TODOS os clientes, procedimentos, casos e contatos , sem volta. Recomendo exportar um backup antes. Deseja continuar?"
  );
  if (!ok1) return;
  const digitado = prompt('Para confirmar, digite exatamente: APAGAR TUDO');
  if (digitado !== "APAGAR TUDO") {
    alert("Confirmação incorreta. Nada foi apagado.");
    return;
  }
  const todos = [
    ...state.clientes.map((x) => ["clientes", x.id]),
    ...state.procedimentos.map((x) => ["procedimentos", x.id]),
    ...state.casos.map((x) => ["casos", x.id]),
    ...state.contatos.map((x) => ["contatos", x.id]),
  ];
  for (const [ent, id] of todos) {
    await Dados.remover(ent, id);
  }
  alert("Tudo apagado.");
  go("#/");
};
