
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Download, Upload, FileText, Hash, Star, StarOff } from 'lucide-react';
import { useNotesStore } from '@/store/notesStore';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onClose }) => {
  const { notes, addNote, updateNote, addTag } = useNotesStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentNote = noteId ? notes.find(n => n.id === noteId) : null;

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setTags(currentNote.tags);
      setIsFavorite(currentNote.isFavorite);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setIsFavorite(false);
    }
  }, [currentNote]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (title.trim() || content.trim()) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [title, content, tags, isFavorite]);

  const handleSave = useCallback(() => {
    if (!title.trim() && !content.trim()) return;

    const noteData = {
      title: title || 'Untitled Note',
      content,
      tags,
      isFavorite,
      updatedAt: new Date(),
    };

    if (currentNote) {
      updateNote(currentNote.id, noteData);
    } else {
      const newNote = {
        ...noteData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      addNote(newNote);
    }
    
    setLastSaved(new Date());
  }, [title, content, tags, isFavorite, currentNote, addNote, updateNote]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const tagToAdd = newTag.trim();
      setTags([...tags, tagToAdd]);
      addTag(tagToAdd);
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
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
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
          {lastSaved && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={handleSave} size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save
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
