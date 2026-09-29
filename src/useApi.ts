import { useMsal } from "@azure/msal-react";

import {

 InteractionRequiredAuthError,

 BrowserAuthError,

} from "@azure/msal-browser";

import { apiRequest } from "./authConfig";



const USE_MOCK =

 import.meta.env.VITE_USE_MOCK === "true" ||

 !import.meta.env.VITE_API_BASE_URL;



export function useApi() {

 const { instance, accounts } = useMsal();



 const fetchWithToken = async (path: string, init: RequestInit = {}) => {

  if (USE_MOCK) {

   console.warn(

    `[useApi] Modo mock activo — no se llamó a ${path} de verdad.`

   );

   return new Response(JSON.stringify({ mock: true, path }), {

    status: 200,

   });

  }



  const account = accounts[0] || instance.getActiveAccount();

  if (!account) throw new Error("No hay una cuenta activa");



  let token: string;



  try {

   const r = await instance.acquireTokenSilent({

    ...apiRequest,

    account,

   });



   token = r.accessToken;



   // 🔐 Mostrar temporalmente el JWT en la consola

   console.log("ACCESS TOKEN (JWT):", token);

  } catch (e) {

   const needsInteraction =

    e instanceof InteractionRequiredAuthError ||

    (e instanceof BrowserAuthError &&

     ["timed_out", "monitor_window_timeout"].includes(e.errorCode));



   if (needsInteraction) {

    await instance.acquireTokenRedirect({

     ...apiRequest,

     account,

    });

   }



   throw e;

  }



  const normalizedPath = path === "/pedidos" ? "/orden" : path;



  return fetch(

   `${import.meta.env.VITE_API_BASE_URL}${normalizedPath}`,

   {

    ...init,

    headers: {

     ...init.headers,

     Authorization: `Bearer ${token}`,

    },

   }

  );

 };



 return { fetchWithToken, isMock: USE_MOCK };

}