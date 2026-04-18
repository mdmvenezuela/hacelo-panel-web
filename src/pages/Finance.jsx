// src/pages/Finance.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
const today = () => new Date().toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };

const TX_LABELS = {
  recharge:      { label: 'Recarga',          color: '#10B981' },
  visit_block:   { label: 'Reserva visita',   color: '#3B82F6' },
  work_block:    { label: 'Reserva trabajo',  color: '#6366F1' },
  visit_charge:  { label: 'Cobro visita',     color: '#F59E0B' },
  visit_unblock: { label: 'Dev. visita',      color: '#94A3B8' },
  work_release:  { label: 'Pago trabajo',     color: '#FF6B2C' },
  withdrawal:    { label: 'Retiro',           color: '#EF4444' },
  refund:        { label: 'Reembolso',        color: '#8B5CF6' },
};

const Card = ({ title, children, accent }) => (
  <div style={{
    background: 'var(--surface)', border: `1px solid ${accent || 'var(--border)'}`,
    borderRadius: 10, padding: 18, marginBottom: 16,
    borderLeft: accent ? `4px solid ${accent}` : '1px solid var(--border)',
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
      {title}
    </div>
    {children}
  </div>
);

const BigNum = ({ label, value, color, sub }) => (
  <div style={{ textAlign: 'center', padding: '8px 16px' }}>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function Finance() {
  const [data, setData]     = useState(null);
  const [loading, setL]     = useState(false);
  const [from, setFrom]     = useState(monthStart());
  const [to, setTo]         = useState(today());
  const [preset, setPreset] = useState('month');

  const load = async (f, t) => {
    setL(true);
    try {
      const r = await api.get(`/finance?from=${f}&to=${t}`);
      setData(r.data);
    } catch (err) { console.error(err); }
    finally { setL(false); }
  };

  useEffect(() => { load(from, to); }, []);

  const applyPreset = (p) => {
    const now = new Date();
    let f, t = today();
    if (p === 'today') {
      f = today();
    } else if (p === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      f = d.toISOString().split('T')[0];
    } else if (p === 'month') {
      f = monthStart();
    } else if (p === 'year') {
      f = `${now.getFullYear()}-01-01`;
    } else if (p === 'all') {
      f = '2024-01-01';
    }
    setFrom(f); setTo(t); setPreset(p); load(f, t);
  };

  const d = data;
  const netRevenue = d ? d.commissions.totalCommission : 0;
  const cashIn     = d ? d.recharges.total : 0;
  const cashOut    = d ? d.withdrawals.total : 0;
  const netFlow    = cashIn - cashOut;

  return (
    <div className="page">
      <div className="page-header">
        <h1>💹 Finanzas</h1>
        <span className="page-subtitle">Flujo de dinero y ganancias de Hacelo</span>
      </div>

      {/* Filtros */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          {[['today','Hoy'],['week','7 días'],['month','Este mes'],['year','Este año'],['all','Todo']].map(([p, label]) => (
            <button key={p}
              onClick={() => applyPreset(p)}
              style={{
                padding:'6px 14px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer',
                background: preset === p ? 'var(--orange)' : 'var(--surface2)',
                color:      preset === p ? '#fff' : 'var(--text2)',
                border:     `1px solid ${preset === p ? 'var(--orange)' : 'var(--border)'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label style={{ fontSize:11 }}>Desde</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset('custom'); }}
              style={{ padding:'6px 10px', fontSize:13 }} />
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label style={{ fontSize:11 }}>Hasta</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset('custom'); }}
              style={{ padding:'6px 10px', fontSize:13 }} />
          </div>
          <button className="btn-icon" style={{ marginTop:18 }} onClick={() => load(from, to)}>
            🔍 Filtrar
          </button>
        </div>
      </div>

      {loading && <div className="page-loading">Calculando...</div>}

      {!loading && d && (
        <>
          {/* ── KPIs principales ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20 }}>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>💰 Dinero entró</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#10B981' }}>{fmt(cashIn)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{d.recharges.count} recargas</div>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>💸 Dinero salió</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#EF4444' }}>{fmt(cashOut)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{d.withdrawals.count} retiros</div>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>📊 Flujo neto</div>
              <div style={{ fontSize:26, fontWeight:800, color: netFlow >= 0 ? '#10B981' : '#EF4444' }}>{fmt(netFlow)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>entró − salió</div>
            </div>
            <div style={{ background:'linear-gradient(135deg, #FF6B2C22, #FF6B2C11)', border:'2px solid #FF6B2C44', borderRadius:10, padding:16, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#FF6B2C', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700, marginBottom:8 }}>⚡ Ganancia Hacelo</div>
              <div style={{ fontSize:26, fontWeight:800, color:'#FF6B2C' }}>{fmt(netRevenue)}</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{d.commissions.ordersCount} órdenes</div>
            </div>
          </div>

          {/* ── Órdenes y comisiones ── */}
          <Card title="📋 Órdenes y comisiones" accent="#FF6B2C">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:4 }}>
              <BigNum label="Órdenes cobradas"    value={d.commissions.ordersCount}              color="var(--text)" />
              <BigNum label="Volumen de trabajo"  value={fmt(d.commissions.totalWorkVolume)}      color="#3B82F6" />
              <BigNum label="Cobros de visita"    value={fmt(d.commissions.totalVisitRevenue)}    color="#F59E0B" />
              <BigNum label="Comisión ganada"     value={fmt(d.commissions.totalCommission)}      color="#FF6B2C" />
            </div>
          </Card>

          {/* ── Saldo actual en la plataforma ── */}
          <Card title="🏦 Saldo actual en la plataforma" accent="#10B981">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:4 }}>
              <BigNum label="En wallets de clientes"   value={fmt(d.wallets.totalClientBalance)}      color="#3B82F6"
                sub={`${d.byRole?.client?.count || 0} clientes`} />
              <BigNum label="Bloqueado (escrow)"       value={fmt(d.wallets.totalBlocked)}            color="#F59E0B" />
              <BigNum label="En wallets proveedores"   value={fmt(d.byRole?.provider?.balance || 0)}  color="#10B981"
                sub={`${d.byRole?.provider?.count || 0} proveedores`} />
              <BigNum label="Total ganado proveedores" value={fmt(d.wallets.totalEarnedProviders)}     color="#6366F1"
                sub="histórico" />
              <BigNum label="Total retirado"           value={fmt(d.wallets.totalWithdrawnProviders)}  color="#EF4444"
                sub="histórico" />
            </div>
            <div style={{ marginTop:14, padding:12, background:'var(--surface2)', borderRadius:8, fontSize:13, color:'var(--text2)' }}>
              💡 <strong>Saldo pendiente por pagar a proveedores:</strong>{' '}
              <span style={{ fontWeight:800, color:'#10B981' }}>
                {fmt((d.byRole?.provider?.balance || 0) + (d.byRole?.provider?.blocked || 0))}
              </span>
              {' '}— esto es lo que los proveedores tienen disponible para retirar.
            </div>
          </Card>

          {/* ── Movimientos por tipo ── */}
          <Card title="📊 Movimientos por tipo">
            <div className="table-wrap" style={{ marginBottom:0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {d.txSummary.length === 0 && (
                    <tr><td colSpan={4} className="empty">Sin transacciones en el período</td></tr>
                  )}
                  {d.txSummary.map((tx, i) => {
                    const info = TX_LABELS[tx.type] || { label: tx.type, color: 'var(--text3)' };
                    return (
                      <tr key={i}>
                        <td>
                          <span style={{ background: info.color + '22', color: info.color,
                            borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                            {info.label}
                          </span>
                        </td>
                        <td><span className={`badge ${tx.status === 'approved' ? 'badge-green' : 'badge-gray'}`}>{tx.status}</span></td>
                        <td style={{ color:'var(--text2)' }}>{parseInt(tx.count)}</td>
                        <td style={{ fontWeight:700, color:'var(--text)' }}>{fmt(tx.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Top proveedores ── */}
          <Card title="🏆 Top proveedores por ganancia">
            <div className="table-wrap" style={{ marginBottom:0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Órdenes</th>
                    <th>Total ganado</th>
                    <th>Retirado</th>
                    <th>Saldo actual</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topProviders.length === 0 && (
                    <tr><td colSpan={5} className="empty">Sin datos</td></tr>
                  )}
                  {d.topProviders.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-cell">
                          <strong>{p.fullName}</strong>
                          <span>{p.email}</span>
                        </div>
                      </td>
                      <td style={{ color:'var(--text2)' }}>{p.ordersCompleted}</td>
                      <td><strong style={{ color:'#10B981' }}>{fmt(p.totalEarned)}</strong></td>
                      <td style={{ color:'#EF4444' }}>{fmt(p.totalWithdrawn)}</td>
                      <td><strong style={{ color:'#FF6B2C' }}>{fmt(p.currentBalance)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
