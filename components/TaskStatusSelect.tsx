"use client";

import { updateTaskStatus } from "@/lib/actions";
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from "@/lib/labels";
import type { TaskStatus } from "@prisma/client";

export function TaskStatusSelect({ taskId, projectId, status }: { taskId: string; projectId: string; status: TaskStatus }) {
  return (
    <form action={updateTaskStatus}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="projectId" value={projectId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none ${TASK_STATUS_COLOR[status]}`}
      >
        {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </form>
  );
}
