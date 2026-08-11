import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Busca from "./pages/Busca";
import Contatos from "./pages/Contatos";

import ClientesList from "./pages/clientes/ClientesList";
import ClienteForm from "./pages/clientes/ClienteForm";
import ClienteDetalhe from "./pages/clientes/ClienteDetalhe";

import ProcedimentosList from "./pages/procedimentos/ProcedimentosList";
import ProcedimentoForm from "./pages/procedimentos/ProcedimentoForm";
import ProcedimentoDetalhe from "./pages/procedimentos/ProcedimentoDetalhe";

import CasosList from "./pages/casos/CasosList";
import CasoForm from "./pages/casos/CasoForm";
import CasoDetalhe from "./pages/casos/CasoDetalhe";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="busca" element={<Busca />} />
            <Route path="contatos" element={<Contatos />} />

            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id" element={<ClienteDetalhe />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />

            <Route path="procedimentos" element={<ProcedimentosList />} />
            <Route path="procedimentos/novo" element={<ProcedimentoForm />} />
            <Route path="procedimentos/:id" element={<ProcedimentoDetalhe />} />
            <Route path="procedimentos/:id/editar" element={<ProcedimentoForm />} />

            <Route path="casos" element={<CasosList />} />
            <Route path="casos/novo" element={<CasoForm />} />
            <Route path="casos/:id" element={<CasoDetalhe />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
