import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "consultora_session";

export function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const session = request.cookies.get(COOKIE_NAME)?.value;
  if (session === password) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|brand/).*)"],
};
