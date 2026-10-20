import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "../../components/ProductImage";
import { useCatalog, type ProductInput } from "../../useCatalog";
import { LoadState, PageHeader } from "../../components/ui";
import { clp } from "../../lib/orders";
import type { Product } from "../../types";

const VACIO: ProductInput = { nombre: "", categoria: "General", precio: 0, stock: 0, descripcion: "", imagen: "", caracteristicas: [] };

/** Reduce la foto subida a ~640px para no llenar el almacenamiento. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

/** Admin: crear, editar y eliminar productos del catálogo. */
export default function CatalogoAdmin() {
  const { products, loading, error, saveProduct, removeProduct } = useCatalog();
  const [form, setForm] = useState<ProductInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const guardar = async () => {
    if (!form) return;
    if (!form.nombre.trim()) return setErr("El producto necesita un nombre.");
    if (form.precio < 0 || form.stock < 0) return setErr("Precio y stock no pueden ser negativos.");
    setSaving(true);
    setErr(null);
    try {
      await saveProduct({ ...form, caracteristicas: (form.caracteristicas ?? []).map((c) => c.trim()).filter(Boolean), nombre: form.nombre.trim(), categoria: form.categoria.trim() || "General" });
      setForm(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (p: Product) => {
    if (!window.confirm(`¿Eliminar "${p.nombre}" del catálogo?`)) return;
    setBusy(p.id);
    setErr(null);
    try {
      await removeProduct(p.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar el producto");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p3-page">
      <PageHeader
        title="Catálogo"
        subtitle="Agrega, edita o elimina productos. Los cambios se ven al instante en el formulario de pedidos."
        action={!form && <button className="p3-btn primary" onClick={() => { setErr(null); setForm({ ...VACIO }); }}>+ Nuevo producto</button>}
      />
      <LoadState loading={loading && products.length === 0} error={error} />
      {err && <div className="p3-error">{err}</div>}

      {form && (
        <div className="p3-card" style={{ marginBottom: 24 }}>
          <h3>{form.id ? "Editar producto" : "Nuevo producto"}</h3>
          <div className="p3-toolbar">
            <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={{ flex: 2, minWidth: 200 }} />
            <input placeholder="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            <input type="number" min={0} placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: Math.max(0, Number(e.target.value) || 0) })} style={{ width: 120, flex: "none", minWidth: 0 }} />
            <input type="number" min={0} placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} style={{ width: 90, flex: "none", minWidth: 0 }} />
          </div>
          <div className="p3-toolbar">
            <textarea
              placeholder="Descripción del producto"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              style={{ flex: 1, minWidth: 260, padding: 8, borderRadius: 8, border: "1px solid #d1d5db", font: "inherit" }}
            />
          </div>
          <div className="p3-toolbar">
            <textarea
              placeholder="Características (una por línea)"
              value={(form.caracteristicas ?? []).join("\n")}
              onChange={(e) => setForm({ ...form, caracteristicas: e.target.value.split("\n") })}
              rows={4}
              style={{ flex: 1, minWidth: 260, padding: 8, borderRadius: 8, border: "1px solid #d1d5db", font: "inherit" }}
            />
          </div>
          <div className="p3-toolbar" style={{ alignItems: "center" }}>
            <input placeholder="URL de la foto (https://…)" value={form.imagen?.startsWith("data:") ? "" : form.imagen ?? ""} onChange={(e) => setForm({ ...form, imagen: e.target.value })} style={{ flex: 2, minWidth: 200 }} />
            <label className="p3-btn" style={{ cursor: "pointer" }}>
              Subir foto
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try { const d = await fileToDataUrl(f); setForm((cur) => cur && { ...cur, imagen: d }); }
                  catch (er) { setErr(er instanceof Error ? er.message : "Error con la imagen"); }
                }}
              />
            </label>
            {form.imagen && <div style={{ width: 72 }}><ProductImage nombre={form.nombre} categoria={form.categoria} src={form.imagen} style={{ borderRadius: 6 }} /></div>}
          </div>
          <div className="p3-actions">
            <button className="p3-btn primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
            <button className="p3-btn" onClick={() => { setForm(null); setErr(null); }} disabled={saving}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="p3-table-wrap">
        {products.length === 0 ? (
          <div className="p3-empty">No hay productos en el catálogo.</div>
        ) : (
          <table className="p3-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="num">Precio</th>
                <th className="num">Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/admin/catalogo/${encodeURIComponent(p.id)}`} style={{ fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>{p.nombre}</Link>
                    <div className="p3-mono">{p.id.length > 12 ? `${p.id.slice(0, 12)}…` : p.id}</div>
                  </td>
                  <td>{p.categoria}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{clp(p.precio)}</td>
                  <td className="num" style={{ color: p.stock > 5 ? "#059669" : p.stock > 0 ? "#d97706" : "#dc2626", fontWeight: 600 }}>{p.stock}</td>
                  <td>
                    <div className="p3-actions">
                      <button className="p3-btn sm primary" disabled={busy === p.id} onClick={() => { setErr(null); setForm({ ...p }); }}>Editar</button>
                      <button className="p3-btn sm danger" disabled={busy === p.id} onClick={() => eliminar(p)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
