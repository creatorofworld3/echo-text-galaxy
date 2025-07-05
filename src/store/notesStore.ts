
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note } from '@/types/note';

interface NotesState {
  notes: Note[];
  tags: string[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTag: (tag: string) => void;
  searchNotes: (query: string) => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      tags: [],
      
      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
          tags: Array.from(new Set([...state.tags, ...note.tags])),
        })),
      
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates } : note
          ),
          tags: Array.from(new Set([
            ...state.tags, 
            ...(updates.tags || [])
          ])),
        })),
      
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      
      addTag: (tag) =>
        set((state) => ({
          tags: Array.from(new Set([...state.tags, tag])),
        })),
      
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
    }
  )
);
