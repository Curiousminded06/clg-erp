import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="public-navbar">
      <Link className="brand" to="/">
        <span className="brand-logo">📚</span>
        <span className="brand-text">CLG ERP</span>
      </Link>
      <nav className="public-navbar-nav">
        <Link to="/">Home</Link>
        <Link to={user ? '/dashboard' : '/login'}>{user ? 'Open ERP' : 'Login'}</Link>
      </nav>
    </header>
  );
}
