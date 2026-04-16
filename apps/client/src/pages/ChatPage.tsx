import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { ChatCourseListResponse } from '../types/chat';
import type { Course } from '../types/erp';

const EXTERNAL_CHAT_URL = 'https://legendary-goggles-7mk.pages.dev';

export function ChatPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setError(null);

      try {
        const { data } = await api.get<ChatCourseListResponse>('/chat/courses', {
          params: { page: 1, limit: 100 }
        });

        if (!active) {
          return;
        }

        setCourses(data.data);
        setSelectedCourseId((prev) => prev || data.data[0]?._id || '');
      } catch {
        if (active) {
          setError('Unable to load courses for chat rooms.');
        }
      }
    }

    void loadCourses();

    return () => {
      active = false;
    };
  }, []);

  function handleJoinChat() {
    if (!selectedCourse) {
      setError('Please select a course first.');
      return;
    }

    setLoading(true);
    // Use course code as room ID (or course title as fallback)
    const roomId = selectedCourse.code || selectedCourse.title;
    const chatUrl = `${EXTERNAL_CHAT_URL}?room=${encodeURIComponent(roomId)}&username=${encodeURIComponent(user?.fullName ?? 'User')}`;
    
    // Open in new tab
    window.open(chatUrl, '_blank');
    setLoading(false);
  }

  return (
    <main className="page">
      <section className="card erp-card chat-card">
        <p className="badge">COURSE CHATROOM</p>
        <h1>Live Course Chat</h1>
        <p>Join course-wise chat rooms for real-time communication with students, faculty, and admin.</p>

        <div className="chat-toolbar">
          <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
            <option value="">Select a course...</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse ? (
          <p className="muted">
            Selected: {selectedCourse.code} • {selectedCourse.title}
          </p>
        ) : null}

        {error ? <p className="error chat-error">{error}</p> : null}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary" 
            onClick={handleJoinChat}
            disabled={!selectedCourse || loading}
          >
            {loading ? 'Opening...' : '💬 Join Chat'}
          </button>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          ℹ️ Clicking "Join Chat" will open the chat in a new tab with the selected course as the room.
        </p>
      </section>
    </main>
  );
}
