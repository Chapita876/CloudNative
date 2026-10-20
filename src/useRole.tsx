import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, BrowserAuthError } from "@azure/msal-browser";
import { apiRequest } from "./authConfig";
import { decodeJwt } from "./lib/jwt";
import type { Role } from "./types";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL;

const MOCK_ROLE_KEY = "p360.mockRole";

interface RoleCtx {
  role: Role | null; // null = todavía verificando
  email: string;
  nombre: string;
  /** id del usuario en Entra (oid) */
  userId: string;
  isMock: boolean;
  setMockRole: (r: Role) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

/** Decide el rol más alto que tenga el usuario según los App Roles del token. */
export function pickRole(roles: string[]): Role {
  const low = roles.map((r) => r.toLowerCase());
  if (low.includes("admin")) return "Admin";
  if (low.some((r) => ["operador", "operator", "operario"].includes(r))) return "Operador";
  return "Usuario";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const account = accounts[0] ?? instance.getActiveAccount();
  const [role, setRole] = useState<Role | null>(null);
  const [mockRole, setMockRoleState] = useState<Role>(() => {
    try {
      return (localStorage.getItem(MOCK_ROLE_KEY) as Role) || "Usuario";
    } catch {
      return "Usuario";
    }
  });

  useEffect(() => {
    if (USE_MOCK || !account) return;
    let cancelled = false;
    instance
      .acquireTokenSilent({ ...apiRequest, account })
      .then((r) => {
        if (!cancelled) setRole(pickRole(decodeJwt(r.accessToken)?.roles ?? []));
      })
      .catch((e) => {
        if (cancelled) return;
        const needsInteraction =
          e instanceof InteractionRequiredAuthError ||
          (e instanceof BrowserAuthError &&
            ["timed_out", "monitor_window_timeout"].includes(e.errorCode));
        if (needsInteraction) instance.acquireTokenRedirect({ ...apiRequest, account });
        setRole("Usuario"); // si falla, el mínimo privilegio
      });
    return () => {
      cancelled = true;
    };
  }, [instance, account]);

  const setMockRole = (r: Role) => {
    setMockRoleState(r);
    try {
      localStorage.setItem(MOCK_ROLE_KEY, r);
    } catch {
      /* ignore */
    }
  };

  const value: RoleCtx = {
    role: USE_MOCK ? mockRole : role,
    email: (account?.username ?? "demo@pedidos360.local").toLowerCase(),
    nombre: account?.name ?? "Usuario demo",
    userId: (account?.localAccountId ?? "").toLowerCase(),
    isMock: USE_MOCK,
    setMockRole,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRole debe usarse dentro de <RoleProvider>");
  return v;
}

export const HOME_BY_ROLE: Record<Role, string> = {
  Admin: "/admin",
  Operador: "/operador",
  Usuario: "/usuario",
};
