import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Painel", end: true },
  { to: "/clientes", label: "Clientes" },
  { to: "/procedimentos", label: "Procedimentos" },
  { to: "/casos", label: "Casos" },
  { to: "/contatos", label: "Contatos" },
  { to: "/busca", label: "Busca" },
];

export default function Layout() {
  const { user, logout, isDemo } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">GJ</span>
          <span>Gestão Jurídica</span>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-email">{user?.email}</div>
          <button className="btn-link" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        {isDemo && (
          <div className="demo-banner">
            Modo de teste — os dados ficam salvos apenas neste navegador e não são
            sincronizados com o Firebase.
          </div>
        )}
        <div className="fade-in-up" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
