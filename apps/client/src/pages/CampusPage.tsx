import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { CampusUpdateListResponse, CampusUpdateRecord, NoticeListResponse, NoticeRecord } from '../types/campus';
import type { Department, ListResponse } from '../types/erp';

export function CampusPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'student';
  const isFaculty = role === 'faculty';
  const isAdmin = role === 'admin';

  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [updates, setUpdates] = useState<CampusUpdateRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'all' | 'students' | 'faculty'>('all');
  const [noticeDepartment, setNoticeDepartment] = useState('');
  const [noticeExpiry, setNoticeExpiry] = useState('');

  const [updateType, setUpdateType] = useState<'event' | 'achievement'>('event');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateDate, setUpdateDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [updateLocation, setUpdateLocation] = useState('');

  const load = useCallback(async () => {
    setError(null);

    try {
      const requests = [
        api.get<NoticeListResponse>('/notices', { params: { page: 1, limit: 50 } }),
        api.get<CampusUpdateListResponse>('/campus-updates', { params: { page: 1, limit: 50 } })
      ] as const;

      const [noticeRes, updateRes, depRes] = await Promise.all([
        ...requests,
        isFaculty ? api.get<ListResponse<Department>>('/departments', { params: { page: 1, limit: 100 } }) : Promise.resolve(null)
      ]);

      setNotices(noticeRes.data.data);
      setUpdates(updateRes.data.data);
      setDepartments(depRes?.data.data ?? []);
      setNoticeDepartment((prev) => prev || depRes?.data.data[0]?._id || '');
    } catch {
      setError('Unable to load campus communication feeds.');
    }
  }, [isFaculty]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/notices', {
        title: noticeTitle,
        message: noticeMessage,
        audience: noticeAudience,
        department: noticeDepartment || undefined,
        expiresAt: noticeExpiry || undefined
      });

      setNoticeTitle('');
      setNoticeMessage('');
      setNoticeExpiry('');
      await load();
    } catch {
      setError('Failed to publish notice.');
    }
  }

  async function onCreateUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await api.post('/campus-updates', {
        type: updateType,
        title: updateTitle,
        description: updateDescription,
        date: updateDate,
        location: updateLocation
      });

      setUpdateTitle('');
      setUpdateDescription('');
      setUpdateLocation('');
      await load();
    } catch {
      setError('Failed to publish campus update.');
    }
  }

  return (
    <main className="page">
      <section className="card erp-card">
        <p className="badge">CAMPUS FEED</p>
        <h1>Notices, Events, and Achievements</h1>
        <p>Faculty can publish notices/announcements. Admin can publish campus events and achievements.</p>

        {error ? <p className="error">{error}</p> : null}

        {isFaculty ? (
          <section className="erp-panel">
            <h2>Post Notice / Announcement</h2>
            <form className="inline-form" onSubmit={onCreateNotice}>
              <input required placeholder="Notice title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} />
              <input required placeholder="Message" value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} />
              <select value={noticeAudience} onChange={(e) => setNoticeAudience(e.target.value as typeof noticeAudience)}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty</option>
              </select>
              <select value={noticeDepartment} onChange={(e) => setNoticeDepartment(e.target.value)}>
                <option value="">All departments</option>
                {departments.map((dep) => (
                  <option key={dep._id} value={dep._id}>
                    {dep.name}
                  </option>
                ))}
              </select>
              <input type="date" value={noticeExpiry} onChange={(e) => setNoticeExpiry(e.target.value)} />
              <button className="btn-primary" type="submit">Publish</button>
            </form>
          </section>
        ) : null}

        {isAdmin ? (
          <section className="erp-panel">
            <h2>Post Campus Event / Achievement</h2>
            <form className="inline-form" onSubmit={onCreateUpdate}>
              <select value={updateType} onChange={(e) => setUpdateType(e.target.value as typeof updateType)}>
                <option value="event">Event</option>
                <option value="achievement">Achievement</option>
              </select>
              <input required placeholder="Title" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />
              <input required placeholder="Description" value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} />
              <input type="date" value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} />
              <input placeholder="Location (optional)" value={updateLocation} onChange={(e) => setUpdateLocation(e.target.value)} />
              <button className="btn-primary" type="submit">Publish</button>
            </form>
          </section>
        ) : null}

        <section className="erp-panel">
          <h2>Notices & Announcements</h2>
          {!notices.length ? <p className="muted">No notices published yet.</p> : null}
          <div className="report-list">
            {notices.map((notice) => (
              <article className="report-list-item" key={notice._id}>
                <strong>{notice.title}</strong>
                <p>{notice.message}</p>
                <span className="muted">
                  {notice.audience.toUpperCase()} • {notice.department?.name ?? 'All departments'} • by {notice.createdBy?.fullName}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="erp-panel">
          <h2>Campus Events & Achievements</h2>
          {!updates.length ? <p className="muted">No campus updates published yet.</p> : null}
          <div className="report-list">
            {updates.map((item) => (
              <article className="report-list-item" key={item._id}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span className="muted">
                  {item.type.toUpperCase()} • {new Date(item.date).toLocaleDateString()}
                  {item.location ? ` • ${item.location}` : ''} • by {item.createdBy?.fullName}
                </span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
