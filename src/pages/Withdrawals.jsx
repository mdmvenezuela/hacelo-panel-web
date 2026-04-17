// src/pages/Withdrawals.jsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleString('es-VE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const TABS = ['pending', 'completed', 'rejected'];
const TAB_LABEL = { pending: '⏳ Pendientes', completed: '✅ Completados', rejected: '❌ Rechazados' };

export default function Withdrawals() {
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
      const r = await api.get(`/withdrawals?status=${status}&page=${page}&limit=20`);
      setRows(r.data); setTotal(r.total);
    } finally { setL(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    setActionL(true);
    try {
      await api.post(`/withdrawals/${selected.id}/approve`);
      setModal(null); setSel(null); load();
    } catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  const reject = async () => {
    if (!reason.trim()) { alert('Ingresa el motivo'); return; }
    setActionL(true);
    try {
      await api.post(`/withdrawals/${selected.id}/reject`, { reason });
      setModal(null); setSel(null); setReason(''); load();
    } catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  const getPayoutInfo = (row) => {
    try {
      const d = typeof row.payout_details === 'string'
        ? JSON.parse(row.payout_details) : row.payout_details;
      return Object.entries(d || {}).map(([k,v]) => `${k}: ${v}`).join(' · ') || '—';
    } catch { return '—'; }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>💸 Retiros</h1>
        <span className="page-subtitle">Solicitudes de retiro de proveedores</span>
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
                  <th>Proveedor</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Datos de pago</th>
                  <th>Saldo actual</th>
                  <th>Solicitado</th>
                  {status === 'pending'   && <th>Acciones</th>}
                  {status === 'completed' && <th>Procesado por</th>}
                  {status === 'rejected'  && <th>Motivo</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="empty">No hay retiros {status === 'pending' ? 'pendientes' : ''}</td></tr>
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
                    <td><strong className="amount">${parseFloat(r.amount).toFixed(2)}</strong></td>
                    <td><span className="badge badge-blue">{r.payment_method_name || r.payment_method_type || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 200 }}>
                      <span style={{ wordBreak: 'break-all' }}>{getPayoutInfo(r)}</span>
                    </td>
                    <td>
                      <span className={`amount`} style={{ color: parseFloat(r.current_balance) >= parseFloat(r.amount) ? 'var(--green)' : 'var(--red)' }}>
                        ${parseFloat(r.current_balance || 0).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(r.created_at)}</td>
                    {status === 'pending' && (
                      <td>
                        <div className="action-btns">
                          <button className="btn-approve" onClick={() => { setSel(r); setModal('approve'); }}>✓ Pagar</button>
                          <button className="btn-reject"  onClick={() => { setSel(r); setModal('reject');  }}>✕ Rechazar</button>
                        </div>
                      </td>
                    )}
                    {status === 'completed' && (
                      <td>
                        <div className="user-cell">
                          <span>{r.processed_by_name || '—'}</span>
                          <span style={{ fontSize: 11 }}>{fmt(r.processed_at)}</span>
                        </div>
                      </td>
                    )}
                    {status === 'rejected' && (
                      <td><span className="reject-reason">{r.admin_notes}</span></td>
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
            <h2>✅ Confirmar pago de retiro</h2>
            <p>¿Confirmas que pagaste <strong className="amount">${parseFloat(selected.amount).toFixed(2)}</strong> a <strong>{selected.full_name}</strong>?</p>
            <div className="info-grid" style={{ marginTop: 14 }}>
              <div className="info-item"><label>Método</label><span>{selected.payment_method_name || '—'}</span></div>
              <div className="info-item"><label>Saldo actual</label><span className="amount">${parseFloat(selected.current_balance || 0).toFixed(2)}</span></div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>
              {getPayoutInfo(selected)}
            </div>
            <p style={{ color: 'var(--yellow)', fontSize: 13, marginTop: 10 }}>
              ⚠️ Esto descontará ${parseFloat(selected.amount).toFixed(2)} del saldo del proveedor.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-approve-lg" onClick={approve} disabled={actionL}>
                {actionL ? 'Procesando...' : '✓ Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reject' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>❌ Rechazar retiro</h2>
            <p>Retiro de <strong className="amount">${parseFloat(selected.amount).toFixed(2)}</strong> de <strong>{selected.full_name}</strong></p>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Motivo del rechazo *</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ej: Datos de pago incorrectos, saldo insuficiente..." />
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
