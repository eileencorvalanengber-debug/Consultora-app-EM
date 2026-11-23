"use client";

import { useFormStatus } from "react-dom";

// Botón de borrado: pide confirmación antes de enviar y se desactiva mientras borra.
export function ConfirmSubmitButton({ children, message, className = "" }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Eliminando…" : children}
    </button>
  );
}
