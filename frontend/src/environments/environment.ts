export const environment = {
  production: false,
  backendUrl: (window as any).__env?.BACKEND_URL || 'http://localhost:3001'
};