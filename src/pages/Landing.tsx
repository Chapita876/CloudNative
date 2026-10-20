import { useGlobalStats } from "../store/ordersStore";

export default function Landing({ onLogin }: { onLogin: () => void }) {
  const stats = useGlobalStats();
  return (
    <main className="hero" style={{ maxWidth: "1280px", margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px", alignItems: "center" }}>
      <div className="hero-content">
        <div className="badge" style={{ display: "inline-block", backgroundColor: "#EFF6FF", color: "#2563EB", padding: "6px 14px", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "20px", border: "1px solid #DBEAFE" }}>
          🚀 Plataforma Cloud Native
        </div>

        <h1 style={{ fontSize: "2.75rem", fontWeight: 800, color: "#111827", lineHeight: 1.15, marginBottom: "20px", letterSpacing: "-0.03em" }}>
          Gestiona tus pedidos <br />
          <span style={{ color: "#2563EB" }}>de forma inteligente</span>
        </h1>

        <p style={{ fontSize: "1.1rem", color: "#4B5563", lineHeight: 1.6, marginBottom: "32px", maxWidth: "480px" }}>
          Bienvenido a Pedidos360, una plataforma centralizada para gestionar
          pedidos, productos y operaciones de manera rápida, segura y
          eficiente.
        </p>

        <button
          className="login-btn"
          onClick={onLogin}
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            padding: "14px 28px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.2s"
          }}
        >
          <span className="microsoft-icon" style={{ fontSize: "1.1rem" }}>⊞</span>
          Iniciar sesión con Microsoft
          <span className="arrow" style={{ fontSize: "1.1rem" }}>→</span>
        </button>

        <div className="security" style={{ marginTop: "24px", fontSize: "0.85rem", color: "#6B7280", display: "flex", alignItems: "center", gap: "6px" }}>
          🔒 Autenticación segura mediante Microsoft Entra ID
        </div>
      </div>

      <div className="hero-card" style={{ backgroundColor: "#FFFFFF", padding: "32px", borderRadius: "20px", border: "1px solid #E5E7EB", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)", position: "relative" }}>
        <div className="dashboard-preview">
          <div className="preview-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #F3F4F6", paddingBottom: "16px" }}>
            <div>
              <small style={{ color: "#6B7280", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>Resumen general</small>
              <h3 style={{ margin: "2px 0 0 0", fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>Pedidos360</h3>
            </div>
            <div className="status-dot" style={{ width: "10px", height: "10px", backgroundColor: "#10B981", borderRadius: "50%", boxShadow: "0 0 8px #10B981" }}></div>
          </div>

          <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            <div className="stat-card" style={{ backgroundColor: "#F9FAFB", padding: "14px 12px", borderRadius: "10px", textAlign: "center", border: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: "1.2rem" }}>📦</span>
              <strong style={{ display: "block", fontSize: "1.25rem", color: "#111827", margin: "4px 0 2px 0" }}>{stats.pedidos}</strong>
              <small style={{ color: "#6B7280", fontSize: "0.75rem" }}>Pedidos</small>
            </div>

            <div className="stat-card" style={{ backgroundColor: "#F9FAFB", padding: "14px 12px", borderRadius: "10px", textAlign: "center", border: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: "1.2rem" }}>🚚</span>
              <strong style={{ display: "block", fontSize: "1.25rem", color: "#2563EB", margin: "4px 0 2px 0" }}>{stats.enDespacho}</strong>
              <small style={{ color: "#6B7280", fontSize: "0.75rem" }}>En despacho</small>
            </div>

            <div className="stat-card" style={{ backgroundColor: "#F9FAFB", padding: "14px 12px", borderRadius: "10px", textAlign: "center", border: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: "1.2rem" }}>✓</span>
              <strong style={{ display: "block", fontSize: "1.25rem", color: "#059669", margin: "4px 0 2px 0" }}>{stats.completados}</strong>
              <small style={{ color: "#6B7280", fontSize: "0.75rem" }}>Completados</small>
            </div>
          </div>

          <div className="chart" style={{ backgroundColor: "#F9FAFB", padding: "16px", borderRadius: "12px", border: "1px solid #F3F4F6" }}>
            <div className="chart-title" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", marginBottom: "12px" }}>Actividad semanal</div>

            <div className="bars" style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px" }}>
              <div style={{ height: "45%", flex: 1, backgroundColor: "#3B82F6", borderRadius: "4px" }}></div>
              <div style={{ height: "65%", flex: 1, backgroundColor: "#3B82F6", borderRadius: "4px" }}></div>
              <div style={{ height: "52%", flex: 1, backgroundColor: "#3B82F6", borderRadius: "4px" }}></div>
              <div style={{ height: "80%", flex: 1, backgroundColor: "#2563EB", borderRadius: "4px" }}></div>
              <div style={{ height: "60%", flex: 1, backgroundColor: "#3B82F6", borderRadius: "4px" }}></div>
              <div style={{ height: "90%", flex: 1, backgroundColor: "#1D4ED8", borderRadius: "4px" }}></div>
              <div style={{ height: "72%", flex: 1, backgroundColor: "#3B82F6", borderRadius: "4px" }}></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
