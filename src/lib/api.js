import axios from 'axios';

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const { port } = window.location;
    // Local development server on Vite port 5173
    if (port === '5173') {
      return 'http://localhost:4210/api';
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.startsWith('/')) {
    return envUrl;
  }
  // Default to relative '/api' so it seamlessly adopts the same IP, domain, or subdomain
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const companyCode = localStorage.getItem('selectedCompanyCode');
  if (companyCode) {
    config.headers['X-Company-Code'] = companyCode;
  }
  return config;
});

export function getFileUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    // If an absolute URL contains an internal private LAN IP (e.g. 192.168.30.5:4220),
    // rewrite it to use the current browser's origin so external/domain users can access it
    try {
      const parsed = new URL(path);
      if (typeof window !== 'undefined' && window.location && (parsed.hostname.startsWith('192.168.') || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return `${window.location.origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // ignore
    }
    return path;
  }
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/uploads/')) {
    cleanPath = `/uploads${cleanPath}`;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${cleanPath}`;
  }
  return cleanPath;
}

export default api;
