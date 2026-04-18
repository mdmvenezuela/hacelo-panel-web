// src/components/Layout.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/',                icon: '▦',  label: 'Dashboard',       action: 'dashboard'        },
  { to: '/users',           icon: '👥', label: 'Usuarios',        action: 'users'            },
  { to: '/kyc',             icon: '🪪', label: 'KYC',             action: 'kyc'              },
  { to: '/orders',          icon: '📋', label: 'Órdenes',         action: 'orders'           },
  { to: '/recharges',       icon: '💰', label: 'Recargas',        action: 'recharges'        },
  { to: '/withdrawals',     icon: '💸', label: 'Retiros',         action: 'withdrawals'      },
  { to: '/payment-methods', icon: '💳', label: 'Métodos de Pago', action: 'payment-methods'  },
  { to: '/zones',           icon: '🗺️', label: 'Zonas',           action: 'zones'            },
  { to: '/finance',         icon: '💹', label: 'Finanzas',        action: 'finance'          },
  { to: '/admins',          icon: '🔑', label: 'Admins',          action: 'admins'           },
];

const ROLE = {
  admin:       { label: 'Administrador', color: '#FF6B2C' },
  moderator:   { label: 'Moderador',     color: '#3B82F6' },
  conciliator: { label: 'Conciliador',   color: '#10B981' },
};

export default function Layout({ children }) {
  const { admin, logout, can } = useAuth();
  const navigate = useNavigate();
  const rl = ROLE[admin?.role] || {};

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">Hacelo</span>
          <span className="brand-panel">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.filter(item => can(item.action)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{admin?.fullName?.[0] || 'A'}</div>
          <div className="user-info">
            <div className="user-name">{admin?.fullName}</div>
            <div className="user-role" style={{ color: rl.color }}>{rl.label}</div>
          </div>
          <button className="logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
            title="Cerrar sesión">⏻</button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
