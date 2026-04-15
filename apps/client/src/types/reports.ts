export type ReportRole = 'admin' | 'faculty' | 'student';

export interface DashboardSummary {
  [key: string]: string | number;
}

export interface AtRiskStudent {
  id: string;
  enrollmentNo: string;
  fullName: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  attendanceRate: number;
  totalAttendance: number;
  overdueInvoices: number;
  pendingInvoices: number;
  outstandingAmount: number;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface DashboardResponse {
  role: ReportRole;
  title: string;
  summary: DashboardSummary;
  student?: {
    id: string;
    fullName: string;
    enrollmentNo: string;
    department: string;
    semester: number;
    section: string;
  };
  attendanceTrend?: Array<{ label: string; total: number; present: number }>;
  invoiceBreakdown?: Array<{ status: string; count: number; amount: number }>;
  atRiskStudents?: AtRiskStudent[];
  recentAttendance?: Array<{ id: string; date: string; course: string; student?: string; status: string }>;
  upcomingExams?: Array<{ id: string; date: string; examType: string; course: string; department?: string }>;
}

export interface SearchResults {
  users: Array<{ _id: string; fullName: string; email: string; role: ReportRole }>;
  departments: Array<{ _id: string; name: string; code: string; description: string }>;
  courses: Array<{ _id: string; title: string; code: string; semester: number; creditHours: number; department?: { name: string; code: string } }>;
  students: Array<{ _id: string; enrollmentNo: string; semester: number; section: string; active: boolean; user?: { fullName: string; email: string; role: ReportRole }; department?: { name: string; code: string } }>;
}