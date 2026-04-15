import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { Course, Department, ListResponse, Student } from '../types/erp';

type Tab = 'departments' | 'courses' | 'students' | 'faculty';

interface FacultyUser {
  id: string;
  fullName: string;
  email: string;
  role: 'faculty';
}

export function ErpManagementPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('departments');

  if (user?.role === 'student') {
    return (
      <main className="page">
        <section className="card erp-card">
          <p className="badge">PHASE 2</p>
          <h1>Academic ERP Modules</h1>
          <p className="muted">Student accounts can view academic progress from Reports, but cannot access module management tabs.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card erp-card">
        <p className="badge">PHASE 2</p>
        <h1>Academic ERP Modules</h1>
        <p>Manage departments, courses, and students with role-based actions.</p>

        <div className="erp-tabs">
          <button className={tab === 'departments' ? 'btn-primary' : 'ghost'} onClick={() => setTab('departments')} type="button">
            Departments
          </button>
          <button className={tab === 'courses' ? 'btn-primary' : 'ghost'} onClick={() => setTab('courses')} type="button">
            Courses
          </button>
          <button className={tab === 'students' ? 'btn-primary' : 'ghost'} onClick={() => setTab('students')} type="button">
            Students
          </button>
          {user?.role === 'admin' ? (
            <button className={tab === 'faculty' ? 'btn-primary' : 'ghost'} onClick={() => setTab('faculty')} type="button">
              Faculty
            </button>
          ) : null}
        </div>

        {tab === 'departments' ? <DepartmentPanel canMutate={user?.role === 'admin'} /> : null}
        {tab === 'courses' ? (
          <CoursePanel canMutate={user?.role === 'admin' || user?.role === 'faculty'} />
        ) : null}
        {tab === 'students' ? (
          <StudentPanel canMutate={user?.role === 'admin' || user?.role === 'faculty'} />
        ) : null}
        {tab === 'faculty' && user?.role === 'admin' ? <FacultyPanel /> : null}
      </section>
    </main>
  );
}

