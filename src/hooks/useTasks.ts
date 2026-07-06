import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { createTask, updateTask, deleteTask, toggleTaskCompletion } from '@/db/queries/tasks';
import type { Task } from '@/types';

export function useTasks(projectId?: string) {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllTasks([]);
      setProjectTasks([]);
      setActiveTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const base = collection(getFirebaseFirestore(), 'users', user.uid, 'tasks');
    const constraints = projectId
      ? [where('project_id', '==', projectId), orderBy('created_at', 'desc')]
      : [orderBy('created_at', 'desc')];
    const q = query(base, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((d) => ({ ...(d.data() as Task), id: d.id }));
        setProjectTasks(tasks);
        setAllTasks(tasks);
        setActiveTasks(tasks.filter((t) => !t.is_completed));
        setLoading(false);
      },
      (error) => {
        console.error('[useTasks] Snapshot error:', error);
      }
    );
  }, [user, projectId]);

  const addTask = useCallback(
    async (data: { name: string; project_id?: string; is_completed?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      return createTask(user.uid, { ...data, is_completed: data.is_completed ?? false });
    },
    [user]
  );

  const editTask = useCallback(
    async (id: string, changes: Partial<Omit<Task, 'id'>>) => {
      if (!user) throw new Error('Not authenticated');
      await updateTask(user.uid, id, changes);
    },
    [user]
  );

  const removeTask = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteTask(user.uid, id);
    },
    [user]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await toggleTaskCompletion(user.uid, id);
    },
    [user]
  );

  return {
    tasks: projectTasks,
    allTasks,
    activeTasks,
    loading,
    addTask,
    editTask,
    removeTask,
    toggleComplete,
  };
}
