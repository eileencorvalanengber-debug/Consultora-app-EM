"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth-actions";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/proyectos", label: "Proyectos", icon: "📁" },
  { href: "/clientes", label: "Clientes", icon: "🤝" },
  { href: "/equipo", label: "Equipo", icon: "👥" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image src="/brand/logo_icon.png" alt="EDUCAMENTE" width={32} height={29} className="h-8 w-auto" priority />
        <div>
          <p className="text-sm font-semibold text-slate-900">EDUCAMENTE</p>
          <p className="text-xs text-slate-500">Gestión de proyectos</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-primary text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-3 py-3">
        <form action={logout}>
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
