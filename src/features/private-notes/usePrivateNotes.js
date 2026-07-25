import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { requireSupabase } from '../../lib/supabase';

const starterBlocks = () => [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }];

export function usePrivateNotes() {
  const { isDemoMode, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(!isDemoMode);
  const [error, setError] = useState(null);
  const storageKey = `manageflow-private-notes-${user?.id || 'demo'}`;

  const load = useCallback(async () => {
    if (isDemoMode) {
      try { setNotes(JSON.parse(localStorage.getItem(storageKey)) || []); } catch { setNotes([]); }
      setLoading(false);
      return;
    }
    if (!user) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: queryError } = await requireSupabase().from('private_notes')
      .select('*').is('archived_at', null).order('is_favorite', { ascending: false }).order('updated_at', { ascending: false });
    setError(queryError);
    if (!queryError) setNotes((data || []).map(note => ({
      id: note.id, title: note.title, icon: note.icon, color: note.color, blocks: note.blocks,
      isFavorite: note.is_favorite, updatedAt: note.updated_at,
    })));
    setLoading(false);
  }, [isDemoMode, storageKey, user]);

  useEffect(() => { load(); }, [load]);

  const persistDemo = value => {
    setNotes(value);
    localStorage.setItem(storageKey, JSON.stringify(value));
  };

  const createNote = useCallback(async () => {
    const draft = {
      title: 'Başlıksız not', icon: '📝', color: '#5b5ce2', blocks: starterBlocks(), isFavorite: false,
    };
    if (isDemoMode) {
      const note = { ...draft, id: `note-${Date.now()}`, updatedAt: new Date().toISOString() };
      persistDemo([note, ...notes]);
      return { data: note, error: null };
    }
    const { data, error: createError } = await requireSupabase().from('private_notes').insert({
      user_id: user.id, title: draft.title, icon: draft.icon, color: draft.color, blocks: draft.blocks,
    }).select('*').single();
    if (createError) return { data: null, error: createError };
    const note = { id: data.id, title: data.title, icon: data.icon, color: data.color, blocks: data.blocks, isFavorite: false, updatedAt: data.updated_at };
    setNotes(value => [note, ...value]);
    return { data: note, error: null };
  }, [isDemoMode, notes, storageKey, user]);

  const updateNote = useCallback(async (id, patch) => {
    const updatedAt = new Date().toISOString();
    setNotes(value => value.map(note => note.id === id ? { ...note, ...patch, updatedAt } : note));
    if (isDemoMode) {
      const next = notes.map(note => note.id === id ? { ...note, ...patch, updatedAt } : note);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return { error: null };
    }
    const databasePatch = {};
    if (patch.title !== undefined) databasePatch.title = patch.title || 'Başlıksız not';
    if (patch.icon !== undefined) databasePatch.icon = patch.icon;
    if (patch.color !== undefined) databasePatch.color = patch.color;
    if (patch.blocks !== undefined) databasePatch.blocks = patch.blocks;
    if (patch.isFavorite !== undefined) databasePatch.is_favorite = patch.isFavorite;
    const { error: updateError } = await requireSupabase().from('private_notes').update(databasePatch).eq('id', id);
    if (updateError) { setError(updateError); await load(); }
    return { error: updateError };
  }, [isDemoMode, load, notes, storageKey]);

  const archiveNote = useCallback(async id => {
    if (isDemoMode) {
      persistDemo(notes.filter(note => note.id !== id));
      return { error: null };
    }
    const { error: archiveError } = await requireSupabase().from('private_notes')
      .update({ archived_at: new Date().toISOString() }).eq('id', id);
    if (!archiveError) setNotes(value => value.filter(note => note.id !== id));
    return { error: archiveError };
  }, [isDemoMode, notes, storageKey]);

  return useMemo(() => ({
    archiveNote, createNote, error, loading, notes, refresh: load, updateNote,
  }), [archiveNote, createNote, error, load, loading, notes, updateNote]);
}
