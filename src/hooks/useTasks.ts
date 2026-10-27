import { useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { reportFailure } from '@/components/ui/Toast';
import { createTask, updateTask, deleteTask, setTaskCompleted } from '@/db/queries/tasks';
import type { Task } from '@/types';

export function useTasks(projectId?: string) {
  const { user } = useAuth();
  const { tasks: allTasks, loading } = useData();
  const uid = user?.uid;

  const tasks = useMemo(
    () => (projectId ? allTasks.filter((t) => t.project_id === projectId) : allTasks),
    [allTasks, projectId]
  );
  const activeTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks]);

  const addTask = useCallback(
    (
      data: Omit<Task, 'id' | 'created_at' | 'user_id' | 'is_completed'> & {
        is_completed?: boolean;
      }
    ): Task => {
      if (!uid) throw new Error('Not authenticated');
      const { task, written } = createTask(uid, {
        ...data,
        is_completed: data.is_completed ?? false,
      });
      reportFailure(written, `Couldn't save task "${data.name}"`);
      return task;
    },
    [uid]
  );

  const editTask = useCallback(
    (id: string, changes: Partial<Omit<Task, 'id' | 'user_id'>>) => {
      if (!uid) return;
      reportFailure(updateTask(uid, id, changes), "Couldn't update task");
    },
    [uid]
  );

  const removeTask = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(deleteTask(uid, id), "Couldn't delete task");
    },
    [uid]
  );

  const setCompleted = useCallback(
    (id: string, isCompleted: boolean) => {
      if (!uid) return;
      reportFailure(setTaskCompleted(uid, id, isCompleted), "Couldn't update task");
    },
    [uid]
  );

  return {
    tasks,
    allTasks,
    activeTasks,
    loading: loading.tasks,
    addTask,
    editTask,
    removeTask,
    setCompleted,
  };
}
