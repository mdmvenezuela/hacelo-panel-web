// src/pages/KYC.jsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleString('es-VE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
const TABS = ['pending', 'approved', 'rejected'];
const TAB_LABEL = { pending: '⏳ Pendientes', approved: '✅ Aprobadas', rejected: '❌ Rechazadas' };
const DOC_LABELS = {
  selfie_url: 'Selfie', id_front_url: 'Cédula frente', id_back_url: 'Cédula dorso',
  rif_url: 'RIF', video_selfie_url: 'Video selfie',
};

export default function KYC() {
  const [status, setStatus]   = useState('pending');
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setL]       = useState(false);
  const [selected, setSel]    = useState(null);
  const [modal, setModal]     = useState(null);
  const [reason, setReason]   = useState('');
  const [actionL, setActionL] = useState(false);
  const [lightbox, setLb]     = useState(null);

  const load = useCallback(async () => {
    setL(true);
    try {
      const r = await api.get(`/kyc?status=${status}&page=${page}&limit=20`);
      setRows(r.data); setTotal(r.total);
    } finally { setL(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const approve = async () => {
    setActionL(true);
    try { await api.post(`/kyc/${selected.id}/approve`); setModal(null); setSel(null); load(); }
    catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  const reject = async () => {
    if (!reason.trim()) { alert('Ingresa el motivo'); return; }
    setActionL(true);
    try { await api.post(`/kyc/${selected.id}/reject`, { reason }); setModal(null); setSel(null); setReason(''); load(); }
    catch (err) { alert(err.message); }
    finally { setActionL(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🪪 Verificación KYC</h1>
        <span className="page-subtitle">Revisión de identidad de proveedores</span>
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
                  <th>Nombre en doc.</th>
                  <th>Cédula</th>
                  <th>Enviado</th>
                  <th>Documentos</th>
                  {status === 'pending'  && <th>Acciones</th>}
                  {status === 'approved' && <th>Aprobado por</th>}
                  {status === 'rejected' && <th>Rechazado por</th>}
                  {status !== 'pending'  && <th>Motivo/Fecha</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="empty">No hay solicitudes {status}</td></tr>
                )}
                {rows.map(k => (
                  <tr key={k.id}>
                    <td>
                      <div className="user-cell">
                        <strong>{k.full_name}</strong>
                        <span>{k.email}</span>
                        {k.phone && <span>{k.phone}</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text)' }}>{k.full_name_doc || '—'}</td>
                    <td><code className="ref">{k.id_number || '—'}</code></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(k.submitted_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(DOC_LABELS).map(([key, label]) => k[key] && (
                          key === 'video_selfie_url' ? (
                            <a key={key} href={k[key]} target="_blank" rel="noreferrer"
                              className="badge badge-blue" style={{ cursor:'pointer', textDecoration:'none' }}>
                              🎥 Video
                            </a>
                          ) : (
                            <span key={key} className="badge badge-gray"
                              style={{ cursor: 'zoom-in' }} onClick={() => setLb(k[key])}>
                              🖼 {label}
                            </span>
                          )
                        ))}
                      </div>
                    </td>
                    {status === 'pending' && (
                      <td>
                        <div className="action-btns">
                          <button className="btn-approve" onClick={() => { setSel(k); setModal('approve'); }}>✓ Aprobar</button>
                          <button className="btn-reject"  onClick={() => { setSel(k); setModal('reject');  }}>✕ Rechazar</button>
                        </div>
                      </td>
                    )}
                    {status !== 'pending' && (
                      <td>
                        <div className="user-cell">
                          <strong style={{ color: status === 'approved' ? 'var(--green)' : 'var(--red)' }}>
                            {k.reviewed_by_name || '—'}
                          </strong>
                          <span>{fmt(k.reviewed_at)}</span>
                        </div>
                      </td>
                    )}
                    {status !== 'pending' && (
                      <td>
                        {status === 'rejected'
                          ? <span className="reject-reason">{k.rejection_reason}</span>
                          : <span className="badge badge-green">Verificado</span>
                        }
                      </td>
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

      {lightbox && <div className="lightbox" onClick={() => setLb(null)}><img src={lightbox} alt="Documento" /></div>}

      {modal === 'approve' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✅ Aprobar KYC</h2>
            <p>¿Confirmas la verificación de <strong>{selected.full_name}</strong>?</p>
            <div className="info-grid" style={{ marginTop: 12 }}>
              <div className="info-item"><label>Nombre en doc.</label><span>{selected.full_name_doc || '—'}</span></div>
              <div className="info-item"><label>Cédula</label><span>{selected.id_number || '—'}</span></div>
            </div>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 8 }}>
              Se activará su cuenta como proveedor y recibirá una notificación.
            </p>
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
            <h2>❌ Rechazar KYC</h2>
            <p>Rechazo de verificación de <strong>{selected.full_name}</strong></p>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Motivo del rechazo *</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ej: Foto de cédula ilegible, selfie no coincide con documento..." />
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
