import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EDUCAMENTE | Gestión de proyectos",
  description: "Dashboard interno de proyectos, alertas y equipo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${jost.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
