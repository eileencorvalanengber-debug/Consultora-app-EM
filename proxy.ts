import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Única ruta pública: la pantalla de ingreso (coincidencia exacta, no por prefijo).
  if (pathname === "/login") return NextResponse.next();

  // Sin contraseña configurada: en producción se bloquea todo (nunca queda abierta por error).
  if (!process.env.APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Aplicación no configurada", { status: 503 });
    }
    return NextResponse.next();
  }

  if (await verifySessionToken(request.cookies.get(COOKIE_NAME)?.value)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Excluye solo archivos estáticos de Next y el logo; todo lo demás pasa por la verificación.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/).*)"],
};
