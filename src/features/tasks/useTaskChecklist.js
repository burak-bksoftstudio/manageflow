import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { requireSupabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useOrganization } from '../organizations/OrganizationContext';
import { mapDatabaseChecklistItem, normalizeChecklistTitle } from './checklistUtils';

const checklistSelect = 'id, task_id, title, position, is_completed, completed_at, created_at';
const demoItemsByTask = new Map();

function getDemoItems(taskId) {
  return demoItemsByTask.get(taskId) || [];
}

export function useTaskChecklist(taskId) {
  const { isDemoMode, user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [items, setItems] = useState(() => isDemoMode ? getDemoItems(taskId) : []);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async (showLoading = true) => {
    if (isDemoMode) {
      const demoItems = getDemoItems(taskId);
      setItems(demoItems);
      setLoading(false);
      return { data: demoItems, error: null };
    }
    if (!activeOrganization || !user || !taskId) {
      setItems([]);
      setLoading(false);
      return { data: [], error: null };
    }
    if (showLoading) setLoading(true);
    setError(null);
    const client = requireSupabase();
    const { data, error: queryError } = await client
      .from('task_checklist_items')
      .select(checklistSelect)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (queryError) {
      setError(queryError);
      setLoading(false);
      return { data: null, error: queryError };
    }
    const mappedItems = (data || []).map(mapDatabaseChecklistItem);
    setItems(mappedItems);
    setLoading(false);
    return { data: mappedItems, error: null };
  }, [activeOrganization, isDemoMode, taskId, user]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(async titleValue => {
    const title = normalizeChecklistTitle(titleValue);
    const position = items.length ? Math.max(...items.map(item => item.position)) + 1 : 0;
    if (isDemoMode) {
      const item = {
        id: `checklist-${Date.now()}`, taskId, title, position, isCompleted: false,
        completedAt: '', createdAt: new Date().toISOString(),
      };
      const nextItems = [...items, item];
      demoItemsByTask.set(taskId, nextItems);
      setItems(nextItems);
      return { data: item, error: null };
    }
    const client = requireSupabase();
    const { data, error: insertError } = await client.from('task_checklist_items').insert({
      organization_id: activeOrganization.id,
      task_id: taskId,
      title,
      position,
      created_by: user.id,
    }).select(checklistSelect).single();
    if (insertError) return { data: null, error: insertError };
    const mappedItem = mapDatabaseChecklistItem(data);
    setItems(value => [...value, mappedItem]);
    return { data: mappedItem, error: null };
  }, [activeOrganization, isDemoMode, items, taskId, user]);

  const toggleItem = useCallback(async item => {
    if (isDemoMode) {
      const updatedItem = {
        ...item,
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date().toISOString() : '',
      };
      const nextItems = items.map(current => current.id === item.id ? updatedItem : current);
      demoItemsByTask.set(taskId, nextItems);
      setItems(nextItems);
      return { data: updatedItem, error: null };
    }
    const client = requireSupabase();
    const { data, error: updateError } = await client.from('task_checklist_items')
      .update({ is_completed: !item.isCompleted })
      .eq('id', item.id)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId)
      .select(checklistSelect)
      .single();
    if (updateError) return { data: null, error: updateError };
    const mappedItem = mapDatabaseChecklistItem(data);
    setItems(value => value.map(current => current.id === item.id ? mappedItem : current));
    return { data: mappedItem, error: null };
  }, [activeOrganization, isDemoMode, items, taskId]);

  const removeItem = useCallback(async itemId => {
    if (isDemoMode) {
      const nextItems = items.filter(item => item.id !== itemId);
      demoItemsByTask.set(taskId, nextItems);
      setItems(nextItems);
      return { error: null };
    }
    const client = requireSupabase();
    const { error: deleteError } = await client.from('task_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('organization_id', activeOrganization.id)
      .eq('task_id', taskId);
    if (deleteError) return { error: deleteError };
    setItems(value => value.filter(item => item.id !== itemId));
    return { error: null };
  }, [activeOrganization, isDemoMode, items, taskId]);

  return useMemo(() => ({
    addItem,
    error,
    items,
    loading,
    refresh: loadItems,
    removeItem,
    toggleItem,
  }), [addItem, error, items, loadItems, loading, removeItem, toggleItem]);
}
