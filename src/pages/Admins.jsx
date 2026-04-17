// src/pages/Admins.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleString('es-VE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Nunca';

const ROLE_BADGE = {
  admin:       <span className="badge badge-orange">Administrador</span>,
  moderator:   <span className="badge badge-blue">Moderador</span>,
  conciliator: <span className="badge badge-green">Conciliador</span>,
};

const EMPTY_FORM = { email: '', password: '', fullName: '', role: 'moderator' };

export default function Admins() {
  const [rows, setRows]       = useState([]);
  const [loading, setL]       = useState(false);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setL(true);
    try { const r = await api.get('/admins'); setRows(r.data); }
    finally { setL(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/admins', form);
      setModal(false); setForm(EMPTY_FORM); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (admin, newStatus) => {
    if (!confirm(`¿${newStatus ? 'Activar' : 'Desactivar'} a ${admin.full_name}?`)) return;
    try {
      await api.patch(`/admins/${admin.id}`, { isActive: newStatus });
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔑 Administradores</h1>
        <span className="page-subtitle">Gestión de accesos al panel</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button className="btn-icon" onClick={() => setModal(true)}>+ Nuevo administrador</button>
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="empty">No hay administradores</td></tr>
              )}
              {rows.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{a.full_name}</td>
                  <td style={{ color: 'var(--text2)' }}>{a.email}</td>
                  <td>{ROLE_BADGE[a.role]}</td>
                  <td>
                    <span className={`badge ${a.is_active !== false ? 'badge-green' : 'badge-red'}`}>
                      {a.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(a.last_login)}</td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(a.created_at)}</td>
                  <td>
                    <button
                      className={a.is_active !== false ? 'btn-reject' : 'btn-approve'}
                      style={{ fontSize: 12 }}
                      onClick={() => toggleActive(a, a.is_active === false)}
                    >
                      {a.is_active !== false ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>+ Nuevo administrador</h2>
            {error && <div className="alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={save}>
              <div className="form-group">
                <label>Nombre completo *</label>
                <input required value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Juan Pérez" />
              </div>
              <div className="form-group">
                <label>Correo electrónico *</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="juan@hacelo.app" />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres" minLength={8} />
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="moderator">Moderador — gestiona usuarios, KYC y órdenes</option>
                  <option value="conciliator">Conciliador — solo aprueba/rechaza recargas</option>
                  <option value="admin">Administrador — acceso total</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setModal(false); setForm(EMPTY_FORM); setError(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
