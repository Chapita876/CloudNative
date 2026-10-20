import { Routes, Route, Navigate } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { RequireAuth } from "./RequireAuth";
import { RoleProvider } from "./useRole";
import { AppShell, HomeRedirect, RoleGuard } from "./components/Layout";
import Landing from "./pages/Landing";
import Catalog from "./pages/Catalog";
import MisPedidos from "./pages/usuario/MisPedidos";
import Ventas from "./pages/operador/Ventas";
import PedidosOperador from "./pages/operador/PedidosOperador";
import Resumen from "./pages/admin/Resumen";
import TodosLosPedidos from "./pages/admin/TodosLosPedidos";
import Usuarios from "./pages/admin/Usuarios";
import CatalogoAdmin from "./pages/admin/CatalogoAdmin";
import ProductDetail from "./pages/ProductDetail";
import "./App.css";
import "./panels.css";

function App() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  return (
    <RoleProvider>
      <Routes>
        {/* Sin sesión: landing con el contador. Con sesión: directo al panel del rol. */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomeRedirect />
            ) : (
              <div className="p3-shell">
                <header className="p3-header">
                  <div className="p3-header-in">
                    <div className="p3-brand">
                      <div className="p3-brand-icon">P</div>
                      <span>Pedidos<b>360</b></span>
                    </div>
                  </div>
                </header>
                <Landing onLogin={() => instance.loginRedirect(loginRequest)} />
              </div>
            )
          }
        />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            {/* Panel de USUARIO: solo sus pedidos */}
            <Route element={<RoleGuard allow={["Usuario"]} />}>
              <Route path="/usuario" element={<MisPedidos />} />
              <Route path="/usuario/catalogo" element={<Catalog />} />
              <Route path="/usuario/catalogo/:id" element={<ProductDetail />} />
            </Route>

            {/* Panel de OPERADOR: ventas, despacho e inventario */}
            <Route element={<RoleGuard allow={["Operador"]} />}>
              <Route path="/operador" element={<Ventas />} />
              <Route path="/operador/pedidos" element={<PedidosOperador />} />
              <Route path="/operador/inventario" element={<Catalog showStock />} />
              <Route path="/operador/inventario/:id" element={<ProductDetail showStock />} />
            </Route>

            {/* Panel de ADMIN: pozo, todos los pedidos con correo, usuarios */}
            <Route element={<RoleGuard allow={["Admin"]} />}>
              <Route path="/admin" element={<Resumen />} />
              <Route path="/admin/pedidos" element={<TodosLosPedidos />} />
              <Route path="/admin/usuarios" element={<Usuarios />} />
              <Route path="/admin/catalogo" element={<CatalogoAdmin />} />
              <Route path="/admin/catalogo/:id" element={<ProductDetail showStock />} />
            </Route>
          </Route>
        </Route>

        {/* Rutas antiguas → panel del rol */}
        <Route path="/orders" element={<HomeRedirect />} />
        <Route path="/catalog" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RoleProvider>
  );
}

export default App;
