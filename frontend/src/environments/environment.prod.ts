export const environment = {
  production: true,
  backendUrl: (window as any).__env?.BACKEND_URL || 'http://backend:8080'
};