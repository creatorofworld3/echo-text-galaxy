
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Star, StarOff } from 'lucide-react';
import { Note } from '@/types/note';
import { useNotesStore } from '@/store/notesStore';
import { useToast } from '@/hooks/use-toast';

interface NoteContextMenuProps {
  note: Note;
  children: React.ReactNode;
  onEdit: (noteId: string) => void;
}

export const NoteContextMenu: React.FC<NoteContextMenuProps> = ({ 
  note, 
  children, 
  onEdit 
}) => {
  const { updateNote, deleteNote } = useNotesStore();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const handleToggleFavorite = async () => {
    try {
      await updateNote(note.id, { isFavorite: !note.isFavorite });
      toast({
        title: note.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `"${note.title}" has been ${note.isFavorite ? 'removed from' : 'added to'} favorites.`,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNote(note.id);
      toast({
        title: "Note Deleted",
        description: `"${note.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem 
            onClick={() => onEdit(note.id)}
            className="gap-2 cursor-pointer"
          >
            <Edit className="h-4 w-4" />
            Edit Note
          </ContextMenuItem>
          
          <ContextMenuItem 
            onClick={handleToggleFavorite}
            className="gap-2 cursor-pointer"
          >
            {note.isFavorite ? (
              <>
                <StarOff className="h-4 w-4" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="h-4 w-4" />
                Add to Favorites
              </>
            )}
          </ContextMenuItem>
          
          <ContextMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Note
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
