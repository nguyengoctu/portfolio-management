# Frontend Proxy Setup Documentation

## 🎯 Mục đích
Setup proxy trong frontend để các API requests tự động routing đến đúng backend services mà không cần biết trước địa chỉ cụ thể.

## 🔧 Cấu hình đã setup

### 1. Development Proxy (Angular Dev Server)
**File: `proxy.conf.json`**
```json
{
  "/api/auth/*": {
    "target": "http://localhost:8082",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": { "^/api/auth": "" }
  },
  "/api/user/*": {
    "target": "http://localhost:8083",
    "secure": false, 
    "changeOrigin": true,
    "pathRewrite": { "^/api/user": "" }
  },
  "/api/email/*": {
    "target": "http://localhost:3002",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": { "^/api/email": "" }
  }
}
```

**Cách hoạt động:**
- Request: `http://localhost:3000/api/auth/login`
- Được proxy thành: `http://localhost:8082/login`

### 2. Production Proxy (Nginx)
**File: `nginx.conf`**
- `/api/auth/*` → `auth-service:8082`
- `/api/user/*` → `user-service:8083`
- `/api/email/*` → `email-service:8081`

## 🚀 Cách sử dụng

### 1. Development Mode
```bash
cd frontend
npm start  # Đã config với proxy

# Frontend chạy ở: http://localhost:4200
# API requests tự động proxy đến backend services
```

### 2. Production Mode (Docker)
```bash
docker compose up
# Frontend: http://localhost:3000
# Nginx tự động proxy API requests
```

### 3. Trong Angular Code
```typescript
// Sử dụng ApiService đã tạo
constructor(private apiService: ApiService) {}

// Không cần biết backend URL cụ thể
this.apiService.login(credentials).subscribe(response => {
  console.log('Login successful', response);
});

this.apiService.getProfile().subscribe(profile => {
  console.log('User profile', profile);
});
```

### 4. Trong Postman
```
Base URL: http://localhost:3000 (production) hoặc http://localhost:4200 (dev)

API Endpoints:
POST http://localhost:3000/api/auth/login
GET  http://localhost:3000/api/auth/actuator/health
GET  http://localhost:3000/api/user/profile
POST http://localhost:3000/api/user/users
POST http://localhost:3000/api/email/send
GET  http://localhost:3000/api/email/health
```

## 🧪 Testing

### 1. Truy cập test page:
```
http://localhost:3000/api-test (production)
http://localhost:4200/api-test (development)
```

### 2. Test manual với curl:
```bash
# Test auth service via proxy
curl -X GET http://localhost:3000/api/auth/actuator/health

# Test user service via proxy  
curl -X GET http://localhost:3000/api/user/actuator/health

# Test email service via proxy
curl -X GET http://localhost:3000/api/email/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## 🔧 Routing Logic

### Request Flow:
```
Frontend Request → Proxy → Backend Service
     ↓              ↓           ↓
/api/auth/login → nginx → auth-service:8082/login
/api/user/profile → nginx → user-service:8083/profile  
/api/email/send → nginx → email-service:8081/send
```

### Path Rewriting:
- **Original**: `http://frontend/api/auth/login`
- **Rewritten**: `http://auth-service:8082/login` (removes `/api/auth`)
- **Original**: `http://frontend/api/user/profile`  
- **Rewritten**: `http://user-service:8083/profile` (removes `/api/user`)

## 🛠️ Customization

### Thêm service mới:
1. **Update `proxy.conf.json`** (development):
```json
{
  "/api/newservice/*": {
    "target": "http://localhost:8084",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": { "^/api/newservice": "" }
  }
}
```

2. **Update `nginx.conf`** (production):
```nginx
location /api/newservice/ {
    proxy_pass http://new-service:8084/;
    # ... same proxy headers
}
```

3. **Update `ApiService`**:
```typescript
getNewServiceData(): Observable<any> {
  return this.http.get('/api/newservice/data');
}
```

## ⚙️ Environment Configuration

### Development
- Angular dev server proxy: `proxy.conf.json`
- Hot reload support
- CORS handled by proxy

### Production  
- Nginx reverse proxy: `nginx.conf`
- Static file serving + API proxying
- CORS headers configured
- Better performance

## 🔍 Debugging

### Check proxy is working:
```bash
# Development - check Angular dev server logs
npm start
# Look for proxy logs in console

# Production - check nginx access logs
docker logs <frontend-container-id>
```

### Common Issues:

1. **CORS Errors**: 
   - Fixed by proxy configuration
   - Check `Access-Control-Allow-Origin` headers

2. **404 on API calls**:
   - Check proxy path matching
   - Verify backend service is running

3. **Connection refused**:
   - Check backend service URLs
   - Verify Docker network connectivity

## 📊 Benefits

1. **Frontend Code Simplicity**: No need to manage backend URLs
2. **Environment Agnostic**: Same code works in dev/prod
3. **CORS Solution**: Proxy handles cross-origin requests
4. **Single Entry Point**: One URL for frontend + API
5. **Load Balancing Ready**: Can add LB behind proxy
6. **SSL Termination**: HTTPS can be handled at proxy level

## 🎯 API URL Mapping

| Frontend Request | Backend Target | Purpose |
|-----------------|----------------|---------|
| `/api/auth/login` | `auth-service:8082/login` | User authentication |
| `/api/auth/register` | `auth-service:8082/register` | User registration |
| `/api/user/profile` | `user-service:8083/profile` | User profile data |
| `/api/user/users` | `user-service:8083/users` | User management |
| `/api/email/send` | `email-service:8081/send` | Send emails |
| `/health` | `nginx health check` | Frontend health |

Với setup này, bạn có thể sử dụng Postman với base URL `http://localhost:3000` và tất cả API requests sẽ tự động được route đến đúng backend services!