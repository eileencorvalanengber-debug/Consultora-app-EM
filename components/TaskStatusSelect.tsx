"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions";
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from "@/lib/labels";
import type { TaskStatus } from "@prisma/client";

export function TaskStatusSelect({ taskId, projectId, status }: { taskId: string; projectId: string; status: TaskStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<TaskStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Si el servidor trae otro estado (p. ej. tras refrescar), se sincroniza.
  useEffect(() => {
    setValue(status);
  }, [status]);

  function onChange(next: TaskStatus) {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("taskId", taskId);
        fd.set("projectId", projectId);
        fd.set("status", next);
        await updateTaskStatus(fd);
        router.refresh();
      } catch {
        setValue(previous);
        setError("No se pudo guardar");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none disabled:opacity-60 ${TASK_STATUS_COLOR[value]}`}
      >
        {Object.entries(TASK_STATUS_LABEL).map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
