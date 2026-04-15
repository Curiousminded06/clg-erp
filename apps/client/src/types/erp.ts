export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  creditHours: number;
  semester: number;
  department: Department;
}

export interface Student {
  _id: string;
  enrollmentNo: string;
  semester: number;
  section: string;
  active: boolean;
  dob: string;
  phone?: string;
  address?: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  department: Department;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}
