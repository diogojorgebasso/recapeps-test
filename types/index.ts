export interface Subject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  totalChapters: number;
  chaptersRead: number;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  position: number;
}

export interface UserStreak {
  currentStreak: number;
  lastCompletionDate: string;
  longestStreak: number;
}
