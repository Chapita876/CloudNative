import { Routes, Route, useNavigate } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import Orders from "./pages/Orders";
import Catalog from "./pages/Catalog";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  const iniciarSesion = () => {
    instance.loginRedirect(loginRequest);
  };

  const cerrarSesion = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: "http://localhost:5173",
    });
  };

  const usuario = accounts[0];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">P</div>
          <span>
            Pedidos<span className="brand-highlight">360</span>
          </span>
        </div>

        {isAuthenticated && (
          <div className="user-section">
            <div className="user-info">
              <strong>{usuario?.name || "Usuario"}</strong>
              <small>{usuario?.username}</small>
            </div>

            <button className="logout-btn" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      <Routes>
        {/* "/" muestra el hero si no hay sesión, o el dashboard si sí la hay */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Landing onLogin={iniciarSesion} />
            ) : (
              <Dashboard nombre={usuario?.name} />
            )
          }
        />

        {/* Rutas que exigen sesión activa */}
        <Route element={<RequireAuth />}>
          <Route path="/orders" element={<Orders />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* Además de sesión, exige el App Role "Admin" */}
          <Route element={<RequireRole role="Admin" />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

function Landing({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="hero">
      <div className="hero-content">
        <div className="badge">🚀 Plataforma Cloud Native</div>

        <h1>
          Gestiona tus pedidos
          <span> de forma inteligente</span>
        </h1>

        <p>
          Bienvenido a Pedidos360, una plataforma centralizada para gestionar
          pedidos, productos y operaciones de manera rápida, segura y
          eficiente.
        </p>

        <button className="login-btn" onClick={onLogin}>
          <span className="microsoft-icon">⊞</span>
          Iniciar sesión con Microsoft
          <span className="arrow">→</span>
        </button>

        <div className="security">
          🔒 Autenticación segura mediante Microsoft Entra ID
        </div>
      </div>

      <div className="hero-card">
        <div className="floating-icon icon-one">📦</div>
        <div className="floating-icon icon-two">🚚</div>
        <div className="floating-icon icon-three">📊</div>

        <div className="dashboard-preview">
          <div className="preview-header">
            <div>
              <small>Resumen general</small>
              <h3>Pedidos360</h3>
            </div>
            <div className="status-dot"></div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <span>📦</span>
              <strong>128</strong>
              <small>Pedidos</small>
            </div>

            <div className="stat-card">
              <span>🚚</span>
              <strong>42</strong>
              <small>En despacho</small>
            </div>

            <div className="stat-card">
              <span>✓</span>
              <strong>86</strong>
              <small>Completados</small>
            </div>
          </div>

          <div className="chart">
            <div className="chart-title">Actividad semanal</div>

            <div className="bars">
              <div style={{ height: "45%" }}></div>
              <div style={{ height: "65%" }}></div>
              <div style={{ height: "52%" }}></div>
              <div style={{ height: "80%" }}></div>
              <div style={{ height: "60%" }}></div>
              <div style={{ height: "90%" }}></div>
              <div style={{ height: "72%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Dashboard({ nombre }: { nombre?: string }) {
  const navigate = useNavigate();

  return (
    <main className="dashboard">
      <div className="welcome">
        <div>
          <span className="badge">Panel principal</span>
          <h1>Hola, {nombre?.split(" ")[0] || "Usuario"} 👋</h1>
          <p>Bienvenido nuevamente a tu plataforma Pedidos360.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="module-card orders">
          <div className="module-icon">📦</div>
          <h2>Pedidos</h2>
          <p>Consulta y administra todos los pedidos registrados.</p>
          <button onClick={() => navigate("/orders")}>Ver pedidos →</button>
        </div>

        <div className="module-card catalog">
          <div className="module-icon">🛍️</div>
          <h2>Catálogo</h2>
          <p>Gestiona productos disponibles y su información.</p>
          <button onClick={() => navigate("/catalog")}>Ver catálogo →</button>
        </div>

        <div className="module-card admin">
          <div className="module-icon">⚙️</div>
          <h2>Administración</h2>
          <p>Configuración y gestión de usuarios del sistema.</p>
          <button onClick={() => navigate("/admin")}>Administrar →</button>
        </div>
      </div>
    </main>
  );
}

export default App;