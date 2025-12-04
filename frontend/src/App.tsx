import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Classes from './pages/Classes';
import ClassForm from './pages/ClassForm';
import MyClasses from './pages/MyClasses';
import MyBookings from './pages/MyBookings';
import ClassBookings from './pages/ClassBookings';
import AdminUsers from './pages/AdminUsers';
import Payment from './pages/Payment';
import { UserRole } from './types';
import './App.css';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Rutas de Clases */}
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <Classes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes/create"
          element={
            <ProtectedRoute allowedRoles={[UserRole.MONITOR, UserRole.ADMIN]}>
              <ClassForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes/edit/:id"
          element={
            <ProtectedRoute allowedRoles={[UserRole.MONITOR, UserRole.ADMIN]}>
              <ClassForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes/my-classes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.MONITOR, UserRole.ADMIN]}>
              <MyClasses />
            </ProtectedRoute>
          }
        />
        {/* Rutas de Reservas */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/class/:classId"
          element={
            <ProtectedRoute allowedRoles={[UserRole.MONITOR, UserRole.ADMIN]}>
              <ClassBookings />
            </ProtectedRoute>
          }
        />
        {/* Rutas de Administración */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        {/* Rutas de Pagos */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={[UserRole.SOCIO]}>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
