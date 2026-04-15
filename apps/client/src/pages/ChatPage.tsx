import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { ChatCourseListResponse, ChatHistoryResponse, ChatMessageRecord } from '../types/chat';
import type { Course } from '../types/erp';

function buildSocketUrl(apiBase: string, token: string) {
  const httpRoot = apiBase.replace(/\/api\/?$/, '');
  const wsRoot = httpRoot.replace(/^http/, 'ws');
  return `${wsRoot}/ws/chat?token=${encodeURIComponent(token)}`;
}

export function ChatPage() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const cleanupCloseRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!selectedCourseId) {
        setMessages([]);
        return;
      }

      try {
        const { data } = await api.get<ChatHistoryResponse>(`/chat/messages/${selectedCourseId}`, {
          params: { limit: 50 }
        });

        if (active) {
          setMessages(data.data);
        }
      } catch {
        if (active) {
          setMessages([]);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    cleanupCloseRef.current = false;
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    const socket = new WebSocket(buildSocketUrl(apiBase, token));
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnected(true);
      setError(null);
    });

    socket.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data as string);

        if (parsed.type === 'history') {
          setError(null);
          setMessages(parsed.payload ?? []);
          return;
        }

        if (parsed.type === 'message') {
          setError(null);
          setMessages((prev) => [...prev, parsed.payload]);
          return;
        }

        if (parsed.type === 'error') {
          setError(parsed?.payload?.message ?? 'Chat error occurred.');
        }
      } catch {
        setError('Received an invalid realtime payload.');
      }
    });

    socket.addEventListener('close', () => {
      setConnected(false);

      if (!cleanupCloseRef.current) {
        setError('Realtime chat disconnected. Reconnect by reloading this page.');
      }
    });

    socket.addEventListener('error', () => {
      if (!cleanupCloseRef.current) {
        setError('Realtime chat connection failed.');
      }
    });

    return () => {
      cleanupCloseRef.current = true;
      socket.close();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedCourseId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'join',
        payload: { roomId: selectedCourseId, username: user?.fullName ?? 'User' }
      })
    );
  }, [selectedCourseId, user?.fullName]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function onSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = messageInput.trim();
    if (!content) {
      return;
    }

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError('Chat connection is not active.');
      return;
    }

    socket.send(
      JSON.stringify({
        type: 'chat',
        payload: { message: content }
      })
    );

    setMessageInput('');
  }

  return (
    <main className="page">
      <section className="card erp-card chat-card">
        <p className="badge">COURSE CHATROOM</p>
        <h1>Live Course Chat</h1>
        <p>Course-wise common room for students, faculty, and admin.</p>

        <div className="chat-toolbar">
          <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
          <span className={`chat-status ${connected ? 'online' : 'offline'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {selectedCourse ? (
          <p className="muted">
            Room: {selectedCourse.code} • {selectedCourse.title}
          </p>
        ) : null}

        {error ? <p className="error chat-error">{error}</p> : null}

        <div className="chat-thread">
          {messages.map((message) => {
            const own = message.sender?._id === user?.id;

            return (
              <article className={`chat-bubble ${own ? 'own' : 'other'}`} key={message._id}>
                <strong>{own ? 'You' : message.sender?.fullName ?? 'Unknown'}</strong>
                <p>{message.content}</p>
                <span className="muted">{new Date(message.timestamp).toLocaleString()}</span>
              </article>
            );
          })}
          {!messages.length ? <p className="muted">No messages yet in this room.</p> : null}
          <div ref={messageEndRef} />
        </div>

        <form className="chat-compose" onSubmit={onSend}>
          <input
            required
            placeholder="Type your message"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={!connected}>Send</button>
        </form>
      </section>
    </main>
  );
}
