#!/bin/bash

# Generate env.js file with environment variables
cat > /usr/share/nginx/html/assets/env.js << EOF
(function (window) {
  window.__env = window.__env || {};
  
  // Environment variables
  window.__env.BACKEND_URL = '${BACKEND_URL}';
})(this);
EOF

# Start nginx
nginx -g "daemon off;"