// src/pages/Orders.jsx
import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

const fmt = d => d ? new Date(d).toLocaleString('es-VE', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

const STATUS_MAP = {
  requested:     { label: 'Pendiente',    cls: 'badge-yellow'  },
  accepted:      { label: 'Aceptada',     cls: 'badge-blue'    },
  in_conversation:{ label: 'Coordinando', cls: 'badge-blue'    },
  on_the_way:    { label: 'En camino',    cls: 'badge-blue'    },
  diagnosing:    { label: 'Revisando',    cls: 'badge-orange'  },
  quote_sent:    { label: 'Presupuesto',  cls: 'badge-orange'  },
  in_progress:   { label: 'En trabajo',   cls: 'badge-orange'  },
  completed:     { label: 'Completada',   cls: 'badge-blue'    },
  confirmed:     { label: 'Confirmada',   cls: 'badge-green'   },
  cancelled:     { label: 'Cancelada',    cls: 'badge-red'     },
  disputed:      { label: 'Disputada',    cls: 'badge-red'     },
};

const ALL_STATUSES = Object.keys(STATUS_MAP);

export default function Orders() {
  const [rows, setRows]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setL]     = useState(false);

  const load = useCallback(async () => {
    setL(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const r = await api.get(`/orders?${params}`);
      setRows(r.data); setTotal(r.total);
    } finally { setL(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>📋 Órdenes</h1>
        <span className="page-subtitle">{total} órdenes en total</span>
      </div>

      <div className="filter-bar">
        <input placeholder="Buscar por cliente, proveedor o título..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_MAP[s].label}</option>
          ))}
        </select>
        <button className="btn-icon" onClick={load}>↻ Actualizar</button>
      </div>

      {loading ? <div className="page-loading">Cargando...</div> : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Proveedor</th>
                  <th>Categoría</th>
                  <th>Visita</th>
                  <th>Trabajo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="empty">No hay órdenes</td></tr>
                )}
                {rows.map(o => {
                  const st = STATUS_MAP[o.status] || { label: o.status, cls: 'badge-gray' };
                  return (
                    <tr key={o.id}>
                      <td>
                        <code className="ref">#{String(o.order_number || '').padStart(6, '0')}</code>
                        {o.is_urgent && <span style={{ marginLeft: 4, color: 'var(--red)', fontSize: 10 }}>⚡</span>}
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.title}
                        </div>
                      </td>
                      <td><span style={{ color: 'var(--text)' }}>{o.client_name}</span></td>
                      <td><span style={{ color: 'var(--text2)' }}>{o.provider_name || '—'}</span></td>
                      <td><span style={{ color: 'var(--text3)', fontSize: 12 }}>{o.category_name || '—'}</span></td>
                      <td><span className="amount">${parseFloat(o.visit_price || 0).toFixed(2)}</span></td>
                      <td>
                        {o.work_total
                          ? <span className="amount">${parseFloat(o.work_total).toFixed(2)}</span>
                          : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmt(o.created_at)}</td>
                    </tr>
                  );
                })}
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
    </div>
  );
}
