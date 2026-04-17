// src/pages/Users.jsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleDateString('es-VE', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const STATUS_BADGE = {
  true:  <span className="badge badge-green">Activo</span>,
  false: <span className="badge badge-red">Inactivo</span>,
};

export default function Users() {
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('');
  const [loading, setL]     = useState(false);
  const [confirm, setConfirm] = useState(null); // { user, newStatus }

  const load = useCallback(async () => {
    setL(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (role)   params.set('role', role);
      const r = await api.get(`/users?${params}`);
      setRows(r.data);
      setTotal(r.total);
    } finally { setL(false); }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async () => {
    try {
      await api.patch(`/users/${confirm.user.id}`, { isActive: confirm.newStatus });
      setConfirm(null);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>👥 Usuarios</h1>
        <span className="page-subtitle">{total} usuarios registrados</span>
      </div>

      <div className="filter-bar">
        <input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">Todos los roles</option>
          <option value="client">Clientes</option>
          <option value="provider">Proveedores</option>
        </select>
        <button className="btn-icon" onClick={load}>↻ Actualizar</button>
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Saldo</th>
                  <th>KYC</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="empty">No hay usuarios</td></tr>
                )}
                {rows.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <strong>{u.full_name}</strong>
                        <span>{u.email}</span>
                        {u.phone && <span>{u.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'provider' ? 'badge-orange' : 'badge-blue'}`}>
                        {u.role === 'provider' ? 'Proveedor' : 'Cliente'}
                      </span>
                    </td>
                    <td>
                      <span className="amount">${parseFloat(u.balance || 0).toFixed(2)}</span>
                      {parseFloat(u.blocked_balance || 0) > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          🔒 ${parseFloat(u.blocked_balance).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td>
                      {u.role === 'provider' ? (
                        <span className={`badge ${
                          u.kyc_status === 'approved' ? 'badge-green' :
                          u.kyc_status === 'pending'  ? 'badge-yellow' :
                          u.kyc_status === 'rejected' ? 'badge-red' : 'badge-gray'
                        }`}>
                          {u.kyc_status || 'N/A'}
                        </span>
                      ) : <span className="badge badge-gray">—</span>}
                    </td>
                    <td>{STATUS_BADGE[String(u.is_active !== false)]}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(u.created_at)}</td>
                    <td>
                      <button
                        className={u.is_active !== false ? 'btn-reject' : 'btn-approve'}
                        style={{ fontSize: 12 }}
                        onClick={() => setConfirm({ user: u, newStatus: u.is_active === false })}
                      >
                        {u.is_active !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span>Página {page} · {total} total</span>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
            </div>
          )}
        </>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{confirm.newStatus ? '✅ Activar usuario' : '🚫 Desactivar usuario'}</h2>
            <p>¿Confirmas {confirm.newStatus ? 'activar' : 'desactivar'} a <strong>{confirm.user.full_name}</strong>?</p>
            {!confirm.newStatus && <p style={{ color: 'var(--yellow)', marginTop: 8, fontSize: 13 }}>⚠️ El usuario no podrá ingresar a la app mientras esté desactivado.</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className={confirm.newStatus ? 'btn-approve-lg' : 'btn-reject-lg'} onClick={toggleActive}>
                {confirm.newStatus ? 'Sí, activar' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
