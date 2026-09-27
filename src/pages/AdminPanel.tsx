export default function AdminPanel() {
  return (
    <div>
      <h1>Administración</h1>
      <p>
        Esta sección solo es visible para usuarios con el App Role{" "}
        <strong>Admin</strong> (protegida por <code>RequireRole</code>).
      </p>
    </div>
  );
}