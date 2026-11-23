"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken, passwordMatches, safeRedirectPath } from "@/lib/session";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const from = safeRedirectPath(String(formData.get("from") ?? "/"));

  const ok = await passwordMatches(password);
  if (!ok) {
    // Frena los intentos automáticos de adivinar la contraseña.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    redirect(`/login?from=${encodeURIComponent(from)}&error=1`);
  }

  const token = await createSessionToken();
  if (!token) redirect(`/login?from=${encodeURIComponent(from)}&error=1`);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(from);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
