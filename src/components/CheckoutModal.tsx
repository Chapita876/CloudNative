import { useState } from "react";
import type { Checkout } from "../types";
import { clp } from "../lib/orders";

type Err = Record<string, string>;

const digits = (s: string) => s.replace(/\D/g, "");
const fmtCard = (s: string) => digits(s).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
/** Número para la imagen de la tarjeta: lo escrito + puntos hasta completar 16 dígitos. */
const previewNum = (s: string) =>
  (digits(s) + "•".repeat(16)).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (s: string) => {
  const d = digits(s).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="p3-field">
      {label}
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

/** Ventana emergente de compra: paso 1 datos del cliente, paso 2 tarjeta. */
export default function CheckoutModal({
  total,
  defaultNombre = "",
  defaultEmail = "",
  onCancel,
  onConfirm,
}: {
  total: number;
  defaultNombre?: string;
  defaultEmail?: string;
  onCancel: () => void;
  onConfirm: (c: Checkout) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [errs, setErrs] = useState<Err>({});

  const [nombre, setNombre] = useState(defaultNombre);
  const [email, setEmail] = useState(defaultEmail);
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [venc, setVenc] = useState("");
  const [cvv, setCvv] = useState("");

  const next = () => {
    const e: Err = {};
    if (!nombre.trim()) e.nombre = "Ingresa tu nombre";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Correo no válido";
    if (digits(telefono).length < 8) e.telefono = "Teléfono no válido";
    if (!direccion.trim()) e.direccion = "Ingresa la dirección";
    if (!ciudad.trim()) e.ciudad = "Ingresa la ciudad";
    setErrs(e);
    if (Object.keys(e).length === 0) {
      setStep(2);
    }
  };

  const pay = async () => {
    const e: Err = {};
    const n = digits(numero);
    if (n.length !== 16) e.numero = "Debe tener 16 dígitos";
    if (!titular.trim()) e.titular = "Ingresa el titular";
    const m = venc.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) e.venc = "Formato MM/AA";
    if (digits(cvv).length !== 3) e.cvv = "3 dígitos";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setFail(null);
    try {
      await onConfirm({
        cliente: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim(), direccion: direccion.trim(), ciudad: ciudad.trim() },
        // Solo guardamos los últimos 4 dígitos (nunca el número completo ni el CVV).
        pago: { marca: "Visa", titular: titular.trim(), ultimos4: n.slice(-4), vencimiento: venc },
      });
    } catch (x) {
      setFail(x instanceof Error ? x.message : "No se pudo guardar el pedido");
      setBusy(false);
    }
  };

  return (
    <div className="p3-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="p3-modal">
        <h3>{step === 1 ? "Datos del cliente" : "Pago con tarjeta"}</h3>
        <div style={{ color: "#6b7280", fontSize: ".85rem" }}>Total a pagar: <b style={{ color: "#111827" }}>{clp(total)}</b></div>
        <div className="p3-steps"><span className="on" /><span className={step === 2 ? "on" : ""} /></div>

        {step === 1 ? (
          <>
            <Field label="Nombre completo" error={errs.nombre}>
              <input className={errs.nombre ? "bad" : ""} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </Field>
            <div className="p3-field-row">
              <Field label="Correo" error={errs.email}>
                <input className={errs.email ? "bad" : ""} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Teléfono" error={errs.telefono}>
                <input className={errs.telefono ? "bad" : ""} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" />
              </Field>
            </div>
            <Field label="Dirección de despacho" error={errs.direccion}>
              <input className={errs.direccion ? "bad" : ""} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </Field>
            <Field label="Ciudad" error={errs.ciudad}>
              <input className={errs.ciudad ? "bad" : ""} value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </Field>
            <div className="p3-modal-actions">
              <button type="button" className="p3-btn" onClick={onCancel}>Cancelar</button>
              <button type="button" className="p3-btn primary" onClick={next}>Continuar →</button>
            </div>
          </>
        ) : (
          <>
            <div className="p3-cardprev">
              <div className="row"><span>Tarjeta de crédito / débito</span><span className="brand">VISA</span></div>
              <div className="num">{previewNum(numero)}</div>
              <div className="row"><span>{titular || "Nombre del titular"}</span><span>{venc || "MM/AA"}</span></div>
            </div>
            <Field label="Número de tarjeta" error={errs.numero}>
              <input className={errs.numero ? "bad" : ""} inputMode="numeric" placeholder="1234 5678 9012 3456" autoComplete="off" value={numero} onChange={(e) => setNumero(fmtCard(e.target.value))} />
            </Field>
            <Field label="Titular" error={errs.titular}>
              <input className={errs.titular ? "bad" : ""} placeholder="Como aparece en la tarjeta" autoComplete="off" value={titular} onChange={(e) => setTitular(e.target.value.toUpperCase())} />
            </Field>
            <div className="p3-field-row">
              <Field label="Vencimiento" error={errs.venc}>
                <input className={errs.venc ? "bad" : ""} inputMode="numeric" value={venc} onChange={(e) => setVenc(fmtExp(e.target.value))} placeholder="MM/AA" />
              </Field>
              <Field label="CVV" error={errs.cvv}>
                <input className={errs.cvv ? "bad" : ""} inputMode="numeric" type="password" placeholder="•••" autoComplete="off" value={cvv} onChange={(e) => setCvv(digits(e.target.value).slice(0, 3))} />
              </Field>
            </div>
            {fail && <div className="p3-error">{fail}</div>}
            <div className="p3-modal-actions">
              <button type="button" className="p3-btn" disabled={busy} onClick={() => setStep(1)}>← Atrás</button>
              <button type="button" className="p3-btn primary" disabled={busy} onClick={pay}>{busy ? "Procesando…" : `Pagar ${clp(total)}`}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