function FacultyPanel() {
  const [items, setItems] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<{ success: boolean; data: FacultyUser[] }>('/faculty', {
        params: { page: 1, limit: 25 }
      });

      setItems(data.data);
    } catch {
      setError('Unable to load faculty records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/faculty', { fullName, email, password });
      setFullName('');
      setEmail('');
      setPassword('');
      await load();
    } catch {
      setError('Failed to create faculty account.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Faculty</h2>
      <p className="muted">Faculty accounts are created by admin and identified by their MongoDB user id.</p>

      <form className="inline-form" onSubmit={onCreate}>
        <input onChange={(e) => setFullName(e.target.value)} placeholder="Faculty name" required value={fullName} />
        <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" required type="email" value={email} />
        <input
          autoComplete="new-password"
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password"
          required
          type="password"
          value={password}
        />
        <button className="btn-primary" type="submit">Add</button>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.fullName}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DepartmentPanel({ canMutate }: { canMutate: boolean }) {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<ListResponse<Department>>('/departments', {
        params: { page: 1, limit: 25 }
      });
      setItems(data.data);
    } catch {
      setError('Unable to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/departments', { name, code, description });
      setName('');
      setCode('');
      setDescription('');
      await load();
    } catch {
      setError('Failed to create department.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Departments</h2>

      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <input onChange={(e) => setName(e.target.value)} placeholder="Department name" required value={name} />
          <input onChange={(e) => setCode(e.target.value)} placeholder="Code" required value={code} />
          <input onChange={(e) => setDescription(e.target.value)} placeholder="Description" value={description} />
          <button className="btn-primary" type="submit">
            Add
          </button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{item.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CoursePanel({ canMutate }: { canMutate: boolean }) {
  const [items, setItems] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [creditHours, setCreditHours] = useState(3);
  const [semester, setSemester] = useState(1);
  const [department, setDepartment] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [courseRes, depRes] = await Promise.all([
        api.get<ListResponse<Course>>('/courses', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 50 } })
      ]);

      setItems(courseRes.data.data);
      setDepartments(depRes.data.data);
      if (!department && depRes.data.data[0]) {
        setDepartment(depRes.data.data[0]._id);
      }
    } catch {
      setError('Unable to load courses.');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/courses', {
        title,
        code,
        creditHours,
        semester,
        department
      });
      setTitle('');
      setCode('');
      await load();
    } catch {
      setError('Failed to create course.');
    }
  }

  return (
    <section className="erp-panel">
      <h2>Courses</h2>

      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <input onChange={(e) => setTitle(e.target.value)} placeholder="Course title" required value={title} />
          <input onChange={(e) => setCode(e.target.value)} placeholder="Code" required value={code} />
          <input min={1} onChange={(e) => setCreditHours(Number(e.target.value))} type="number" value={creditHours} />
          <input min={1} onChange={(e) => setSemester(Number(e.target.value))} type="number" value={semester} />
          <select onChange={(e) => setDepartment(e.target.value)} required value={department}>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="submit">
            Add
          </button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Code</th>
              <th>Credits</th>
              <th>Semester</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.title}</td>
                <td>{item.code}</td>
                <td>{item.creditHours}</td>
                <td>{item.semester}</td>
                <td>{item.department?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StudentPanel({ canMutate }: { canMutate: boolean }) {
  const [items, setItems] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState('A');
  const [department, setDepartment] = useState('');
  const [dob, setDob] = useState('2000-01-01');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentRes, depRes] = await Promise.all([
        api.get<ListResponse<Student>>('/students', { params: { page: 1, limit: 25 } }),
        api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 50 } })
      ]);

      setItems(studentRes.data.data);
      setDepartments(depRes.data.data);
      if (!department && depRes.data.data[0]) {
        setDepartment(depRes.data.data[0]._id);
      }
    } catch {
      setError('Unable to load students.');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/students', {
        fullName,
        email,
        password,
        enrollmentNo,
        semester,
        section,
        department,
        dob
      });
      setFullName('');
      setEmail('');
      setPassword('');
      setEnrollmentNo('');
      await load();
    } catch {
      setError('Failed to create student account. Provide name, email, and password for a new student login.');
    }
  }

  const activeCount = useMemo(() => items.filter((item) => item.active).length, [items]);

  return (
    <section className="erp-panel">
      <h2>Students</h2>
      <p className="muted">Active students: {activeCount}</p>

      {canMutate ? (
        <form className="inline-form" onSubmit={onCreate}>
          <input onChange={(e) => setFullName(e.target.value)} placeholder="Student name" required value={fullName} />
          <input onChange={(e) => setEmail(e.target.value)} placeholder="Student email" required type="email" value={email} />
          <input
            autoComplete="new-password"
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            required
            type="password"
            value={password}
          />
          <input onChange={(e) => setEnrollmentNo(e.target.value)} placeholder="Enrollment No" required value={enrollmentNo} />
          <input min={1} onChange={(e) => setSemester(Number(e.target.value))} type="number" value={semester} />
          <input onChange={(e) => setSection(e.target.value)} placeholder="Section" required value={section} />
          <input onChange={(e) => setDob(e.target.value)} type="date" value={dob} />
          <select onChange={(e) => setDepartment(e.target.value)} required value={department}>
            {departments.map((dep) => (
              <option key={dep._id} value={dep._id}>
                {dep.name}
              </option>
            ))}
          </select>
          <button className="btn-primary" type="submit">
            Add
          </button>
        </form>
      ) : (
        <p className="muted">Read-only access for your role.</p>
      )}

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div className="table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Enrollment</th>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Semester</th>
              <th>Section</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.enrollmentNo}</td>
                <td>{item.user?._id}</td>
                <td>{item.user?.fullName}</td>
                <td>{item.user?.email}</td>
                <td>{item.semester}</td>
                <td>{item.section}</td>
                <td>{item.department?.name}</td>
                <td>{item.active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
