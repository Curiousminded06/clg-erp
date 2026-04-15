import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Course, Department, ListResponse, Student } from '../types/erp';
import type { AttendanceRecord, ExamRecord, InvoiceRecord, TimetableRecord } from '../types/operations';

type Tab = 'attendance' | 'timetable' | 'exams' | 'fees';

interface FacultyUser {
  id: string;
  fullName: string;
  email: string;
  role: 'faculty' | 'admin';
}

export function OperationsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('attendance');
  const role = user?.role ?? 'student';
  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';
  const showOpsTabs = isAdmin || isFaculty;

  if (role === 'student') {
    return (
      <main className="page">
        <section className="card erp-card">
          <p className="badge">PHASE 3</p>
          <h1>Operations and Workflow</h1>
          <p className="muted">Student accounts do not manage operations. Use Reports to see your own attendance, exams, and fee status.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card erp-card">
        <p className="badge">PHASE 3</p>
        <h1>Operations and Workflow</h1>
        <p>Manage attendance, timetable, exam scheduling, and fee invoices.</p>

        <div className="erp-tabs">
          <button className={tab === 'attendance' ? 'btn-primary' : 'ghost'} onClick={() => setTab('attendance')} type="button">
            Attendance
          </button>
          <button className={tab === 'timetable' ? 'btn-primary' : 'ghost'} onClick={() => setTab('timetable')} type="button">
            Timetable
          </button>
          <button className={tab === 'exams' ? 'btn-primary' : 'ghost'} onClick={() => setTab('exams')} type="button">
            Exams
          </button>
          {isAdmin ? (
            <button className={tab === 'fees' ? 'btn-primary' : 'ghost'} onClick={() => setTab('fees')} type="button">
              Fees
            </button>
          ) : null}
        </div>

        {showOpsTabs && tab === 'attendance' ? <AttendancePanel canMutate={isAdmin || isFaculty} isAdmin={isAdmin} /> : null}
        {showOpsTabs && tab === 'timetable' ? <TimetablePanel canMutate={isAdmin || isFaculty} isAdmin={isAdmin} /> : null}
        {showOpsTabs && tab === 'exams' ? <ExamPanel canMutate={isAdmin || isFaculty} /> : null}
        {isAdmin && tab === 'fees' ? <FeesPanel canMutate /> : null}
      </section>
    </main>
  );
}

