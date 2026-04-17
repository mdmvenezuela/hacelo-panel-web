import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setL]   = useState(false);
  const [error, setError] = useState('');

  // 👇 AQUÍ EL FIX
  useEffect(() => {
    if (admin) {
      navigate('/');
    }
  }, [admin, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setL(true);

    try {
      const a = await login(form.email, form.password);

      navigate(a.role === 'conciliator' ? '/recharges' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setL(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span>⚡</span>
          <h1>Hacelo</h1>
          <p>Panel de Administración</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@hacelo.app"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    </div>
  );
}