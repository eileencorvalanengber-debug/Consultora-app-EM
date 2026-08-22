"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "consultora_session";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/");
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword || password !== appPassword) {
    redirect(`/login?from=${encodeURIComponent(from)}&error=1`);
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, appPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(from || "/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
