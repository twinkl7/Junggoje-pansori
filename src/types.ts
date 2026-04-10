export type ProjectType = "Upcoming" | "Past";

export interface StudentProject {
  id?: string;
  title: string;
  description: string;
  type: ProjectType;
  contentUrl: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  sourceMaterialUrl?: string;
  sourceMaterialTitle?: string;
  hashtags?: string[];
  performanceDate?: string;
  performanceLocation?: string;
  locationMapUrl?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'teacher' | 'admin';
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
