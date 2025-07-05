
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Download, FileText, Hash, Star, StarOff, ArrowLeft } from 'lucide-react';
import { useNotesStore } from '@/store/notesStore';
import { useToast } from '@/hooks/use-toast';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onClose }) => {
  const { notes, addNote, updateNote } = useNotesStore();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Track if content has changed to prevent unnecessary saves
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentNote = noteId ? notes.find(n => n.id === noteId) : null;

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setTags(currentNote.tags);
      setIsFavorite(currentNote.isFavorite);
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setIsFavorite(false);
      setHasUnsavedChanges(false);
    }
  }, [currentNote]);

  // Mark content as changed when user types
  useEffect(() => {
    if (currentNote) {
      const hasChanges = 
        title !== currentNote.title ||
        content !== currentNote.content ||
        JSON.stringify(tags) !== JSON.stringify(currentNote.tags) ||
        isFavorite !== currentNote.isFavorite;
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, tags, isFavorite, currentNote]);

  // Auto-save with debouncing to prevent infinite loops
  useEffect(() => {
    if (hasUnsavedChanges && !saving) {
      // Clear previous timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (title.trim() || content.trim()) {
          handleSave(false);
        }
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, saving, title, content]);

  const handleSave = useCallback(async (showToast = true) => {
    if (!title.trim() && !content.trim()) return;
    if (saving) return; // Prevent multiple simultaneous saves

    setSaving(true);
    try {
      const noteData = {
        title: title || 'Untitled Note',
        content,
        tags,
        isFavorite,
      };

      if (currentNote) {
        await updateNote(currentNote.id, noteData);
      } else {
        await addNote(noteData);
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (showToast) {
        toast({
          title: "Note Saved",
          description: "Your note has been saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [title, content, tags, isFavorite, currentNote, addNote, updateNote, toast, saving]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const tagToAdd = newTag.trim();
      setTags([...tags, tagToAdd]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleExport = (format: 'md' | 'txt' | 'pdf') => {
    const fileName = `${title || 'note'}.${format}`;
    let exportContent = content;
    
    if (format === 'md') {
      exportContent = `# ${title}\n\n${content}`;
    }
    
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Note Exported",
      description: `Note exported as ${format.toUpperCase()} successfully.`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium border-none shadow-none focus-visible:ring-0 px-0"
            style={{ fontSize: '1.125rem' }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFavorite(!isFavorite)}
            className={isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}
          >
            {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500">
              Unsaved changes
            </span>
          )}
          {lastSaved && !hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={() => handleSave()} size="sm" className="gap-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('md')}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1"
            />
            <Button onClick={handleAddTag} size="sm" variant="outline">
              <Hash className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <Textarea
          placeholder="Start writing your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-base leading-relaxed"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
};
