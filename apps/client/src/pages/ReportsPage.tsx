import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { AtRiskStudent, DashboardResponse, SearchResults } from '../types/reports';

function formatLabel(key: string) {
  return key
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll(/[_-]/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

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
          setError('Unable to load reporting dashboard.');
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

    async function runSearch(query: string) {
      if (query.trim().length < 2) {
        setResults(null);
        return;
      }

      setSearching(true);

      try {
        const { data } = await api.get<{ success: boolean; data: SearchResults }>('/reports/search', {
          params: { q: query, limit: 6 }
        });

        if (active) {
          setResults(data.data);
        }
      } catch {
        if (active) {
          setResults(null);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }

    void runSearch(deferredSearch);

    return () => {
      active = false;
    };
  }, [deferredSearch]);

  const summaryCards = useMemo(
    () => Object.entries(dashboard?.summary ?? {}).map(([key, value]) => ({ key, value })),
    [dashboard]
  );

  async function exportReport(format: 'csv' | 'pdf', type: 'dashboard' | 'at-risk') {
    setExporting(format);

    try {
      const response = await api.get('/reports/export', {
        params: { format, type },
        responseType: 'blob'
      });

      const extension = format === 'csv' ? 'csv' : 'pdf';
      downloadBlob(response.data as Blob, `${type}-report.${extension}`);
    } finally {
      setExporting(null);
    }
  }

  const atRiskStudents: AtRiskStudent[] = dashboard?.atRiskStudents ?? [];

  if (user?.role === 'student') {
    const studentCards = summaryCards.filter((card) =>
      ['attendanceRate', 'riskScore', 'overdueInvoices', 'pendingInvoices', 'upcomingExams'].includes(card.key)
    );

    return (
      <main className="page">
        <section className="card report-shell">
          <div className="report-hero">
            <div>
              <p className="badge">PHASE 4</p>
              <h1>My Reports</h1>
              <p>Summary-only view for students. Detailed timetable and recent activity stay on the dashboard.</p>
            </div>
          </div>

          {loading ? <p>Loading reporting dashboard...</p> : null}
          {error ? <p className="error">{error}</p> : null}

          {dashboard ? (
            <section className="report-section">
              <div className="report-section-header">
                <div>
                  <p className="report-kicker">{dashboard.role.toUpperCase()} VIEW</p>
                  <h2>{dashboard.title}</h2>
                </div>
                {dashboard.student ? (
                  <p className="report-note">
                    {dashboard.student.fullName} • {dashboard.student.enrollmentNo} • {dashboard.student.department}
                  </p>
                ) : null}
              </div>

              <div className="report-grid">
                {studentCards.map((card) => (
                  <article className="report-metric" key={card.key}>
                    <span>{formatLabel(card.key)}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>

              <p className="muted">Use Dashboard for timetable, attendance feed, and upcoming exam detail.</p>
            </section>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card report-shell">
        <div className="report-hero">
          <div>
            <p className="badge">PHASE 4</p>
            <h1>Reporting and Intelligence</h1>
            <p>
              Role-aware dashboards, academic progress monitoring, at-risk detection, searchable records,
              and exportable reports for the college ERP.
            </p>
          </div>

          <div className="report-actions">
            <button className="btn-primary" onClick={() => void exportReport('csv', 'dashboard')} type="button">
              {exporting === 'csv' ? 'Preparing CSV...' : 'Export dashboard CSV'}
            </button>
            <button className="btn-secondary" onClick={() => void exportReport('pdf', 'dashboard')} type="button">
              {exporting === 'pdf' ? 'Preparing PDF...' : 'Export dashboard PDF'}
            </button>
          </div>
        </div>

        {loading ? <p>Loading reporting dashboard...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {dashboard ? (
          <>
            <section className="report-section">
              <div className="report-section-header">
                <div>
                  <p className="report-kicker">{dashboard.role.toUpperCase()} VIEW</p>
                  <h2>{dashboard.title}</h2>
                </div>
                {dashboard.role === 'student' && dashboard.student ? (
                  <p className="report-note">
                    {dashboard.student.fullName} • {dashboard.student.enrollmentNo} • {dashboard.student.department}
                  </p>
                ) : null}
              </div>

              <div className="report-grid">
                {summaryCards.map((card) => (
                  <article className="report-metric" key={card.key}>
                    <span>{formatLabel(card.key)}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>
            </section>

            {dashboard.attendanceTrend?.length ? (
              <section className="report-section">
                <div className="report-section-header">
                  <h2>Attendance trend</h2>
                  <p className="report-note">Monthly attendance vs present sessions for the last tracked window.</p>
                </div>
                <div className="trend-list">
                  {dashboard.attendanceTrend.map((item) => {
                    const percentage = Math.max(6, Math.round((item.present / Math.max(item.total, 1)) * 100));

                    return (
                      <div className="trend-row" key={item.label}>
                        <div className="trend-meta">
                          <strong>{item.label}</strong>
                          <span>{percentage}% present</span>
                        </div>
                        <div className="trend-bar">
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {atRiskStudents.length ? (
              <section className="report-section">
                <div className="report-section-header">
                  <div>
                    <h2>At-risk students</h2>
                    <p className="report-note">Students with weak attendance or fee pressure surface here first.</p>
                  </div>
                  <div className="report-actions inline-actions">
                    <button className="ghost" onClick={() => void exportReport('csv', 'at-risk')} type="button">
                      Export risk CSV
                    </button>
                    <button className="ghost" onClick={() => void exportReport('pdf', 'at-risk')} type="button">
                      Export risk PDF
                    </button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Department</th>
                        <th>Attendance</th>
                        <th>Invoices</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atRiskStudents.map((student) => (
                        <tr key={student.id}>
                          <td>
                            <strong>{student.fullName}</strong>
                            <div className="muted">{student.enrollmentNo}</div>
                          </td>
                          <td>{student.department}</td>
                          <td>{student.attendanceRate}%</td>
                          <td>
                            {student.overdueInvoices} overdue / {student.pendingInvoices} pending
                          </td>
                          <td>
                            <span className={`risk-pill risk-${student.riskLevel.toLowerCase()}`}>
                              {student.riskLevel} {student.riskScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {dashboard.recentAttendance?.length ? (
              <section className="report-section">
                <div className="report-section-header">
                  <h2>Recent activity</h2>
                  <p className="report-note">Latest attendance entries are surfaced for quick review.</p>
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
                  <p className="report-note">Exam timeline feeds into planning and student alerts.</p>
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
          </>
        ) : null}

        <section className="report-section">
          <div className="report-section-header">
            <div>
              <h2>Campus search</h2>
              <p className="report-note">Search across users, departments, courses, and students.</p>
            </div>
            <p className="report-note">{searching ? 'Searching...' : 'Powered by indexed lookups.'}</p>
          </div>

          <input
            aria-label="Search campus records"
            className="report-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, code, department, enrollment number..."
            value={search}
          />

          {results ? (
            <div className="search-grid">
              <ReportSearchColumn title="Users" items={results.users.map((item) => `${item.fullName} • ${item.email} • ${item.role}`)} />
              <ReportSearchColumn title="Departments" items={results.departments.map((item) => `${item.name} • ${item.code}`)} />
              <ReportSearchColumn title="Courses" items={results.courses.map((item) => `${item.code} • ${item.title}`)} />
              <ReportSearchColumn title="Students" items={results.students.map((item) => `${item.enrollmentNo} • ${item.user?.fullName ?? 'Student'}`)} />
            </div>
          ) : (
            <p className="muted">Type at least two characters to search records.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function ReportSearchColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="search-card">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No matches yet.</p>
      )}
    </article>
  );
}