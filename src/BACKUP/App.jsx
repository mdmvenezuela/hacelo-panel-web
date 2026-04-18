// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import KYC from './pages/KYC';
import Orders from './pages/Orders';
import Recharges from './pages/Recharges';
import Withdrawals from './pages/Withdrawals';
import PaymentMethods from './pages/PaymentMethods';
import Admins from './pages/Admins';

function ProtectedRoute({ children, action }) {
  const { admin, loading, can } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!admin)  return <Navigate to="/login" replace />;
  // Si tiene acción y no puede, redirigir a la primera página que sí puede
  if (action && !can(action)) {
    if (can('dashboard'))        return <Navigate to="/" replace />;
    if (can('recharges'))        return <Navigate to="/recharges" replace />;
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { can } = useAuth();
  const home = can('dashboard') ? '/' : can('recharges') ? '/recharges' : '/login';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute action="dashboard">
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute action="users">
          <Layout><Users /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/kyc" element={
        <ProtectedRoute action="kyc">
          <Layout><KYC /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute action="orders">
          <Layout><Orders /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/recharges" element={
        <ProtectedRoute action="recharges">
          <Layout><Recharges /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/withdrawals" element={
        <ProtectedRoute action="withdrawals">
          <Layout><Withdrawals /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/payment-methods" element={
        <ProtectedRoute action="payment-methods">
          <Layout><PaymentMethods /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admins" element={
        <ProtectedRoute action="admins">
          <Layout><Admins /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
