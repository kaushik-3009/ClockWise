import { useEffect, useState, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
} from '@/db/queries/projects';
import type { Project, ProjectColor } from '@/types';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjects([]);
      setArchivedProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(getFirebaseFirestore(), 'users', user.uid, 'projects'),
      orderBy('created_at', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((d) => ({ ...(d.data() as Project), id: d.id }));
        setProjects(all);
        setActiveProjects(all.filter((p) => p.status === 'active'));
        setArchivedProjects(all.filter((p) => p.status === 'archived'));
        setLoading(false);
      },
      (error) => {
        console.error('[useProjects] Snapshot error:', error);
      }
    );
  }, [user]);

  const addProject = useCallback(
    async (data: { name: string; description?: string; color: ProjectColor }) => {
      if (!user) throw new Error('Not authenticated');
      return createProject(user.uid, data);
    },
    [user]
  );

  const editProject = useCallback(
    async (id: string, changes: Partial<Omit<Project, 'id'>>) => {
      if (!user) throw new Error('Not authenticated');
      await updateProject(user.uid, id, changes);
    },
    [user]
  );

  const removeProject = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteProject(user.uid, id);
    },
    [user]
  );

  const archive = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await archiveProject(user.uid, id);
    },
    [user]
  );

  const unarchive = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      await unarchiveProject(user.uid, id);
    },
    [user]
  );

  const getProject = useCallback(
    async (id: string) => {
      if (!user) return undefined;
      return getProjectById(user.uid, id);
    },
    [user]
  );

  return {
    projects,
    activeProjects,
    archivedProjects,
    loading,
    addProject,
    editProject,
    removeProject,
    archive,
    unarchive,
    getProjectById: getProject,
  };
}
