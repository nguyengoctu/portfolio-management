#!/bin/sh

# Create assets directory if it doesn't exist
mkdir -p /usr/share/nginx/html/assets

# Generate env.js file with environment variables
cat > /usr/share/nginx/html/assets/env.js << EOF
(function (window) {
  window.__env = window.__env || {};
  
  // Environment variables
  window.__env.APP_URL = '${APP_URL}';
  window.__env.BACKEND_URL = '${BACKEND_URL}';
  
  // Debug info
  console.log('Runtime env loaded:', {
    APP_URL: window.__env.APP_URL,
    BACKEND_URL: window.__env.BACKEND_URL,
    current_origin: window.location.origin
  });
})(this);
EOF

# Start nginx
nginx -g "daemon off;"