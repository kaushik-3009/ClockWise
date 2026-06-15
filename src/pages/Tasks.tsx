import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useSessions } from '@/hooks/useSessions';
import { TaskRow } from '@/components/projects/TaskRow';
import { TaskForm } from '@/components/projects/TaskForm';
import { Plus } from 'lucide-react';

export function TasksPage() {
  const { tasks, addTask } = useTasks();
  const { activeProjects } = useProjects();
  const { sessions } = useSessions();
  const [formOpen, setFormOpen] = useState(false);

  const projectMap = useMemo(() => {
    const map = new Map<string, (typeof activeProjects)[0]>();
    for (const p of activeProjects) map.set(p.id, p);
    return map;
  }, [activeProjects]);

  const taskTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.task_id && s.type === 'focus' && s.completed) {
        map.set(s.task_id, (map.get(s.task_id) ?? 0) + s.duration_seconds);
      }
    }
    return map;
  }, [sessions]);

  return (
    <div className="p-6 lg:p-12 max-w-[800px] mx-auto animate-[page-enter_200ms_ease]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-base">Tasks</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <p className="text-lg font-medium mb-2">No tasks yet</p>
          <p className="text-sm">Create a task to start tracking your focus</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={task.project_id ? projectMap.get(task.project_id) : undefined}
              totalFocusSeconds={taskTotals.get(task.id) ?? 0}
            />
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={addTask}
        projects={activeProjects}
      />
    </div>
  );
}
