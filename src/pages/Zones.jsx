// src/pages/Zones.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const EMPTY_FORM = {
  name: '', slug: '', state: 'Zulia',
  latCenter: '', lngCenter: '', radiusKm: 15, sortOrder: 0,
};

// Municipios de Zulia precargados para referencia rápida
const ZULIA_MUNICIPIOS = [
  { name: 'Cabimas',        slug: 'cabimas',        lat: 10.3997,  lng: -71.4561 },
  { name: 'Maracaibo',      slug: 'maracaibo',      lat: 10.6666,  lng: -71.6124 },
  { name: 'Ciudad Ojeda',   slug: 'ciudad-ojeda',   lat: 10.1978,  lng: -71.3086 },
  { name: 'Lagunillas',     slug: 'lagunillas',     lat: 10.1333,  lng: -71.2500 },
  { name: 'Punto Fijo',     slug: 'punto-fijo',     lat: 11.7005,  lng: -70.2178 },
  { name: 'Barquisimeto',   slug: 'barquisimeto',   lat: 10.0678,  lng: -69.3467 },
  { name: 'San Francisco',  slug: 'san-francisco',  lat: 10.6059,  lng: -71.6442 },
  { name: 'Machiques',      slug: 'machiques',      lat: 10.0617,  lng: -72.5561 },
];

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
    try {
      const r = await api.get('/zones');
      setRows(r.data);
    } catch (err) {
      console.error('Error cargando zonas:', err.message);
    } finally { setL(false); }
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

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      name:      preset.name,
      slug:      preset.slug,
      state:     'Zulia',
      latCenter: preset.lat,
      lngCenter: preset.lng,
    }));
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

      {/* Info box */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '14px 16px', marginBottom: 20,
        fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
      }}>
        💡 <strong style={{ color: 'var(--text)' }}>¿Cómo obtener coordenadas?</strong>{' '}
        Ve a <a href="https://maps.google.com" target="_blank" rel="noreferrer"
          style={{ color: 'var(--orange)' }}>Google Maps</a>,
        busca el municipio, haz clic derecho en el centro → copia las coordenadas.
        El <strong>radio</strong> determina cuántos km alrededor del centro cubre la zona
        (Cabimas completa ≈ 15 km).
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
                  <td>
                    <div className="user-cell">
                      <strong>{z.name}</strong>
                      <span style={{ fontSize: 11 }}>{z.slug}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{z.state}</td>
                  <td>
                    <a
                      href={`https://maps.google.com/?q=${z.lat_center},${z.lng_center}`}
                      target="_blank" rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <code className="ref">
                        {parseFloat(z.lat_center).toFixed(4)}, {parseFloat(z.lng_center).toFixed(4)} ↗
                      </code>
                    </a>
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

      {/* Modal crear/editar */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h2>{modal === 'create' ? '+ Nueva zona' : `✏️ Editar — ${selected?.name}`}</h2>

            {error && <div className="alert-error" style={{ marginBottom: 14 }}>{error}</div>}

            {/* Municipios rápidos (solo en crear) */}
            {modal === 'create' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Municipios de Zulia — clic para precargar
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ZULIA_MUNICIPIOS.map(p => (
                    <button key={p.slug} type="button"
                      onClick={() => applyPreset(p)}
                      style={{
                        background: form.slug === p.slug ? 'var(--orange)' : 'var(--surface2)',
                        border: `1px solid ${form.slug === p.slug ? 'var(--orange)' : 'var(--border)'}`,
                        borderRadius: 6, color: form.slug === p.slug ? '#fff' : 'var(--text2)',
                        padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
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
                  <label>Radio de cobertura (km)</label>
                  <input type="number" step="0.5" min="1" value={form.radiusKm}
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Orden</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  {form.latCenter && form.lngCenter && (
                    <a href={`https://maps.google.com/?q=${form.latCenter},${form.lngCenter}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                      📍 Ver en Google Maps ↗
                    </a>
                  )}
                </div>
              </div>

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
