// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const Stat = ({ label, value, color = '#FF6B2C' }) => (
  <div className="stat-card">
    <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setL] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setL(false));
  }, []);

  if (loading) return <div className="page-loading">Cargando...</div>;

  const u = data?.users    || {};
  const o = data?.orders   || {};
  const r = data?.recharges || {};
  const w = data?.wallet   || {};

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="page-subtitle">Vista general de Hacelo</span>
      </div>

      <section className="section">
        <div className="section-title">👥 Usuarios</div>
        <div className="stats-grid">
          <Stat label="Clientes"         value={u.clients}        color="#3B82F6" />
          <Stat label="Proveedores"      value={u.providers}      color="#10B981" />
          <Stat label="Nuevos esta semana" value={u.new_this_week} color="#F59E0B" />
        </div>
      </section>

      <section className="section">
        <div className="section-title">📋 Órdenes</div>
        <div className="stats-grid">
          <Stat label="Total"        value={o.total}       color="#52525B" />
          <Stat label="Pendientes"   value={o.pending}     color="#F59E0B" />
          <Stat label="En progreso"  value={o.in_progress} color="#3B82F6" />
          <Stat label="Confirmadas"  value={o.confirmed}   color="#10B981" />
          <Stat label="Canceladas"   value={o.cancelled}   color="#EF4444" />
          <Stat label="Esta semana"  value={o.this_week}   color="#FF6B2C" />
        </div>
      </section>

      <section className="section">
        <div className="section-title">💰 Recargas</div>
        <div className="stats-grid">
          <Stat label="Pendientes"     value={r.pending}  color="#F59E0B" />
          <Stat label="Aprobadas"      value={r.approved} color="#10B981" />
          <Stat label="Total aprobado"
            value={r.total_approved_amount ? `$${parseFloat(r.total_approved_amount).toFixed(2)}` : '$0.00'}
            color="#FF6B2C" />
        </div>
      </section>

      <section className="section">
        <div className="section-title">💸 Retiros</div>
        <div className="stats-grid">
          <Stat label="Pendientes"    value={data?.withdrawals?.pending}    color="#F59E0B" />
          <Stat label="En proceso"    value={data?.withdrawals?.processing} color="#3B82F6" />
          <Stat label="Monto pendiente"
            value={data?.withdrawals?.pending_amount ? `$${parseFloat(data.withdrawals.pending_amount).toFixed(2)}` : '$0.00'}
            color="#EF4444" />
        </div>
      </section>

      <section className="section">
        <div className="section-title">🏦 Wallets</div>
        <div className="stats-grid">
          <Stat label="Saldo en circulación"
            value={w.total_balance ? `$${parseFloat(w.total_balance).toFixed(2)}` : '$0.00'}
            color="#10B981" />
          <Stat label="Saldo bloqueado"
            value={w.total_blocked ? `$${parseFloat(w.total_blocked).toFixed(2)}` : '$0.00'}
            color="#EF4444" />
        </div>
      </section>
    </div>
  );
}
