import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ErpShell() {
  const { user, logout } = useAuth();
  const role = user?.role ?? 'student';
  const showAcademics = role === 'admin' || role === 'faculty';
  const showOperations = role === 'admin' || role === 'faculty';
  const showReports = true;

  return (
    <div className="erp-layout">
      <aside className="erp-sidebar">
        <div className="erp-sidebar-header">
          <div className="erp-logo">
            <span className="erp-logo-icon">📚</span>
          </div>
          <h2>CLG ERP</h2>
          <p className="muted">Campus Control Suite</p>
        </div>

        <nav className="erp-sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/assignments">Assignments</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/campus">Campus</NavLink>
          {showAcademics ? <NavLink to="/erp">Academics</NavLink> : null}
          {showOperations ? <NavLink to="/operations">Operations</NavLink> : null}
          {showReports ? <NavLink to="/reports">Reports</NavLink> : null}
        </nav>

        <div className="erp-sidebar-footer">
          <p>{user?.fullName}</p>
          <small>
            {user?.role} • {user?.email}
          </small>
          <button className="ghost" onClick={() => void logout()} type="button">
            Logout
          </button>
        </div>
      </aside>

      <section className="erp-content">
        <header className="erp-topbar">
          <div>
            <p className="badge">LIVE ERP WORKSPACE</p>
            <h1>College ERP Suite</h1>
          </div>
        </header>
        <Outlet />
      </section>
    </div>
  );
}
