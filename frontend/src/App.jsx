import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import History from './pages/History'
import Insights from './pages/Insights'
import Budgets from './pages/Budgets'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add"       element={<AddExpense />} />
          <Route path="history"   element={<History />} />
          <Route path="insights"  element={<Insights />} />
          <Route path="budgets"   element={<Budgets />} />
          <Route path="chat"      element={<Chat />} />
          <Route path="settings"  element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
