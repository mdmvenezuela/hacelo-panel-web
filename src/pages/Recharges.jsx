// src/pages/Recharges.jsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleString('es-VE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const TABS = ['pending', 'approved', 'rejected'];
const TAB_LABEL = { pending: '⏳ Pendientes', approved: '✅ Aprobadas', rejected: '❌ Rechazadas' };

export default function Recharges() {
  const [status, setStatus]   = useState('pending');
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setL]       = useState(false);
  const [selected, setSel]    = useState(null);
  const [modal, setModal]     = useState(null);
  const [reason, setReason]   = useState('');
  const [actionL, setActionL] = useState(false);

  const load = useCallback(async () => {
    setL(true);
    try {
      const r = await api.get(`/recharges?status=${status}&page=${page}&limit=20`);
      setRows(r.data); setTotal(r.total);
    } finally { setL(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    setActionL(true);
    try {
      await api.post(`/recharges/${selected.id}/approve`);
      setModal(null); setSel(null); load();
    } catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  const reject = async () => {
    if (!reason.trim()) { alert('Ingresa el motivo'); return; }
    setActionL(true);
    try {
      await api.post(`/recharges/${selected.id}/reject`, { reason });
      setModal(null); setSel(null); setReason(''); load();
    } catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>💰 Recargas</h1>
        <span className="page-subtitle">Conciliación de pagos</span>
      </div>

      <div className="tabs">
        {TABS.map(s => (
          <button key={s} className={`tab ${status === s ? 'active' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}>
            {TAB_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                  <th>Banco origen</th>
                  <th>Fecha pago</th>
                  <th>Solicitado</th>
                  {status === 'pending'  && <th>Acciones</th>}
                  {status === 'rejected' && <th>Motivo</th>}
                  {status === 'approved' && <th>Aprobado</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="empty">No hay recargas {status === 'pending' ? 'pendientes' : ''}</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="user-cell">
                        <strong>{r.full_name}</strong>
                        <span>{r.email}</span>
                        {r.phone && <span>{r.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{r.payment_method_name || r.payment_method_type || '—'}</span>
                    </td>
                    <td><strong className="amount">${parseFloat(r.amount).toFixed(2)}</strong></td>
                    <td><code className="ref">{r.reference_number || '—'}</code></td>
                    <td style={{ color: 'var(--text2)' }}>{r.origin_bank || '—'}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(r.payment_date)}</td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(r.created_at)}</td>
                    {status === 'pending' && (
                      <td>
                        <div className="action-btns">
                          <button className="btn-approve" onClick={() => { setSel(r); setModal('approve'); }}>✓ Aprobar</button>
                          <button className="btn-reject"  onClick={() => { setSel(r); setModal('reject');  }}>✕ Rechazar</button>
                        </div>
                      </td>
                    )}
                    {status === 'rejected' && (
                      <td><span className="reject-reason">{r.rejection_reason}</span></td>
                    )}
                    {status === 'approved' && (
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(r.reviewed_at)}</td>
                    )}
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

      {modal === 'approve' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✅ Aprobar recarga</h2>
            <p>¿Confirmas acreditar <strong className="amount">${parseFloat(selected.amount).toFixed(2)}</strong> a <strong>{selected.full_name}</strong>?</p>
            <div className="info-grid" style={{ marginTop: 14 }}>
              <div className="info-item"><label>Referencia</label><span><code className="ref">{selected.reference_number}</code></span></div>
              <div className="info-item"><label>Banco</label><span>{selected.origin_bank || '—'}</span></div>
              <div className="info-item"><label>Fecha pago</label><span>{fmt(selected.payment_date)}</span></div>
              <div className="info-item"><label>Método</label><span>{selected.payment_method_name || '—'}</span></div>
            </div>
            {selected.notes && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text3)' }}>Nota: {selected.notes}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-approve-lg" onClick={approve} disabled={actionL}>
                {actionL ? 'Aprobando...' : '✓ Confirmar aprobación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reject' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>❌ Rechazar recarga</h2>
            <p>Recarga de <strong className="amount">${parseFloat(selected.amount).toFixed(2)}</strong> de <strong>{selected.full_name}</strong></p>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Motivo del rechazo *</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ej: Referencia no encontrada, monto no coincide con el registrado..." />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-reject-lg" onClick={reject} disabled={actionL || !reason.trim()}>
                {actionL ? 'Rechazando...' : '✕ Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
