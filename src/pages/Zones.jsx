// src/pages/Zones.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const EMPTY_FORM = {
  name: '', slug: '', state: 'Zulia',
  latCenter: '', lngCenter: '', radiusKm: 15, sortOrder: 0,
};

export default function Zones() {
  const [rows, setRows]     = useState([]);
  const [loading, setL]     = useState(false);
  const [modal, setModal]   = useState(null);
  const [selected, setSel]  = useState(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = async () => {
    setL(true);
    try { const r = await api.get('/zones'); setRows(r.data); }
    finally { setL(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };

  const openEdit = (z) => {
    setForm({
      name:      z.name,
      slug:      z.slug,
      state:     z.state,
      latCenter: z.lat_center,
      lngCenter: z.lng_center,
      radiusKm:  z.radius_km,
      sortOrder: z.sort_order,
    });
    setSel(z); setError(''); setModal('edit');
  };

  const save = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'create') await api.post('/zones', form);
      else await api.patch(`/zones/${selected.id}`, form);
      setModal(null); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggle = async (z) => {
    try { await api.patch(`/zones/${z.id}`, { isActive: !z.is_active }); load(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🗺️ Zonas</h1>
        <span className="page-subtitle">Municipios y áreas de operación</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button className="btn-icon" onClick={openCreate}>+ Nueva zona</button>
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Estado</th>
                <th>Centro (lat, lng)</th>
                <th>Radio</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="empty">No hay zonas configuradas</td></tr>
              )}
              {rows.map(z => (
                <tr key={z.id}>
                  <td style={{ color: 'var(--text)', fontWeight: 700 }}>{z.name}</td>
                  <td style={{ color: 'var(--text2)' }}>{z.state}</td>
                  <td>
                    <code className="ref">
                      {parseFloat(z.lat_center).toFixed(4)}, {parseFloat(z.lng_center).toFixed(4)}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{z.radius_km} km</td>
                  <td>
                    <span className="badge badge-blue">{z.user_count || 0} usuarios</span>
                  </td>
                  <td>
                    <span className={`badge ${z.is_active ? 'badge-green' : 'badge-red'}`}>
                      {z.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => openEdit(z)}>
                        ✏️ Editar
                      </button>
                      <button
                        className={z.is_active ? 'btn-reject' : 'btn-approve'}
                        style={{ fontSize: 12 }}
                        onClick={() => toggle(z)}
                      >
                        {z.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2>{modal === 'create' ? '+ Nueva zona' : `✏️ Editar — ${selected?.name}`}</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
              El centro y radio determinan qué usuarios pertenecen a esta zona.
              Puedes obtener las coordenadas del centro en{' '}
              <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                style={{ color: 'var(--orange)' }}>Google Maps</a>.
            </p>
            {error && <div className="alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Municipio *</label>
                  <input required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Cabimas" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Slug * (sin espacios)</label>
                  <input required value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g,'-') }))}
                    placeholder="Ej: cabimas"
                    disabled={modal === 'edit'} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Estado</label>
                  <input value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="Ej: Zulia" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Radio (km)</label>
                  <input type="number" step="0.5" value={form.radiusKm}
                    onChange={e => setForm(f => ({ ...f, radiusKm: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Latitud centro *</label>
                  <input required type="number" step="any" value={form.latCenter}
                    onChange={e => setForm(f => ({ ...f, latCenter: e.target.value }))}
                    placeholder="Ej: 10.3997" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Longitud centro *</label>
                  <input required type="number" step="any" value={form.lngCenter}
                    onChange={e => setForm(f => ({ ...f, lngCenter: e.target.value }))}
                    placeholder="Ej: -71.4561" />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label>Orden</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) }))} />
                </div>
              </div>

              {/* Preview coordenadas */}
              {form.latCenter && form.lngCenter && (
                <a
                  href={`https://maps.google.com/?q=${form.latCenter},${form.lngCenter}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'block', marginTop: 12, fontSize: 12,
                    color: 'var(--blue)', textDecoration: 'none' }}
                >
                  📍 Ver coordenadas en Google Maps ↗
                </a>
              )}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-secondary"
                  onClick={() => { setModal(null); setError(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary"
                  style={{ width: 'auto', padding: '10px 24px' }} disabled={saving}>
                  {saving ? 'Guardando...' : modal === 'create' ? 'Crear zona' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
