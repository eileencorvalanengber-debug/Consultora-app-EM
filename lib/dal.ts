import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Verificación de sesión pegada a los datos. proxy.ts es solo la primera barrera:
// cada página y cada server action debe llamar a requireAuth() antes de leer o escribir.
export async function requireAuth(): Promise<void> {
  if (process.env.NODE_ENV !== "production" && !process.env.APP_PASSWORD) return; // solo desarrollo local
  const store = await cookies();
  const ok = await verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!ok) redirect("/login");
}
