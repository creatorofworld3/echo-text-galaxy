
import React, { useState } from 'react';
import { NotesList } from '@/components/NotesList';
import { NoteEditor } from '@/components/NoteEditor';
import { AuthPage } from '@/components/AuthPage';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Cloud, Zap } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { theme } = useTheme();
  const { user, loading } = useAuth();

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setShowEditor(true);
  };

  const handleCreateNote = () => {
    setSelectedNoteId(null);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedNoteId(null);
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Notepad Storer
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 dark:text-green-300 font-medium">Auto-save Active</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Synced</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Welcome, {user.user_metadata?.full_name || user.email}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <SettingsDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Notes List */}
        <div className={`${showEditor ? 'hidden lg:block' : 'block'} w-full lg:w-80 border-r bg-muted/30`}>
          <NotesList
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            selectedNoteId={selectedNoteId}
          />
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {showEditor ? (
            <NoteEditor
              noteId={selectedNoteId}
              onClose={handleCloseEditor}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="mb-6">
                  <BookOpen className="h-16 w-16 mx-auto text-primary/60 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Welcome to Notepad Storer</h2>
                  <p className="text-muted-foreground text-lg">
                    Your intelligent note-taking companion with cloud sync
                  </p>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Auto-save every 30 seconds</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time sync across devices</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Smart tagging and organization</span>
                  </div>
                </div>

                <Button onClick={handleCreateNote} size="lg" className="gap-2">
                  <BookOpen className="h-5 w-5" />
                  Create Your First Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
