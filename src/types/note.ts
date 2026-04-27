import { Timestamp } from 'firebase/firestore';

export interface FamilyNote {
  id: string;
  title: string;
  content: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  userId: string;
  coupleId: string;
  authorName: string;
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  imageUrl?: string | null;
  imagePath?: string | null;
  imageUrls?: string[] | null;
  imagePaths?: string[] | null;
}
