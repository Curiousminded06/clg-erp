import type { Course } from './erp';

export interface ChatMessageRecord {
  _id: string;
  course: string;
  sender: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  content: string;
  timestamp: string;
}

export interface ChatCourseListResponse {
  success: boolean;
  data: Course[];
}

export interface ChatHistoryResponse {
  success: boolean;
  data: ChatMessageRecord[];
}
