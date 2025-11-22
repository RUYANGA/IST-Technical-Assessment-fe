import axios from 'axios';

const baseURL ="http://127.0.0.1:8000/api" ;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage on client init (if present)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor example (optional extra logging)
api.interceptors.request.use(
  (config) => {
    // modify config if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors (e.g., 401)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      // simple handling: remove token on 401
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // optional: redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Set or clear the Authorization header and persist token (client-side).
 * Call setAuthToken(token) after login and setAuthToken(null) on logout.
 */
export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api;