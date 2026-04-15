import type { Department, PaginationMeta } from './erp';

export interface NoticeRecord {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'students' | 'faculty';
  department?: Pick<Department, '_id' | 'name' | 'code'> | null;
  expiresAt?: string | null;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface CampusUpdateRecord {
  _id: string;
  type: 'event' | 'achievement';
  title: string;
  description: string;
  date: string;
  location?: string;
  createdBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export interface NoticeListResponse {
  success: boolean;
  data: NoticeRecord[];
  pagination: PaginationMeta;
}

export interface CampusUpdateListResponse {
  success: boolean;
  data: CampusUpdateRecord[];
  pagination: PaginationMeta;
}
