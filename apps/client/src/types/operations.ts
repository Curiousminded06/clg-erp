import type { Course, Department, Student } from './erp';

export interface AttendanceRecord {
  _id: string;
  student: Pick<Student, '_id' | 'enrollmentNo' | 'semester' | 'section'>;
  course: Pick<Course, '_id' | 'title' | 'code'>;
  faculty: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface TimetableRecord {
  _id: string;
  department: Pick<Department, '_id' | 'name' | 'code'>;
  course: Pick<Course, '_id' | 'title' | 'code'>;
  faculty: {
    _id: string;
    fullName: string;
  };
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  room: string;
}

export interface ExamRecord {
  _id: string;
  department: Pick<Department, '_id' | 'name' | 'code'>;
  course: Pick<Course, '_id' | 'title' | 'code'>;
  examType: 'quiz' | 'midterm' | 'final' | 'practical';
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
}

export interface InvoiceRecord {
  _id: string;
  student: {
    _id: string;
    enrollmentNo: string;
    user: { fullName: string; email: string };
  };
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod: 'none' | 'card' | 'upi' | 'bank-transfer' | 'cash';
  paymentReference?: string;
}
