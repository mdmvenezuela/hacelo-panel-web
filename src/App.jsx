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
  if (action && !can(action)) return <Navigate to="/recharges" replace />;
  return children;
}

function AppRoutes() {
  const { can } = useAuth();
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
        <ProtectedRoute action="recharges">
          <Layout><Withdrawals /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/payment-methods" element={
        <ProtectedRoute action="settings">
          <Layout><PaymentMethods /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admins" element={
        <ProtectedRoute action="admins">
          <Layout><Admins /></Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={can('dashboard') ? '/' : '/recharges'} replace />} />
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
