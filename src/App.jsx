import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Vehicles from './pages/vehicles/Vehicles'
import Drivers from './pages/drivers/Drivers'
import Trips from './pages/trips/Trips'
import Maintenance from './pages/maintenance/Maintenance'
import Fuel from './pages/fuel/Fuel'
import Expenses from './pages/expenses/Expenses'
import Reports from './pages/reports/Reports'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['fleet_manager','safety_officer']}><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute allowedRoles={['fleet_manager','safety_officer']}><Drivers /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute allowedRoles={['fleet_manager','driver','safety_officer']}><Trips /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['fleet_manager','safety_officer']}><Maintenance /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute allowedRoles={['fleet_manager','driver']}><Fuel /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute allowedRoles={['fleet_manager','financial_analyst']}><Expenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['fleet_manager','financial_analyst','safety_officer']}><Reports /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
