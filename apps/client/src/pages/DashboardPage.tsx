import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { TimetableRecord } from '../types/operations';
import type { DashboardResponse } from '../types/reports';

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [timetable, setTimetable] = useState<TimetableRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await api.get<{ success: boolean; data: DashboardResponse }>('/reports/dashboard');

        if (active) {
          setDashboard(data.data);
        }
      } catch {
        if (active) {
          setError('Unable to load your dashboard summary.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTimetable() {
      if (dashboard?.role !== 'student') {
        setTimetable(null);
        return;
      }

      setTimetableLoading(true);

      try {
        const { data } = await api.get<{ success: boolean; data: TimetableRecord[] }>('/timetables/me');

        if (active) {
          setTimetable(data.data);
        }
      } catch {
        if (active) {
          setTimetable([]);
        }
      } finally {
        if (active) {
          setTimetableLoading(false);
        }
      }
    }

    void loadTimetable();

    return () => {
      active = false;
    };
  }, [dashboard?.role]);

  const summaryCards = useMemo(() => Object.entries(dashboard?.summary ?? {}), [dashboard]);

  return (
    <main className="page">
      <section className="card report-shell">
        <p className="badge">DASHBOARD</p>
        <h1>Welcome back, {user?.fullName}</h1>
        <p>
          {user?.role === 'student'
            ? 'Your dashboard is focused on attendance, exams, and fee status.'
            : 'Monitor academics and operations from one role-aware college ERP workspace.'}
        </p>

        {loading ? <p>Loading dashboard summary...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {dashboard ? (
          <>
            <div className="report-grid">
              <article className="report-metric">
                <span>Role</span>
                <strong>{dashboard.role}</strong>
              </article>
              {summaryCards.map(([key, value]) => (
                <article className="report-metric" key={key}>
                  <span>{key.replaceAll(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>

            {dashboard.role === 'student' && dashboard.student ? (
              <section className="report-section">
                <div className="report-section-header">
                  <div>
                    <h2>My profile</h2>
                    <p className="report-note">Personal academic context for {dashboard.student.enrollmentNo}.</p>
                  </div>
                </div>

                <div className="stats-grid">
                  <article>
                    <h2>Department</h2>
                    <p>{dashboard.student.department}</p>
                  </article>
                  <article>
                    <h2>Semester</h2>
                    <p>{dashboard.student.semester}</p>
                  </article>
                  <article>
                    <h2>Section</h2>
                    <p>{dashboard.student.section}</p>
                  </article>
                </div>
              </section>
            ) : null}

            {dashboard.recentAttendance?.length ? (
              <section className="report-section">
                <div className="report-section-header">
                  <h2>{dashboard.role === 'student' ? 'Recent attendance' : 'Recent activity'}</h2>
                  <p className="report-note">Latest attendance entries from your dashboard summary.</p>
                </div>

                <div className="report-list">
                  {dashboard.recentAttendance.map((item) => (
                    <article className="report-list-item" key={item.id}>
                      <strong>{item.course}</strong>
                      <p>{new Date(item.date).toLocaleDateString()}</p>
                      <span className="muted">{item.student ? `${item.student} • ` : ''}{item.status}</span>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {dashboard.upcomingExams?.length ? (
              <section className="report-section">
                <div className="report-section-header">
                  <h2>Upcoming exams</h2>
                  <p className="report-note">A short look ahead for planning and revision.</p>
                </div>

                <div className="report-list">
                  {dashboard.upcomingExams.map((item) => (
                    <article className="report-list-item" key={item.id}>
                      <strong>{item.course}</strong>
                      <p>{new Date(item.date).toLocaleDateString()}</p>
                      <span className="muted">
                        {item.examType}{item.department ? ` • ${item.department}` : ''}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {dashboard.role === 'student' ? (
              <section className="report-section">
                <div className="report-section-header">
                  <div>
                    <h2>My timetable</h2>
                    <p className="report-note">This view is filtered to your department and semester.</p>
                  </div>
                </div>

                {timetableLoading ? <p>Loading timetable...</p> : null}
                {!timetableLoading && timetable?.length ? (
                  <div className="report-list">
                    {timetable.map((item) => (
                      <article className="report-list-item" key={item._id}>
                        <strong>{item.course.code}</strong>
                        <p>
                          {item.dayOfWeek} • {item.startTime} - {item.endTime}
                        </p>
                        <span className="muted">
                          {item.course.title} • {item.room} • {item.faculty.fullName}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : null}
                {!timetableLoading && timetable && timetable.length === 0 ? (
                  <p className="muted">No timetable entries are available for your current semester yet.</p>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
