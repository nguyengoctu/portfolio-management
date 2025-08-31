export const environment = {
  production: true,
  authUrl: (window as any).__env?.AUTH_URL || 'http://auth-service:8082',
  userUrl: (window as any).__env?.USER_URL || 'http://user-service:8083',
  // Backward compatibility
  backendUrl: (window as any).__env?.BACKEND_URL || 'http://auth-service:8082'
};