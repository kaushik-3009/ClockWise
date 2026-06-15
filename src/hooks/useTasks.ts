import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import {
  getAllTasks,
  getTasksByProject,
  getActiveTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
} from '@/db/queries/tasks';
import type { Task } from '@/types';

export function useTasks(projectId?: string) {
  const allTasks = useLiveQuery(getAllTasks, []);
  const projectTasks = useLiveQuery(
    () => (projectId ? getTasksByProject(projectId) : getAllTasks()),
    [projectId]
  );
  const activeTasks = useLiveQuery(getActiveTasks, []);

  const addTask = useCallback(
    async (data: { name: string; project_id?: string; is_completed?: boolean }) => {
      return createTask({ ...data, is_completed: data.is_completed ?? false });
    },
    []
  );

  const editTask = useCallback(async (id: string, changes: Partial<Omit<Task, 'id'>>) => {
    await updateTask(id, changes);
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id);
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    await toggleTaskCompletion(id);
  }, []);

  return {
    tasks: projectTasks ?? [],
    allTasks: allTasks ?? [],
    activeTasks: activeTasks ?? [],
    addTask,
    editTask,
    removeTask,
    toggleComplete,
  };
}
