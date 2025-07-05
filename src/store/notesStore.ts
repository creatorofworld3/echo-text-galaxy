
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Folder } from '@/types/note';
import { supabase } from '@/integrations/supabase/client';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  tags: string[];
  isLoading: boolean;
  lastSync: Date | null;
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => Promise<void>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  syncNotes: () => Promise<void>;
  fetchNotes: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  searchNotes: (query: string) => Note[];
  setLoading: (loading: boolean) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],
      tags: [],
      isLoading: false,
      lastSync: null,
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      addNote: async (noteData) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
          .from('notes')
          .insert({
            ...noteData,
            user_id: userData.user.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const newNote: Note = {
          id: data.id,
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          isFavorite: data.is_favorite || false,
          folderId: data.folder_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        
        set((state) => ({
          notes: [newNote, ...state.notes],
          tags: Array.from(new Set([...state.tags, ...newNote.tags])),
        }));
      },
      
      updateNote: async (id, updates) => {
        const { error } = await supabase
          .from('notes')
          .update({
            title: updates.title,
            content: updates.content,
            tags: updates.tags,
            is_favorite: updates.isFavorite,
            folder_id: updates.folderId,
          })
          .eq('id', id);
        
        if (error) throw error;
        
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
          ),
          tags: Array.from(new Set([
            ...state.tags,
            ...(updates.tags || [])
          ])),
        }));
      },
      
      deleteNote: async (id) => {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },
      
      addFolder: async (folderData) => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
          .from('folders')
          .insert({
            ...folderData,
            user_id: userData.user.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const newFolder: Folder = {
          id: data.id,
          name: data.name,
          color: data.color,
          createdAt: new Date(data.created_at),
        };
        
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
      },
      
      updateFolder: async (id, updates) => {
        const { error } = await supabase
          .from('folders')
          .update(updates)
          .eq('id', id);
        
        if (error) throw error;
        
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...updates } : folder
          ),
        }));
      },
      
      deleteFolder: async (id) => {
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
        }));
      },
      
      fetchNotes: async () => {
        set({ isLoading: true });
        
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching notes:', error);
          set({ isLoading: false });
          return;
        }
        
        const notes: Note[] = data.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content || '',
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          folderId: item.folder_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }));
        
        const allTags = Array.from(
          new Set(notes.flatMap((note) => note.tags))
        );
        
        set({ 
          notes, 
          tags: allTags, 
          isLoading: false,
          lastSync: new Date()
        });
      },
      
      fetchFolders: async () => {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching folders:', error);
          return;
        }
        
        const folders: Folder[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          color: item.color,
          createdAt: new Date(item.created_at),
        }));
        
        set({ folders });
      },
      
      syncNotes: async () => {
        try {
          await get().fetchNotes();
          await get().fetchFolders();
        } catch (error) {
          console.error('Sync failed:', error);
          throw error;
        }
      },
      
      searchNotes: (query) => {
        const { notes } = get();
        return notes.filter(
          (note) =>
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase()) ||
            note.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase())
            )
        );
      },
    }),
    {
      name: 'notes-storage',
      partialize: (state) => ({ lastSync: state.lastSync }),
    }
  )
);
