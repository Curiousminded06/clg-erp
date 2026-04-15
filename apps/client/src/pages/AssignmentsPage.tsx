import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { AssignmentListResponse, AssignmentRecord, AssignmentSubmissionListResponse, AssignmentSubmissionRecord } from '../types/assignments';
import type { Course, Department, ListResponse } from '../types/erp';

export function AssignmentsPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'student';

  if (role === 'student') {
    return <StudentAssignments />;
  }

  return <FacultyAssignments />;
}

function StudentAssignments() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [mySubmissions, setMySubmissions] = useState<AssignmentSubmissionRecord[]>([]);
  const [submittingId, setSubmittingId] = useState('');
  const [contentByAssignment, setContentByAssignment] = useState<Record<string, string>>({});
  const [urlByAssignment, setUrlByAssignment] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        api.get<AssignmentListResponse>('/assignments', { params: { page: 1, limit: 100 } }),
        api.get<AssignmentSubmissionListResponse>('/assignments/submissions/me', { params: { page: 1, limit: 100 } })
      ]);

      setAssignments(assignmentRes.data.data);
      setMySubmissions(submissionRes.data.data);
    } catch {
      setError('Unable to load assignments.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submissionMap = useMemo(() => {
    return new Map(mySubmissions.map((item) => [item.assignment._id, item]));
  }, [mySubmissions]);

  async function onSubmitAssignment(event: FormEvent<HTMLFormElement>, assignmentId: string) {
    event.preventDefault();
    setError(null);
    setSubmittingId(assignmentId);

    try {
      await api.post(`/assignments/${assignmentId}/submissions`, {
        content: contentByAssignment[assignmentId] ?? '',
        attachmentUrl: urlByAssignment[assignmentId] ?? ''
      });

      setContentByAssignment((prev) => ({ ...prev, [assignmentId]: '' }));
      setUrlByAssignment((prev) => ({ ...prev, [assignmentId]: '' }));
      await load();
    } catch {
      setError('Failed to submit assignment.');
    } finally {
      setSubmittingId('');
    }
  }

  return (
    <main className="page">
      <section className="card erp-card">
        <p className="badge">ASSIGNMENTS</p>
        <h1>My Assignments</h1>
        <p>Submit work against assignments posted by faculty.</p>

        {error ? <p className="error">{error}</p> : null}
        {!assignments.length ? <p className="muted">No assignments available yet.</p> : null}

        <div className="report-list">
          {assignments.map((assignment) => {
            const submission = submissionMap.get(assignment._id);

            return (
              <article className="report-list-item" key={assignment._id}>
                <strong>{assignment.title}</strong>
                <p>
                  {assignment.course.code} • Due {new Date(assignment.dueDate).toLocaleDateString()} • {assignment.maxPoints} points
                </p>
                <span className="muted">{assignment.description || 'No additional instructions.'}</span>

                {submission ? (
                  <div>
                    <p className="muted">
                      Submitted: {new Date(submission.submittedAt).toLocaleString()} • Status: {submission.status}
                    </p>
                    {submission.status === 'graded' ? (
                      <p className="muted">
                        Grade: {submission.grade ?? '-'} / {assignment.maxPoints}
                        {submission.feedback ? ` • Feedback: ${submission.feedback}` : ''}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <form className="inline-form" onSubmit={(event) => void onSubmitAssignment(event, assignment._id)}>
                  <input
                    required
                    placeholder="Submission text / answer"
                    value={contentByAssignment[assignment._id] ?? ''}
                    onChange={(event) =>
                      setContentByAssignment((prev) => ({ ...prev, [assignment._id]: event.target.value }))
                    }
                  />
                  <input
                    placeholder="Attachment URL (optional)"
                    value={urlByAssignment[assignment._id] ?? ''}
                    onChange={(event) =>
                      setUrlByAssignment((prev) => ({ ...prev, [assignment._id]: event.target.value }))
                    }
                  />
                  <button className="btn-primary" type="submit" disabled={submittingId === assignment._id}>
                    {submittingId === assignment._id ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function FacultyAssignments() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionRecord[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gradingId, setGradingId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxPoints, setMaxPoints] = useState(100);
  const [gradeBySubmission, setGradeBySubmission] = useState<Record<string, number>>({});
  const [feedbackBySubmission, setFeedbackBySubmission] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(null);

    try {
      const [assignmentRes, depRes, courseRes] = await Promise.all([
        api.get<AssignmentListResponse>('/assignments', { params: { page: 1, limit: 100 } }),
        api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 100 } }),
        api.get<ListResponse<Course>>('/courses', { params: { page: 1, limit: 100 } })
      ]);

      setAssignments(assignmentRes.data.data);
      setDepartments(depRes.data.data);
      setCourses(courseRes.data.data);
      setDepartment((prev) => prev || depRes.data.data[0]?._id || '');
      setCourse((prev) => prev || courseRes.data.data[0]?._id || '');
    } catch {
      setError('Unable to load assignments.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/assignments', {
        title,
        description,
        department,
        course,
        dueDate,
        maxPoints
      });

      setTitle('');
      setDescription('');
      setMaxPoints(100);
      await load();
    } catch {
      setError('Failed to post assignment.');
    }
  }

  async function onLoadSubmissions(assignmentId: string) {
    setError(null);

    try {
      const { data } = await api.get<AssignmentSubmissionListResponse>(`/assignments/${assignmentId}/submissions`);
      setSelectedAssignmentId(assignmentId);
      setSubmissions(data.data);
      setGradeBySubmission(
        Object.fromEntries(data.data.map((item) => [item._id, Number(item.grade ?? item.assignment.maxPoints)]))
      );
      setFeedbackBySubmission(Object.fromEntries(data.data.map((item) => [item._id, item.feedback ?? ''])));
    } catch {
      setError('Unable to load submissions for this assignment.');
    }
  }

  async function onGradeSubmission(submissionId: string) {
    setError(null);
    setGradingId(submissionId);

    try {
      await api.patch(`/assignments/submissions/${submissionId}/grade`, {
        grade: gradeBySubmission[submissionId],
        feedback: feedbackBySubmission[submissionId] ?? ''
      });

      if (selectedAssignmentId) {
        await onLoadSubmissions(selectedAssignmentId);
      }
    } catch {
      setError('Failed to save grade.');
    } finally {
      setGradingId('');
    }
  }

  return (
    <main className="page">
      <section className="card erp-card">
        <p className="badge">ASSIGNMENTS</p>
        <h1>Assignment Management</h1>
        <p>Post assignments and review student submissions.</p>

        <form className="inline-form" onSubmit={onCreateAssignment}>
          <input required placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <select required value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <select required value={course} onChange={(e) => setCourse(e.target.value)}>
            {courses
              .filter((item) => (department ? item.department?._id === department : true))
              .map((item) => (
                <option key={item._id} value={item._id}>
                  {item.code} - {item.title}
                </option>
              ))}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <input
            type="number"
            min={1}
            max={1000}
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
          />
          <button className="btn-primary" type="submit">Post</button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Due</th>
                <th>Points</th>
                <th>Submissions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.course?.code}</td>
                  <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                  <td>{item.maxPoints}</td>
                  <td>
                    <button className="ghost" type="button" onClick={() => void onLoadSubmissions(item._id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedAssignmentId ? (
          <section className="erp-panel" style={{ marginTop: '1rem' }}>
            <h2>Submissions</h2>
            {!submissions.length ? <p className="muted">No submissions yet.</p> : null}
            <div className="table-wrap">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submitted</th>
                    <th>Content</th>
                    <th>Grade</th>
                    <th>Feedback</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.student?.enrollmentNo}
                        <div className="muted">{item.student?.user?.fullName}</div>
                      </td>
                      <td>{new Date(item.submittedAt).toLocaleString()}</td>
                      <td>{item.content}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={item.assignment.maxPoints}
                          value={gradeBySubmission[item._id] ?? 0}
                          onChange={(event) =>
                            setGradeBySubmission((prev) => ({ ...prev, [item._id]: Number(event.target.value) }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={feedbackBySubmission[item._id] ?? ''}
                          onChange={(event) =>
                            setFeedbackBySubmission((prev) => ({ ...prev, [item._id]: event.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          type="button"
                          disabled={gradingId === item._id}
                          onClick={() => void onGradeSubmission(item._id)}
                        >
                          {gradingId === item._id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
