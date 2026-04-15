import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';

type AuthMode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const landingPath = (selectedRole: Role) => (selectedRole === 'student' ? '/dashboard' : '/reports');

      if (mode === 'login') {
        const user = await login(email, password, role);
        navigate(landingPath(user.role));
      } else {
        const user = await register(fullName, email, password);
        navigate(landingPath(user.role));
      }
    } catch {
      setError('Unable to authenticate. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page shell">
      <section className="card auth-card">
        <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <form onSubmit={onSubmit}>
          {mode === 'register' ? (
            <label>
              Full name
              <input
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                required
                value={fullName}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {mode === 'login' ? (
            <label>
              Role
              <select onChange={(e) => setRole(e.target.value as Role)} required value={role}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          ) : (
            <p className="muted">New accounts are created as student accounts only.</p>
          )}

          {error ? <p className="error">{error}</p> : null}

          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="ghost"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          type="button"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
        </button>
      </section>
    </main>
  );
}
