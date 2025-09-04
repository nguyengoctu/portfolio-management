export const environment = {
  production: true,
  authUrl: (window as any).__env?.AUTH_URL || 'http://192.168.56.50:8082',
  userUrl: (window as any).__env?.USER_URL || 'http://192.168.56.50:8083',
  // Backward compatibility
  backendUrl: (window as any).__env?.BACKEND_URL || 'http://192.168.56.50:8082'
};