function AttendancePanel({ canMutate, isAdmin }: { canMutate: boolean; isAdmin: boolean }) {
  const [items, setItems] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<FacultyUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [student, setStudent] = useState('');
  const [course, setCourse] = useState('');
  const [faculty, setFaculty] = useState('');
  const [status, setStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setError(null);

    try {
      const [attendanceRes, courseRes, studentRes] = await Promise.all([
        api.get<ListResponse<AttendanceRecord>>('/attendance', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Course>>('/courses', { params: { page: 1, limit: 50 } }),
        api.get<ListResponse<Student>>('/students', { params: { page: 1, limit: 50 } })
      ]);

      const facultyRes = isAdmin
        ? await api.get<{ success: boolean; data: FacultyUser[] }>('/faculty', { params: { page: 1, limit: 50 } })
        : null;

      setItems(attendanceRes.data.data);
      setCourses(courseRes.data.data);
      setStudents(studentRes.data.data);
      setFacultyUsers(facultyRes?.data.data ?? []);
      setFaculty((prev) => prev || facultyRes?.data.data[0]?.id || attendanceRes.data.data[0]?.faculty?._id || '');
      setStudent((prev) => prev || studentRes.data.data[0]?._id || '');
      setCourse((prev) => prev || courseRes.data.data[0]?._id || '');
    } catch {
      setError('Unable to load attendance data.');
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/attendance', { student, course, faculty, date, status });
      await load();
    } catch {
      setError('Failed to mark attendance.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Attendance</h2>
      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <select required value={student} onChange={(e) => setStudent(e.target.value)}>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.enrollmentNo} - {s.user?.fullName}</option>
            ))}
          </select>
          <select required value={course} onChange={(e) => setCourse(e.target.value)}>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
            ))}
          </select>
          {isAdmin ? (
            <select required value={faculty} onChange={(e) => setFaculty(e.target.value)}>
              {facultyUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} • {user.id}
                </option>
              ))}
            </select>
          ) : (
            <input required placeholder="Faculty user id" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          )}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value as 'present' | 'absent' | 'late')}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
          <button className="btn-primary" type="submit">Mark</button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr><th>Date</th><th>Student</th><th>Course</th><th>Status</th><th>Faculty</th><th>Faculty ID</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.student?.enrollmentNo}</td>
                <td>{item.course?.code}</td>
                <td>{item.status}</td>
                <td>{item.faculty?.fullName}</td>
                <td>{item.faculty?._id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimetablePanel({ canMutate, isAdmin }: { canMutate: boolean; isAdmin: boolean }) {
  const [items, setItems] = useState<TimetableRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<FacultyUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [faculty, setFaculty] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('A-101');

  const load = useCallback(async () => {
    setError(null);

    try {
      const [ttRes, depRes, courseRes] = await Promise.all([
        api.get<ListResponse<TimetableRecord>>('/timetables', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 50 } }),
        api.get<ListResponse<Course>>('/courses', { params: { page: 1, limit: 50 } })
      ]);

      const facultyRes = isAdmin
        ? await api.get<{ success: boolean; data: FacultyUser[] }>('/faculty', { params: { page: 1, limit: 50 } })
        : null;

      setItems(ttRes.data.data);
      setDepartments(depRes.data.data);
      setCourses(courseRes.data.data);
      setFacultyUsers(facultyRes?.data.data ?? []);
      setDepartment((prev) => prev || depRes.data.data[0]?._id || '');
      setCourse((prev) => prev || courseRes.data.data[0]?._id || '');
      setFaculty((prev) => prev || facultyRes?.data.data[0]?.id || ttRes.data.data[0]?.faculty?._id || '');
    } catch {
      setError('Unable to load timetable data.');
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/timetables', {
        department,
        course,
        faculty,
        dayOfWeek,
        startTime,
        endTime,
        room
      });
      await load();
    } catch {
      setError('Failed to create timetable entry.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Timetable</h2>
      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <select required value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select required value={course} onChange={(e) => setCourse(e.target.value)}>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.code}</option>)}
          </select>
          {isAdmin ? (
            <select required value={faculty} onChange={(e) => setFaculty(e.target.value)}>
              {facultyUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} • {user.id}
                </option>
              ))}
            </select>
          ) : (
            <input required placeholder="Faculty user id" value={faculty} onChange={(e) => setFaculty(e.target.value)} />
          )}
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as typeof dayOfWeek)}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <input value={room} onChange={(e) => setRoom(e.target.value)} />
          <button className="btn-primary" type="submit">Add</button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr><th>Day</th><th>Time</th><th>Room</th><th>Course</th><th>Department</th><th>Faculty</th><th>Faculty ID</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.dayOfWeek}</td>
                <td>{item.startTime} - {item.endTime}</td>
                <td>{item.room}</td>
                <td>{item.course?.code}</td>
                <td>{item.department?.name}</td>
                <td>{item.faculty?.fullName}</td>
                <td>{item.faculty?._id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExamPanel({ canMutate }: { canMutate: boolean }) {
  const [items, setItems] = useState<ExamRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [examType, setExamType] = useState<'quiz' | 'midterm' | 'final' | 'practical'>('quiz');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [maxMarks, setMaxMarks] = useState(100);

  const load = useCallback(async () => {
    setError(null);

    try {
      const [examRes, depRes, courseRes] = await Promise.all([
        api.get<ListResponse<ExamRecord>>('/exams', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 50 } }),
        api.get<ListResponse<Course>>('/courses', { params: { page: 1, limit: 50 } })
      ]);

      setItems(examRes.data.data);
      setDepartments(depRes.data.data);
      setCourses(courseRes.data.data);
      setDepartment((prev) => prev || depRes.data.data[0]?._id || '');
      setCourse((prev) => prev || courseRes.data.data[0]?._id || '');
    } catch {
      setError('Unable to load exam data.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/exams', { department, course, examType, date, startTime, endTime, maxMarks });
      await load();
    } catch {
      setError('Failed to create exam schedule.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Exam Scheduling</h2>
      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <select required value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select required value={course} onChange={(e) => setCourse(e.target.value)}>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.code}</option>)}
          </select>
          <select value={examType} onChange={(e) => setExamType(e.target.value as typeof examType)}>
            {['quiz', 'midterm', 'final', 'practical'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} />
          <button className="btn-primary" type="submit">Schedule</button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Course</th><th>Time</th><th>Marks</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.examType}</td>
                <td>{item.course?.code}</td>
                <td>{item.startTime} - {item.endTime}</td>
                <td>{item.maxMarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FeesPanel({ canMutate }: { canMutate: boolean }) {
  const [items, setItems] = useState<InvoiceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState('');

  const [student, setStudent] = useState('');
  const [title, setTitle] = useState('Semester Fee');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setError(null);

    try {
      const [invoiceRes, studentRes] = await Promise.all([
        api.get<ListResponse<InvoiceRecord>>('/invoices', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Student>>('/students', { params: { page: 1, limit: 50 } })
      ]);

      setItems(invoiceRes.data.data);
      setStudents(studentRes.data.data);
      setStudent((prev) => prev || studentRes.data.data[0]?._id || '');
    } catch {
      setError('Unable to load fee invoices.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += item.amount;
        if (item.status === 'paid') acc.paid += item.amount;
        return acc;
      },
      { total: 0, paid: 0 }
    );
  }, [items]);

  async function updateInvoiceStatus(invoiceId: string, status: InvoiceRecord['status']) {
    setError(null);
    setSavingId(invoiceId);

    try {
      const current = items.find((item) => item._id === invoiceId);

      await api.patch(`/invoices/${invoiceId}`, {
        status,
        paymentMethod: status === 'paid' ? (current?.paymentMethod ?? 'cash') : 'none',
        paymentReference: status === 'paid' ? current?.paymentReference ?? '' : ''
      });

      await load();
    } catch {
      setError('Failed to update payment status.');
    } finally {
      setSavingId('');
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/invoices', { student, title, amount, dueDate });
      await load();
    } catch {
      setError('Failed to create invoice.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Fee Invoices</h2>
      <p className="muted">Total billed: {totals.total} | Total paid: {totals.paid}</p>

      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <select required value={student} onChange={(e) => setStudent(e.target.value)}>
            {students.map((s) => <option key={s._id} value={s._id}>{s.enrollmentNo} - {s.user?.fullName}</option>)}
          </select>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button className="btn-primary" type="submit">Create</button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr><th>Student</th><th>Title</th><th>Amount</th><th>Status</th><th>Due</th><th>Payment</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.student?.enrollmentNo}</td>
                <td>{item.title}</td>
                <td>{item.amount}</td>
                <td>{item.status}</td>
                <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                <td>
                  {canMutate ? (
                    <div className="inline-form" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <select
                        defaultValue={item.status}
                        onChange={(e) => void updateInvoiceStatus(item._id, e.target.value as InvoiceRecord['status'])}
                        disabled={savingId === item._id}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <span className="muted">
                        {savingId === item._id ? 'Saving...' : item.status === 'paid' ? 'Completed' : 'Update status'}
                      </span>
                    </div>
                  ) : (
                    <span className="muted">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
