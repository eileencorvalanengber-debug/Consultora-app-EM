// Sesión firmada (HMAC-SHA256) usando Web Crypto, para que funcione igual en
// proxy.ts y en server actions. La cookie NUNCA contiene la contraseña: solo un
// vencimiento y una firma que no se puede falsificar sin conocer APP_PASSWORD.
// Si cambias APP_PASSWORD (o SESSION_SECRET), todas las sesiones abiertas caducan.

export const COOKIE_NAME = "consultora_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

const encoder = new TextEncoder();

function signingKeyMaterial(): string | null {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return `${process.env.SESSION_SECRET ?? ""}|${password}`;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(message: string, keyMaterial: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(keyMaterial), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

// Comparación en tiempo constante (evita filtrar información por tiempos de respuesta).
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

// Compara contraseñas pasando por un hash de largo fijo.
export async function passwordMatches(candidate: string): Promise<boolean> {
  const real = process.env.APP_PASSWORD;
  if (!real) return false;
  const [a, b] = await Promise.all([sign(candidate, "pw-check"), sign(real, "pw-check")]);
  return safeEqual(a, b);
}

export async function createSessionToken(): Promise<string | null> {
  const material = signingKeyMaterial();
  if (!material) return null;
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `v1.${expires}`;
  return `${payload}.${await sign(payload, material)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const material = signingKeyMaterial();
  if (!material || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;

  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;

  const expected = await sign(`v1.${parts[1]}`, material);
  return safeEqual(expected, parts[2]);
}

// Solo permite volver a rutas internas (evita redirecciones abiertas a otros sitios).
export function safeRedirectPath(from: string | null | undefined): string {
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) return "/";
  if (from.startsWith("/login")) return "/";
  return from;
}
