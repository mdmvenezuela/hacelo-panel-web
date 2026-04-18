// src/pages/Zones.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const EMPTY_ZONE_FORM = {
  name: '', slug: '', state: 'Zulia',
  latCenter: '', lngCenter: '', radiusKm: 15, sortOrder: 0,
};

const ZULIA_MUNICIPIOS = [
  { name: 'Cabimas',       slug: 'cabimas',       lat: 10.3997,  lng: -71.4561 },
  { name: 'Maracaibo',     slug: 'maracaibo',     lat: 10.6666,  lng: -71.6124 },
  { name: 'Ciudad Ojeda',  slug: 'ciudad-ojeda',  lat: 10.1978,  lng: -71.3086 },
  { name: 'Lagunillas',    slug: 'lagunillas',    lat: 10.1333,  lng: -71.2500 },
  { name: 'San Francisco', slug: 'san-francisco', lat: 10.6059,  lng: -71.6442 },
  { name: 'Machiques',     slug: 'machiques',     lat: 10.0617,  lng: -72.5561 },
];

export default function Zones() {
  const [zones, setZones]         = useState([]);
  const [loading, setL]           = useState(false);
  const [zoneModal, setZoneModal] = useState(null); // 'create' | 'edit'
  const [selZone, setSelZone]     = useState(null);
  const [zoneForm, setZoneForm]   = useState(EMPTY_ZONE_FORM);
  const [zoneSaving, setZoneSave] = useState(false);
  const [zoneError, setZoneErr]   = useState('');

  // Sectores
  const [sectors, setSectors]         = useState([]);
  const [sectorsLoading, setSectLoad] = useState(false);
  const [activeSectZone, setActiveSZ] = useState(null); // zona activa en panel sectores
  const [sectModal, setSectModal]     = useState(null);  // 'create' | 'edit'
  const [selSect, setSelSect]         = useState(null);
  const [sectForm, setSectForm]       = useState({ name: '', slug: '', sortOrder: 0 });
  const [sectSaving, setSectSave]     = useState(false);
  const [sectError, setSectErr]       = useState('');

  const loadZones = async () => {
    setL(true);
    try { const r = await api.get('/zones'); setZones(r.data); }
    finally { setL(false); }
  };

  const loadSectors = async (zoneId) => {
    setSectLoad(true);
    try {
      const r = await api.get(`/sectors?zoneId=${zoneId}`);
      setSectors(r.data);
    } finally { setSectLoad(false); }
  };

  useEffect(() => { loadZones(); }, []);

  useEffect(() => {
    if (activeSectZone) loadSectors(activeSectZone.id);
  }, [activeSectZone]);

  // ── Zonas ──────────────────────────────────────────────────
  const openCreateZone = () => { setZoneForm(EMPTY_ZONE_FORM); setZoneErr(''); setZoneModal('create'); };
  const openEditZone   = (z) => {
    setZoneForm({ name: z.name, slug: z.slug, state: z.state,
      latCenter: z.lat_center, lngCenter: z.lng_center,
      radiusKm: z.radius_km, sortOrder: z.sort_order });
    setSelZone(z); setZoneErr(''); setZoneModal('edit');
  };
  const applyPreset = (p) => setZoneForm(f => ({ ...f, name: p.name, slug: p.slug, state: 'Zulia', latCenter: p.lat, lngCenter: p.lng }));

  const saveZone = async (e) => {
    e.preventDefault(); setZoneErr(''); setZoneSave(true);
    try {
      if (zoneModal === 'create') await api.post('/zones', zoneForm);
      else await api.patch(`/zones/${selZone.id}`, zoneForm);
      setZoneModal(null); loadZones();
    } catch (err) { setZoneErr(err.message); }
    finally { setZoneSave(false); }
  };

  const toggleZone = async (z) => {
    try { await api.patch(`/zones/${z.id}`, { isActive: !z.is_active }); loadZones(); }
    catch (err) { alert(err.message); }
  };

  // ── Sectores ───────────────────────────────────────────────
  const openCreateSect = () => {
    setSectForm({ name: '', slug: '', sortOrder: sectors.length + 1 });
    setSectErr(''); setSectModal('create');
  };
  const openEditSect = (s) => {
    setSectForm({ name: s.name, slug: s.slug, sortOrder: s.sort_order });
    setSelSect(s); setSectErr(''); setSectModal('edit');
  };

  const saveSector = async (e) => {
    e.preventDefault(); setSectErr(''); setSectSave(true);
    try {
      if (sectModal === 'create') {
        await api.post('/sectors', { ...sectForm, zoneId: activeSectZone.id });
      } else {
        await api.patch(`/sectors/${selSect.id}`, sectForm);
      }
      setSectModal(null); loadSectors(activeSectZone.id);
    } catch (err) { setSectErr(err.message); }
    finally { setSectSave(false); }
  };

  const toggleSector = async (s) => {
    try { await api.patch(`/sectors/${s.id}`, { isActive: !s.is_active }); loadSectors(activeSectZone.id); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🗺️ Zonas y Sectores</h1>
        <span className="page-subtitle">Municipios y sectores de operación</span>
      </div>

      {/* ── ZONAS ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>Municipios</div>
        <button className="btn-icon" onClick={openCreateZone}>+ Nueva zona</button>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        fontSize: 13, color: 'var(--text2)',
      }}>
        💡 Haz clic en <strong style={{ color: 'var(--orange)' }}>Ver sectores</strong> de cualquier municipio para gestionar sus sectores.
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <div className="table-wrap" style={{ marginBottom: 32 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Estado</th>
                <th>Centro</th>
                <th>Radio</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr><td colSpan={7} className="empty">No hay zonas</td></tr>
              )}
              {zones.map(z => (
                <tr key={z.id} style={{ background: activeSectZone?.id === z.id ? 'var(--orange-dim)' : '' }}>
                  <td>
                    <div className="user-cell">
                      <strong>{z.name}</strong>
                      <span style={{ fontSize: 11 }}>{z.slug}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{z.state}</td>
                  <td>
                    <a href={`https://maps.google.com/?q=${z.lat_center},${z.lng_center}`}
                      target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <code className="ref">
                        {parseFloat(z.lat_center).toFixed(4)}, {parseFloat(z.lng_center).toFixed(4)} ↗
                      </code>
                    </a>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{z.radius_km} km</td>
                  <td><span className="badge badge-blue">{z.user_count || 0}</span></td>
                  <td>
                    <span className={`badge ${z.is_active ? 'badge-green' : 'badge-red'}`}>
                      {z.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" style={{ fontSize: 12, color: 'var(--orange)' }}
                        onClick={() => setActiveSectZone(activeSectZone?.id === z.id ? null : z)}>
                        {activeSectZone?.id === z.id ? '▲ Ocultar' : '▼ Sectores'}
                      </button>
                      <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => openEditZone(z)}>✏️</button>
                      <button className={z.is_active ? 'btn-reject' : 'btn-approve'}
                        style={{ fontSize: 12 }} onClick={() => toggleZone(z)}>
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

      {/* ── SECTORES del municipio activo ── */}
      {activeSectZone && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="section-title" style={{ margin: 0 }}>
                📍 Sectores de {activeSectZone.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                Estos sectores aparecen en la app para que los proveedores definan su cobertura
              </div>
            </div>
            <button className="btn-icon" onClick={openCreateSect}>+ Nuevo sector</button>
          </div>

          {sectorsLoading ? <div className="page-loading">Cargando sectores...</div> : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Slug</th>
                    <th>Orden</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.length === 0 && (
                    <tr><td colSpan={5} className="empty">No hay sectores para este municipio</td></tr>
                  )}
                  {sectors.map(s => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text)', fontWeight: 600 }}>📍 {s.name}</td>
                      <td><code className="ref">{s.slug}</code></td>
                      <td style={{ color: 'var(--text3)' }}>{s.sort_order}</td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                          {s.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" style={{ fontSize: 12 }} onClick={() => openEditSect(s)}>✏️ Editar</button>
                          <button className={s.is_active ? 'btn-reject' : 'btn-approve'}
                            style={{ fontSize: 12 }} onClick={() => toggleSector(s)}>
                            {s.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal zona */}
      {zoneModal && (
        <div className="modal-overlay" onClick={() => setZoneModal(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <h2>{zoneModal === 'create' ? '+ Nueva zona' : `✏️ Editar — ${selZone?.name}`}</h2>
            {zoneError && <div className="alert-error" style={{ marginBottom: 14 }}>{zoneError}</div>}
            {zoneModal === 'create' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Precargar municipio
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ZULIA_MUNICIPIOS.map(p => (
                    <button key={p.slug} type="button" onClick={() => applyPreset(p)}
                      style={{ background: zoneForm.slug === p.slug ? 'var(--orange)' : 'var(--surface2)',
                        border: `1px solid ${zoneForm.slug === p.slug ? 'var(--orange)' : 'var(--border)'}`,
                        borderRadius: 6, color: zoneForm.slug === p.slug ? '#fff' : 'var(--text2)',
                        padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={saveZone}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Municipio *</label>
                  <input required value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Cabimas" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Slug *</label>
                  <input required value={zoneForm.slug}
                    onChange={e => setZoneForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="Ej: cabimas" disabled={zoneModal === 'edit'} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Estado</label>
                  <input value={zoneForm.state} onChange={e => setZoneForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Radio (km)</label>
                  <input type="number" step="0.5" value={zoneForm.radiusKm}
                    onChange={e => setZoneForm(f => ({ ...f, radiusKm: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Latitud *</label>
                  <input required type="number" step="any" value={zoneForm.latCenter}
                    onChange={e => setZoneForm(f => ({ ...f, latCenter: e.target.value }))} placeholder="10.3997" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Longitud *</label>
                  <input required type="number" step="any" value={zoneForm.lngCenter}
                    onChange={e => setZoneForm(f => ({ ...f, lngCenter: e.target.value }))} placeholder="-71.4561" />
                </div>
              </div>
              {zoneForm.latCenter && zoneForm.lngCenter && (
                <a href={`https://maps.google.com/?q=${zoneForm.latCenter},${zoneForm.lngCenter}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'block', marginTop: 10, fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>
                  📍 Ver en Google Maps ↗
                </a>
              )}
              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setZoneModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} disabled={zoneSaving}>
                  {zoneSaving ? 'Guardando...' : zoneModal === 'create' ? 'Crear zona' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sector */}
      {sectModal && (
        <div className="modal-overlay" onClick={() => setSectModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2>{sectModal === 'create' ? `+ Nuevo sector en ${activeSectZone?.name}` : `✏️ Editar sector`}</h2>
            {sectError && <div className="alert-error" style={{ marginBottom: 14 }}>{sectError}</div>}
            <form onSubmit={saveSector}>
              <div className="form-group">
                <label>Nombre del sector *</label>
                <input required value={sectForm.name}
                  onChange={e => setSectForm(f => ({
                    ...f, name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u' })[c] || c)
                  }))}
                  placeholder="Ej: Centro" />
              </div>
              <div className="form-group">
                <label>Slug *</label>
                <input required value={sectForm.slug}
                  onChange={e => setSectForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="Ej: centro" />
              </div>
              <div className="form-group">
                <label>Orden</label>
                <input type="number" value={sectForm.sortOrder}
                  onChange={e => setSectForm(f => ({ ...f, sortOrder: parseInt(e.target.value) }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setSectModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} disabled={sectSaving}>
                  {sectSaving ? 'Guardando...' : sectModal === 'create' ? 'Crear sector' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
