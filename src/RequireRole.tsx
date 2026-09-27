import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, BrowserAuthError } from "@azure/msal-browser";
import { apiRequest } from "./authConfig";
import { decodeJwt } from "./lib/jwt";

// Mismo criterio de modo mock que useApi.ts: sin VITE_API_BASE_URL no hay
// backend ni tokens reales, así que no tiene sentido bloquear por rol todavía.
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL;

export function RequireRole({ role }: { role: string }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? instance.getActiveAccount();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    if (USE_MOCK) {
      // Sin backend todavía: dejamos pasar, pero avisamos en consola para
      // no olvidar que acá falta el chequeo real cuando se conecte la API.
      console.warn(`[RequireRole] Modo mock — se omitió el chequeo del rol "${role}".`);
      setStatus("allowed");
      return;
    }

    if (!account) return;
    let cancelled = false;

    instance
      .acquireTokenSilent({ ...apiRequest, account })
      .then((r) => {
        if (cancelled) return;
        const roles: string[] = decodeJwt(r.accessToken)?.roles ?? [];
        setStatus(roles.includes(role) ? "allowed" : "denied");
      })
      .catch((e) => {
        if (cancelled) return;
        const needsInteraction =
          e instanceof InteractionRequiredAuthError ||
          (e instanceof BrowserAuthError &&
            ["timed_out", "monitor_window_timeout"].includes(e.errorCode));
        if (needsInteraction) instance.acquireTokenRedirect({ ...apiRequest, account });
        setStatus("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [instance, account, role]);

  if (!USE_MOCK && (!account || status === "loading")) return <p>Verificando permisos…</p>;
  if (status === "denied") return <p>Requiere el rol {role}.</p>;
  return <Outlet />;
}