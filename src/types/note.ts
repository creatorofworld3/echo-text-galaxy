
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}
