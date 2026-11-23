import type { NextConfig } from "next";

const securityHeaders = [
  // Impide que la app se muestre dentro de otra página (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Datos sensibles: que ningún navegador ni proxy guarde copias de las páginas.
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Sin AVIF: reduce la superficie del optimizador de imágenes (que es público por el logo del login).
  images: { formats: ["image/webp"] },
  async headers() {
    return [{ source: "/((?!_next/static|_next/image|brand/).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
