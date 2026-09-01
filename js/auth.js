const API_BASE = '/api';

const Auth = {
  _user: null,
  _token: null,

  init() {
    this._token = localStorage.getItem('llampayec_token');
    const stored = localStorage.getItem('llampayec_user');
    if (stored) {
      try { this._user = JSON.parse(stored); } catch { this._user = null; }
    }
  },

  get user() { return this._user; },
  get token() { return this._token; },
  get isLogged() { return !!this._token && !!this._user; },
  get isAdmin() { return this.isLogged && this._user?.role === 'admin'; },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

    this._token = data.token;
    this._user = data.user;
    localStorage.setItem('llampayec_token', data.token);
    localStorage.setItem('llampayec_user', JSON.stringify(data.user));
    return data.user;
  },

  async register(nombre, email, password, apellidos, telefono) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password, apellidos, telefono })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrarse');

    this._token = data.token;
    this._user = data.user;
    localStorage.setItem('llampayec_token', data.token);
    localStorage.setItem('llampayec_user', JSON.stringify(data.user));
    return data.user;
  },

  logout() {
    this._token = null;
    this._user = null;
    localStorage.removeItem('llampayec_token');
    localStorage.removeItem('llampayec_user');
  },

  async fetch(url, options = {}) {
    const headers = options.headers || {};
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
    return data;
  }
};

Auth.init();
