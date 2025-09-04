(function (window) {
  window.__env = window.__env || {};

  // Default development values
  window.__env.APP_URL = 'http://localhost:3000';
  window.__env.AUTH_URL = 'http://localhost:8082';
  window.__env.USER_URL = 'http://localhost:8083';
  
  // Backward compatibility
  window.__env.BACKEND_URL = 'http://localhost:8082';
})(this);