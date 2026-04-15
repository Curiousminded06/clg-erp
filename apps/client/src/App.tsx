import { Route, Routes } from 'react-router-dom'
import { ErpShell } from './components/ErpShell'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CampusPage } from './pages/CampusPage'
import { ChatPage } from './pages/ChatPage'
import { DashboardPage } from './pages/DashboardPage'
import { ErpManagementPage } from './pages/ErpManagementPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { OperationsPage } from './pages/OperationsPage'
import { ReportsPage } from './pages/ReportsPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-shell">
              <Navbar />
              <LandingPage />
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="app-shell">
              <Navbar />
              <LoginPage />
            </div>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<ErpShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/campus" element={<CampusPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/erp" element={<ErpManagementPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
