// src/pages/PaymentMethods.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const TYPE_LABEL = {
  pago_movil:    { label: 'Pago Móvil',     badge: 'badge-orange' },
  zelle:         { label: 'Zelle',          badge: 'badge-blue'   },
  binance:       { label: 'Binance Pay',    badge: 'badge-yellow' },
  bank_transfer: { label: 'Transferencia',  badge: 'badge-gray'   },
  other:         { label: 'Otro',           badge: 'badge-gray'   },
};

const EMPTY_FIELD = { label: '', value: '', copyable: false };

const EMPTY_FORM = {
  name: '', type: 'pago_movil', currency: 'USD',
  instructions: '', minAmount: 1, maxAmount: 1000,
  verificationTime: '1-4 horas', sortOrder: 0,
  fields: [],
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

  const parseFields = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try { return JSON.parse(raw); } catch { return []; }
  };

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
      fields:           parseFields(pm.fields),
    });
    setSel(pm); setError(''); setModal('edit');
  };

  // ── Handlers de fields ───────────────────────────────────
  const addField = () =>
    setForm(f => ({ ...f, fields: [...f.fields, { ...EMPTY_FIELD }] }));

  const removeField = (i) =>
    setForm(f => ({ ...f, fields: f.fields.filter((_, idx) => idx !== i) }));

  const updateField = (i, key, value) =>
    setForm(f => ({
      ...f,
      fields: f.fields.map((field, idx) =>
        idx === i ? { ...field, [key]: value } : field
      ),
    }));

  const moveField = (i, dir) => {
    const arr = [...form.fields];
    const j   = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setForm(f => ({ ...f, fields: arr }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      // Validar que todos los fields tengan label y value
      const invalid = form.fields.some(f => !f.label.trim() || !f.value.trim());
      if (invalid) { setError('Todos los campos de detalle deben tener etiqueta y valor.'); setSaving(false); return; }

      const payload = { ...form, fields: form.fields };
      if (modal === 'create') {
        await api.post('/payment-methods', payload);
      } else {
        await api.patch(`/payment-methods/${selected.id}`, payload);
      }
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (pm) => {
    try { await api.patch(`/payment-methods/${pm.id}`, { isActive: !pm.is_active }); load(); }
    catch (err) { alert(err.message); }
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
                <th>Monto mín/máx</th>
                <th>Tiempo verificación</th>
                <th>Detalles de pago</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="empty">No hay métodos de pago configurados</td></tr>
              )}
              {rows.map(pm => {
                const t      = TYPE_LABEL[pm.type] || TYPE_LABEL.other;
                const fields = parseFields(pm.fields);
                return (
                  <tr key={pm.id}>
                    <td>
                      <div className="user-cell">
                        <strong>{pm.name}</strong>
                        <span style={{ fontSize: 11 }}><span className={`badge ${t.badge}`}>{t.label}</span></span>
                      </div>
                    </td>
                    <td><span className={`badge ${t.badge}`}>{t.label}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      ${parseFloat(pm.min_amount).toFixed(2)} — ${parseFloat(pm.max_amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{pm.verification_time}</td>
                    <td>
                      {fields.length === 0
                        ? <span style={{ color: 'var(--text3)', fontSize: 12 }}>Sin detalles</span>
                        : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {fields.map((f, i) => (
                              <div key={i} style={{ fontSize: 12, color: 'var(--text2)' }}>
                                <span style={{ color: 'var(--text3)' }}>{f.label}:</span>{' '}
                                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{f.value}</span>
                                {f.copyable && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--blue)' }}>📋</span>}
                              </div>
                            ))}
                          </div>
                        )
                      }
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

      {/* ── Modal crear/editar ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal"
            style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>

            <h2>{modal === 'create' ? '+ Nuevo método de pago' : `✏️ Editar — ${selected?.name}`}</h2>

            {error && <div className="alert-error" style={{ marginBottom: 14 }}>{error}</div>}

            <form onSubmit={save}>
              {/* ── Info básica ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Nombre *</label>
                  <input required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Pago Móvil Bancamiga" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Tipo *</label>
                  <select value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
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
                  <label>Orden</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) }))} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Instrucciones para el usuario</label>
                <textarea rows={3} value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Ej: Enviar pago al número indicado y adjuntar captura de pantalla." />
              </div>

              {/* ── Detalles de pago (fields) ── */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Detalles de pago
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      Datos que el usuario verá al hacer una recarga. 📋 = el usuario puede copiar el valor.
                    </div>
                  </div>
                  <button type="button" className="btn-icon" style={{ fontSize: 12, flexShrink: 0 }} onClick={addField}>
                    + Agregar campo
                  </button>
                </div>

                {form.fields.length === 0 && (
                  <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Sin detalles. Agrega los datos de pago que el usuario necesita.
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.fields.map((field, i) => (
                    <div key={i} style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr auto auto auto',
                      gap: 8,
                      alignItems: 'center',
                    }}>
                      {/* Etiqueta */}
                      <input
                        value={field.label}
                        onChange={e => updateField(i, 'label', e.target.value)}
                        placeholder="Etiqueta (Ej: Banco)"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border2)',
                          borderRadius: 6,
                          color: 'var(--text)',
                          fontSize: 13,
                          padding: '7px 10px',
                          outline: 'none',
                        }}
                      />
                      {/* Valor */}
                      <input
                        value={field.value}
                        onChange={e => updateField(i, 'value', e.target.value)}
                        placeholder="Valor (Ej: Bancamiga)"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border2)',
                          borderRadius: 6,
                          color: 'var(--text)',
                          fontSize: 13,
                          padding: '7px 10px',
                          outline: 'none',
                        }}
                      />
                      {/* Copyable toggle */}
                      <button
                        type="button"
                        title={field.copyable ? 'El usuario puede copiar este valor' : 'No copiable'}
                        onClick={() => updateField(i, 'copyable', !field.copyable)}
                        style={{
                          background: field.copyable ? 'var(--blue-dim)' : 'var(--surface3)',
                          border: `1px solid ${field.copyable ? 'var(--blue)' : 'var(--border)'}`,
                          borderRadius: 6,
                          color: field.copyable ? 'var(--blue)' : 'var(--text3)',
                          padding: '7px 10px',
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        📋
                      </button>
                      {/* Mover */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button type="button"
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '1px 4px', opacity: i === 0 ? 0.3 : 1 }}>
                          ▲
                        </button>
                        <button type="button"
                          onClick={() => moveField(i, 1)}
                          disabled={i === form.fields.length - 1}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '1px 4px', opacity: i === form.fields.length - 1 ? 0.3 : 1 }}>
                          ▼
                        </button>
                      </div>
                      {/* Eliminar */}
                      <button type="button"
                        onClick={() => removeField(i)}
                        style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 6, color: 'var(--red)', padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
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
