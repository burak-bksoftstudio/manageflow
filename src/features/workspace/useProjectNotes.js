import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { initialProjects } from '../../data/demo';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { getCommentAuthorName } from '../tasks/commentUtils';
import { mapDatabaseProject, mapDemoProject } from '../projects/projectUtils';
import { mapDatabaseProjectNote, normalizeProjectNoteForm } from './workspaceUtils';

const noteSelect = 'id, organization_id, project_id, author_id, title, content, created_at, updated_at';
const projectSelect = 'id, name, description, status, progress, client_id, start_date, due_date, archived_at, archived_by, created_at';
const demoNotes = [];

export function useProjectNotes() {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const currentUserId = user?.id || (isDemoMode ? 'demo-user' : '');
  const [notes, setNotes] = useState(demoNotes);
  const [projects, setProjects] = useState(() => isDemoMode ? initialProjects.map(project => mapDemoProject(project, [])) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadWorkspace = useCallback(async (showLoading = true) => {
    if (isDemoMode) {
      setLoading(false);
      return { data: notes, error: null };
    }
    if (!activeOrganization || !user) {
      setNotes([]);
      setProjects([]);
      setLoading(false);
      return { data: [], error: null };
    }
    if (showLoading) setLoading(true);
    setError(null);
    const client = requireSupabase();
    const [noteResult, projectResult] = await Promise.all([
      client.from('project_notes').select(noteSelect)
        .eq('organization_id', activeOrganization.id)
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false }),
      client.from('projects').select(projectSelect)
        .eq('organization_id', activeOrganization.id)
        .order('name'),
    ]);
    const queryError = noteResult.error || projectResult.error;
    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }

    const authorIds = [...new Set((noteResult.data || []).map(note => note.author_id))];
    const profileResult = authorIds.length
      ? await client.from('profiles').select('id, full_name, email').in('id', authorIds)
      : { data: [], error: null };
    if (profileResult.error) {
      setError(profileResult.error);
      setLoading(false);
      return { data: null, error: profileResult.error };
    }

    const mappedProjects = (projectResult.data || []).map(project => mapDatabaseProject({ ...project, client: null }));
    const projectsById = new Map(projectResult.data.map(project => [project.id, project]));
    const profilesById = new Map(profileResult.data.map(profile => [profile.id, profile]));
    const mappedNotes = (noteResult.data || []).map(note => mapDatabaseProjectNote(note, projectsById, profilesById));
    setProjects(mappedProjects);
    setNotes(mappedNotes);
    setLoading(false);
    return { data: mappedNotes, error: null };
  }, [activeOrganization, isDemoMode, notes, user]);

  useEffect(() => {
    loadWorkspace();
  // Demo state is intentionally kept in memory during the session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization?.id, isDemoMode, user?.id]);

  const createNoteRecord = useCallback(async form => {
    const normalized = normalizeProjectNoteForm(form);
    const project = projects.find(item => item.id === normalized.projectId);
    const now = new Date().toISOString();
    const profile = {
      email: user?.email || '',
      full_name: user?.user_metadata?.full_name || (isDemoMode ? 'Burak Kiriş' : ''),
    };
    if (isDemoMode) {
      const record = {
        authorId: currentUserId,
        authorInitials: 'BK',
        authorName: getCommentAuthorName(profile),
        content: normalized.content,
        createdAt: now,
        id: `project-note-${Date.now()}`,
        projectArchived: false,
        projectId: normalized.projectId,
        projectName: project?.name || 'Bağımsız not',
        title: normalized.title,
        updatedAt: now,
      };
      setNotes(value => [record, ...value]);
      return { data: record, error: null };
    }

    const client = requireSupabase();
    const { data, error: createError } = await client.from('project_notes').insert({
      author_id: user.id,
      content: normalized.content,
      organization_id: activeOrganization.id,
      project_id: normalized.projectId || null,
      title: normalized.title,
    }).select(noteSelect).single();
    if (createError) return { data: null, error: createError };
    const mappedProjects = project
      ? new Map([[project.id, { name: project.name, archived_at: project.archivedAt || null }]])
      : new Map();
    const mapped = mapDatabaseProjectNote(data, mappedProjects, new Map([[user.id, profile]]));
    setNotes(value => [mapped, ...value]);
    return { data: mapped, error: null };
  }, [activeOrganization, currentUserId, isDemoMode, projects, user]);

  const updateNoteRecord = useCallback(async (noteId, form) => {
    const normalized = normalizeProjectNoteForm(form);
    const currentNote = notes.find(note => note.id === noteId);
    if (!currentNote) return { data: null, error: new Error('Project note not found') };
    if (isDemoMode) {
      const updated = { ...currentNote, title: normalized.title, content: normalized.content, updatedAt: new Date().toISOString() };
      setNotes(value => value.map(note => note.id === noteId ? updated : note));
      return { data: updated, error: null };
    }

    const client = requireSupabase();
    const { data, error: updateError } = await client.from('project_notes')
      .update({ content: normalized.content, title: normalized.title })
      .eq('id', noteId)
      .eq('organization_id', activeOrganization.id)
      .select(noteSelect)
      .single();
    if (updateError) return { data: null, error: updateError };
    const updated = { ...currentNote, content: data.content, title: data.title, updatedAt: data.updated_at };
    setNotes(value => [updated, ...value.filter(note => note.id !== noteId)]);
    return { data: updated, error: null };
  }, [activeOrganization, isDemoMode, notes]);

  return useMemo(() => ({
    createNote: createNoteRecord,
    currentUserId,
    error,
    loading,
    notes,
    projects,
    refresh: loadWorkspace,
    updateNote: updateNoteRecord,
  }), [createNoteRecord, currentUserId, error, loadWorkspace, loading, notes, projects, updateNoteRecord]);
}
