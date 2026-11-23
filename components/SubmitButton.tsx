"use client";

import { useFormStatus } from "react-dom";

// Botón de envío que se desactiva mientras el formulario se guarda.
// Evita el doble clic que creaba registros duplicados (p. ej. el mismo ítem 3 veces).
export function SubmitButton({ children, className = "", pendingLabel = "Guardando…" }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
