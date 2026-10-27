import { useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useData } from '@/hooks/useData';
import { reportFailure } from '@/components/ui/Toast';
import {
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
} from '@/db/queries/projects';
import type { Project, ProjectColor } from '@/types';

export function useProjects() {
  const { user } = useAuth();
  const { projects, loading } = useData();
  const uid = user?.uid;

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const archivedProjects = useMemo(
    () => projects.filter((p) => p.status === 'archived'),
    [projects]
  );

  // Mutations update the local cache immediately and report failures via toast;
  // they deliberately don't block on server acknowledgement (see reportFailure).
  const addProject = useCallback(
    (data: { name: string; description?: string; color: ProjectColor }): Project => {
      if (!uid) throw new Error('Not authenticated');
      const { project, written } = createProject(uid, data);
      reportFailure(written, `Couldn't save project "${data.name}"`);
      return project;
    },
    [uid]
  );

  const editProject = useCallback(
    (id: string, changes: Partial<Omit<Project, 'id' | 'user_id'>>) => {
      if (!uid) return;
      reportFailure(updateProject(uid, id, changes), "Couldn't update project");
    },
    [uid]
  );

  const removeProject = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(deleteProject(uid, id), "Couldn't delete project");
    },
    [uid]
  );

  const archive = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(archiveProject(uid, id), "Couldn't archive project");
    },
    [uid]
  );

  const unarchive = useCallback(
    (id: string) => {
      if (!uid) return;
      reportFailure(unarchiveProject(uid, id), "Couldn't restore project");
    },
    [uid]
  );

  return {
    projects,
    activeProjects,
    archivedProjects,
    loading: loading.projects,
    addProject,
    editProject,
    removeProject,
    archive,
    unarchive,
  };
}
