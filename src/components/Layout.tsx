import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { HOME_BY_ROLE, useRole } from "../useRole";
import type { Role } from "../types";

const NAV: Record<Role, { to: string; label: string }[]> = {
  Usuario: [
    { to: "/usuario", label: "📦 Mis pedidos" },
    { to: "/usuario/catalogo", label: "🏷️ Catálogo" },
  ],
  Operador: [
    { to: "/operador", label: "💰 Ventas" },
    { to: "/operador/pedidos", label: "🚚 Pedidos" },
    { to: "/operador/inventario", label: "🏷️ Inventario" },
  ],
  Admin: [
    { to: "/admin", label: "📊 Resumen" },
    { to: "/admin/pedidos", label: "📦 Todos los pedidos" },
    { to: "/admin/usuarios", label: "👥 Usuarios" },
    { to: "/admin/catalogo", label: "🏷️ Catálogo" },
  ],
};

export function AppShell() {
  const { instance } = useMsal();
  const { role, email, nombre, isMock, setMockRole } = useRole();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!role) return <div className="p3-shell"><div className="p3-center">Verificando permisos…</div></div>;

  const logout = () =>
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });

  return (
    <div className="p3-shell">
      <header className="p3-header">
        <div className="p3-header-in">
          <div className="p3-brand" onClick={() => navigate(HOME_BY_ROLE[role])}>
            <div className="p3-brand-icon">P</div>
            <span>Pedidos<b>360</b></span>
          </div>

          <nav className="p3-nav">
            {NAV[role].map((n) => (
              <button key={n.to} className={pathname === n.to || (n.to.split("/").length > 2 && pathname.startsWith(n.to + "/")) ? "on" : ""} onClick={() => navigate(n.to)}>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="p3-user">
            {isMock && (
              <select
                className="p3-mock-select"
                value={role}
                title="Solo modo demo: cambia de rol para probar cada panel"
                onChange={(e) => {
                  setMockRole(e.target.value as Role);
                  navigate(HOME_BY_ROLE[e.target.value as Role]);
                }}
              >
                <option value="Usuario">Demo: Usuario</option>
                <option value="Operador">Demo: Operador</option>
                <option value="Admin">Demo: Admin</option>
              </select>
            )}
            <div className="p3-user-info">
              <strong>{nombre}</strong>
              <small>{email}</small>
            </div>
            <span className={`p3-role ${role}`}>{role}</span>
            <button className="p3-btn" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

/** Deja pasar solo a los roles indicados; a los demás los manda a su propio panel. */
export function RoleGuard({ allow }: { allow: Role[] }) {
  const { role } = useRole();
  if (!role) return null;
  if (!allow.includes(role)) return <Navigate to={HOME_BY_ROLE[role]} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { role } = useRole();
  if (!role) return <div className="p3-center">Verificando permisos…</div>;
  return <Navigate to={HOME_BY_ROLE[role]} replace />;
}
