import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { mapDatabaseTaskComment, normalizeTaskComment } from './commentUtils';

const commentSelect = 'id, task_id, body, author_id, edited_at, created_at, updated_at';
const demoCommentsByTask = new Map();

function getDemoComments(taskId) {
  return demoCommentsByTask.get(taskId) || [];
}

export function useTaskComments(taskId) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const currentUserId = user?.id || (isDemoMode ? 'demo-user' : '');
  const [comments, setComments] = useState(() => isDemoMode ? getDemoComments(taskId) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async (showLoading = true) => {
    if (isDemoMode) {
      const demoComments = getDemoComments(taskId);
      setComments(demoComments);
      setLoading(false);
      return { data: demoComments, error: null };
    }
    if (!activeOrganization || !user || !taskId) {
      setComments([]);
      setLoading(false);
      return { data: [], error: null };
    }
    if (showLoading) setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data: commentRows, error: commentError } = await client
      .from('task_comments')
      .select(commentSelect)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (commentError) {
      setError(commentError);
      setLoading(false);
      return { data: null, error: commentError };
    }

    const authorIds = [...new Set((commentRows || []).map(comment => comment.author_id))];
    const profileResult = authorIds.length
      ? await client.from('profiles').select('id, full_name, email').in('id', authorIds)
      : { data: [], error: null };
    if (profileResult.error) {
      setError(profileResult.error);
      setLoading(false);
      return { data: null, error: profileResult.error };
    }

    const profilesById = new Map(profileResult.data.map(profile => [profile.id, profile]));
    const mappedComments = (commentRows || []).map(comment => mapDatabaseTaskComment(comment, profilesById));
    setComments(mappedComments);
    setLoading(false);
    return { data: mappedComments, error: null };
  }, [activeOrganization, isDemoMode, taskId, user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(async bodyValue => {
    const body = normalizeTaskComment(bodyValue);
    const now = new Date().toISOString();
    const profile = {
      full_name: user?.user_metadata?.full_name || (isDemoMode ? 'Burak Kiriş' : ''),
      email: user?.email || '',
    };
    if (isDemoMode) {
      const comment = mapDatabaseTaskComment({
        id: `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        task_id: taskId,
        body,
        author_id: currentUserId,
        edited_at: null,
        created_at: now,
        updated_at: now,
      }, new Map([[currentUserId, profile]]));
      const nextComments = [...comments, comment];
      demoCommentsByTask.set(taskId, nextComments);
      setComments(nextComments);
      return { data: comment, error: null };
    }
    const client = requireSupabase();
    const { data, error: insertError } = await client.from('task_comments').insert({
      organization_id: activeOrganization.id,
      task_id: taskId,
      body,
      author_id: user.id,
    }).select(commentSelect).single();
    if (insertError) return { data: null, error: insertError };
    const mappedComment = mapDatabaseTaskComment(data, new Map([[user.id, profile]]));
    setComments(value => [...value, mappedComment]);
    return { data: mappedComment, error: null };
  }, [activeOrganization, comments, currentUserId, isDemoMode, taskId, user]);

  const updateComment = useCallback(async (commentId, bodyValue) => {
    const body = normalizeTaskComment(bodyValue);
    const currentComment = comments.find(comment => comment.id === commentId);
    if (isDemoMode) {
      const updatedComment = {
        ...currentComment, body, editedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const nextComments = comments.map(comment => comment.id === commentId ? updatedComment : comment);
      demoCommentsByTask.set(taskId, nextComments);
      setComments(nextComments);
      return { data: updatedComment, error: null };
    }
    const client = requireSupabase();
    const { data, error: updateError } = await client.from('task_comments')
      .update({ body })
      .eq('id', commentId)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .select(commentSelect)
      .single();
    if (updateError) return { data: null, error: updateError };
    const updatedComment = {
      ...currentComment,
      body: data.body,
      editedAt: data.edited_at || '',
      updatedAt: data.updated_at,
    };
    setComments(value => value.map(comment => comment.id === commentId ? updatedComment : comment));
    return { data: updatedComment, error: null };
  }, [activeOrganization, comments, isDemoMode, taskId]);

  const removeComment = useCallback(async commentId => {
    if (isDemoMode) {
      const nextComments = comments.filter(comment => comment.id !== commentId);
      demoCommentsByTask.set(taskId, nextComments);
      setComments(nextComments);
      return { error: null };
    }
    const client = requireSupabase();
    const { error: deleteError } = await client.from('task_comments')
      .delete()
      .eq('id', commentId)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .select('id')
      .single();
    if (deleteError) return { error: deleteError };
    setComments(value => value.filter(comment => comment.id !== commentId));
    return { error: null };
  }, [activeOrganization, comments, isDemoMode, taskId]);

  return useMemo(() => ({
    addComment,
    comments,
    currentUserId,
    error,
    loading,
    refresh: loadComments,
    removeComment,
    updateComment,
  }), [addComment, comments, currentUserId, error, loadComments, loading, removeComment, updateComment]);
}
