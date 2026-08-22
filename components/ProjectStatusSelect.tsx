"use client";

import { updateProjectStatus } from "@/lib/actions";
import { PROJECT_STATUS_LABEL } from "@/lib/labels";
import type { ProjectStatus } from "@prisma/client";

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  return (
    <form action={updateProjectStatus}>
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
      >
        {Object.entries(PROJECT_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
