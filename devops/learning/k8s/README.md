# Kubernetes Learning Path - Portfolio Management Migration

## Mục tiêu
Chuyển đổi project User Portfolio Management từ Docker Compose sang Kubernetes thông qua việc học và thực hành từng bước.

## Cấu trúc học tập

### 📚 Phase 1: Lý thuyết cơ bản (theory/)
1. **Kubernetes Fundamentals** - Kiến thức nền tảng
2. **Architecture & Components** - Kiến trúc và thành phần
3. **Resources & Objects** - Tài nguyên và đối tượng
4. **Networking** - Mạng trong K8s
5. **Storage** - Lưu trữ dữ liệu
6. **Security** - Bảo mật
7. **Deployment Strategies** - Chiến lược triển khai

### 🔬 Phase 2: Labs thực hành (labs/)
1. **Environment Setup** - Thiết lập môi trường K8s
2. **Basic Workloads** - Pods, Deployments, Services
3. **ConfigMaps & Secrets** - Quản lý cấu hình
4. **Persistent Storage** - Lưu trữ liên tục
5. **Networking** - Service mesh và ingress
6. **Monitoring** - Giám sát ứng dụng

### 🎯 Phase 3: Migration Project (migration/)
1. **Analysis** - Phân tích và lập kế hoạch migration
2. **Database Layer** - MySQL + Flyway migration
3. **Storage Layer** - MinIO object storage
4. **Backend Services** - Auth & User services
5. **Frontend** - React application
6. **Email Service** - Email notifications
7. **Integration Testing** - Test tích hợp
8. **Production Deployment** - Triển khai production

### 📝 Phase 4: Exercises (exercises/)
- Bài tập thực hành cho từng module
- Troubleshooting scenarios
- Performance tuning
- Security hardening

## Project Context
**Services hiện tại:**
- Frontend (React): 3000 → LoadBalancer/NodePort
- Auth Service: 8082 → ClusterIP + Ingress  
- User Service: 8083 → ClusterIP + Ingress
- Email Service: 8081 → ClusterIP
- MySQL: 3306 → StatefulSet + PV/PVC
- MinIO: 9000/9001 → StatefulSet + PV/PVC

**Challenges cần giải quyết:**
- Service discovery thay vì container linking
- ConfigMaps thay vì environment variables
- Secrets cho database credentials
- Persistent volumes cho data
- Ingress routing cho external access
- Health checks và rolling updates

## Learning Timeline
- **Week 1-2**: Theory foundations
- **Week 3-4**: Hands-on labs
- **Week 5-8**: Step-by-step migration
- **Week 9-10**: Testing và optimization