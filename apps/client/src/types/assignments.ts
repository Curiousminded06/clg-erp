import type { Course, Department, PaginationMeta, Student } from './erp';

export interface AssignmentRecord {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  department: Pick<Department, '_id' | 'name' | 'code'>;
  course: Pick<Course, '_id' | 'title' | 'code' | 'semester'>;
  faculty: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface AssignmentSubmissionRecord {
  _id: string;
  assignment: AssignmentRecord;
  student: Pick<Student, '_id' | 'enrollmentNo' | 'semester' | 'section'> & {
    user: { fullName: string; email: string };
  };
  content: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade: number | null;
  feedback?: string;
  gradedBy?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  gradedAt?: string | null;
}

export interface AssignmentListResponse {
  success: boolean;
  data: AssignmentRecord[];
  pagination: PaginationMeta;
}

export interface AssignmentSubmissionListResponse {
  success: boolean;
  data: AssignmentSubmissionRecord[];
  pagination?: PaginationMeta;
}
