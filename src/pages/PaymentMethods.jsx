// src/pages/PaymentMethods.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const TYPE_LABEL = {
  pago_movil:    { label: 'Pago Móvil',         badge: 'badge-orange' },
  zelle:         { label: 'Zelle',               badge: 'badge-blue'   },
  binance:       { label: 'Binance Pay',         badge: 'badge-yellow' },
  bank_transfer: { label: 'Transferencia',       badge: 'badge-gray'   },
  other:         { label: 'Otro',                badge: 'badge-gray'   },
};

const EMPTY_FORM = {
  name: '', type: 'pago_movil', currency: 'USD',
  instructions: '', minAmount: 1, maxAmount: 1000,
  verificationTime: '1-4 horas', sortOrder: 0,
};

export default function PaymentMethods() {
  const [rows, setRows]       = useState([]);
  const [loading, setL]       = useState(false);
  const [modal, setModal]     = useState(null); // 'create' | 'edit'
  const [selected, setSel]    = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setL(true);
    try { const r = await api.get('/payment-methods'); setRows(r.data); }
    finally { setL(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM); setError(''); setModal('create');
  };

  const openEdit = (pm) => {
    setForm({
      name:             pm.name,
      type:             pm.type,
      currency:         pm.currency,
      instructions:     pm.instructions || '',
      minAmount:        pm.min_amount,
      maxAmount:        pm.max_amount,
      verificationTime: pm.verification_time,
      sortOrder:        pm.sort_order,
    });
    setSel(pm); setError(''); setModal('edit');
  };

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/payment-methods', form);
      } else {
        await api.patch(`/payment-methods/${selected.id}`, form);
      }
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (pm) => {
    try {
      await api.patch(`/payment-methods/${pm.id}`, { isActive: !pm.is_active });
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>💳 Métodos de Pago</h1>
        <span className="page-subtitle">Configuración de métodos disponibles para recargas</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button className="btn-icon" onClick={openCreate}>+ Nuevo método</button>
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Moneda</th>
                <th>Monto mín/máx</th>
                <th>Tiempo verificación</th>
                <th>Instrucciones</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="empty">No hay métodos de pago configurados</td></tr>
              )}
              {rows.map(pm => {
                const t = TYPE_LABEL[pm.type] || TYPE_LABEL.other;
                return (
                  <tr key={pm.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{pm.name}</td>
                    <td><span className={`badge ${t.badge}`}>{t.label}</span></td>
                    <td><code className="ref">{pm.currency}</code></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      ${parseFloat(pm.min_amount).toFixed(2)} — ${parseFloat(pm.max_amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{pm.verification_time}</td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pm.instructions || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${pm.is_active ? 'badge-green' : 'badge-red'}`}>
                        {pm.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => openEdit(pm)}>
                          ✏️ Editar
                        </button>
                        <button
                          className={pm.is_active ? 'btn-reject' : 'btn-approve'}
                          style={{ fontSize: 12 }}
                          onClick={() => toggleActive(pm)}
                        >
                          {pm.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <h2>{modal === 'create' ? '+ Nuevo método de pago' : '✏️ Editar método'}</h2>
            {error && <div className="alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nombre *</label>
                  <input required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Pago Móvil Banesco" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tipo *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    disabled={modal === 'edit'}>
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="zelle">Zelle</option>
                    <option value="binance">Binance Pay</option>
                    <option value="bank_transfer">Transferencia bancaria</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Monto mínimo ($)</label>
                  <input type="number" step="0.01" value={form.minAmount}
                    onChange={e => setForm(f => ({ ...f, minAmount: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Monto máximo ($)</label>
                  <input type="number" step="0.01" value={form.maxAmount}
                    onChange={e => setForm(f => ({ ...f, maxAmount: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tiempo de verificación</label>
                  <input value={form.verificationTime}
                    onChange={e => setForm(f => ({ ...f, verificationTime: e.target.value }))}
                    placeholder="Ej: 1-4 horas" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Orden (sort)</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Instrucciones para el usuario</label>
                <textarea rows={4} value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Ej: Enviar al número 0414-1234567 a nombre de Hacelo C.A. RIF J-12345678-9. Adjuntar captura de pantalla del pago." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary"
                  onClick={() => { setModal(null); setError(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary"
                  style={{ width: 'auto', padding: '10px 24px' }} disabled={saving}>
                  {saving ? 'Guardando...' : modal === 'create' ? 'Crear método' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
