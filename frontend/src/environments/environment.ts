export const environment = {
  production: false,
  authUrl: (window as any).__env?.AUTH_URL || 'http://localhost:8082',
  userUrl: (window as any).__env?.USER_URL || 'http://localhost:8083',
  // Backward compatibility
  backendUrl: (window as any).__env?.BACKEND_URL || 'http://localhost:8082'
};