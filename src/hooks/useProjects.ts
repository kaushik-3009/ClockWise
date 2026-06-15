import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import {
  getAllProjects,
  getActiveProjects,
  getArchivedProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
} from '@/db/queries/projects';
import type { Project, ProjectColor } from '@/types';

export function useProjects() {
  const projects = useLiveQuery(getAllProjects, []);
  const activeProjects = useLiveQuery(getActiveProjects, []);
  const archivedProjects = useLiveQuery(getArchivedProjects, []);

  const addProject = useCallback(
    async (data: { name: string; description?: string; color: ProjectColor }) => {
      return createProject(data);
    },
    []
  );

  const editProject = useCallback(async (id: string, changes: Partial<Omit<Project, 'id'>>) => {
    await updateProject(id, changes);
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await deleteProject(id);
  }, []);

  const archive = useCallback(async (id: string) => {
    await archiveProject(id);
  }, []);

  const unarchive = useCallback(async (id: string) => {
    await unarchiveProject(id);
  }, []);

  return {
    projects: projects ?? [],
    activeProjects: activeProjects ?? [],
    archivedProjects: archivedProjects ?? [],
    addProject,
    editProject,
    removeProject,
    archive,
    unarchive,
    getProjectById,
  };
}
