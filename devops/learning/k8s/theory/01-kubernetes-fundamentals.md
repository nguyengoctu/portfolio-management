# Kubernetes Fundamentals

## Kubernetes là gì?
Kubernetes (K8s) là một platform mã nguồn mở để tự động hóa việc triển khai, mở rộng và quản lý các ứng dụng containerized.

## Tại sao migrate từ Docker Compose sang K8s?

### Limitations của Docker Compose
- **Single-host limitation**: Chỉ chạy trên 1 máy
- **No auto-scaling**: Không tự động scale
- **Limited service discovery**: Service discovery cơ bản
- **No rolling updates**: Không hỗ trợ rolling deployment
- **No health checks**: Health check limitations

### Advantages của Kubernetes
- **Multi-node orchestration**: Quản lý cluster nhiều nodes
- **Auto-scaling**: HPA, VPA, Cluster autoscaling
- **Service mesh**: Advanced networking
- **Rolling updates**: Zero-downtime deployments
- **Self-healing**: Automatic restart, replacement
- **Resource management**: CPU/Memory limits và requests

## Core Concepts cho Portfolio Project

### 1. Pods
**Định nghĩa**: Đơn vị nhỏ nhất trong K8s, chứa 1 hoặc nhiều containers.

**Áp dụng cho project**:
```yaml
# auth-service pod sẽ chứa:
- auth-service container
- sidecar logging container (tùy chọn)
```

### 2. Deployments  
**Định nghĩa**: Quản lý ReplicaSets và Pods, hỗ trợ rolling updates.

**Portfolio services mapping**:
- `frontend-deployment` → React app
- `auth-service-deployment` → Spring Boot auth
- `user-service-deployment` → Spring Boot user
- `email-service-deployment` → Email service

### 3. Services
**Định nghĩa**: Abstraction layer cung cấp stable network endpoint.

**Service types cho project**:
- **ClusterIP**: auth-service, user-service, email-service (internal)
- **NodePort/LoadBalancer**: frontend (external access)

### 4. ConfigMaps & Secrets
**Thay thế Docker Compose environment variables**:

```yaml
# Hiện tại trong docker-compose.yml:
environment:
  - JWT_SECRET=${JWT_SECRET}
  - MYSQL_PASSWORD=${MYSQL_PASSWORD}

# Sẽ chuyển thành:
# ConfigMap: non-sensitive data
# Secret: sensitive data (passwords, tokens)
```

### 5. Persistent Volumes
**Thay thế Docker volumes**:
```yaml
# Docker Compose:
volumes:
  mysql_data:
  minio_data:

# K8s:
# PersistentVolume + PersistentVolumeClaim
# StatefulSets cho MySQL và MinIO
```

## Kubernetes Architecture

### Control Plane Components
- **API Server**: REST API endpoint
- **etcd**: Key-value store
- **Scheduler**: Pod placement
- **Controller Manager**: Controllers (Deployments, Services)

### Node Components  
- **kubelet**: Node agent
- **kube-proxy**: Network rules
- **Container Runtime**: Docker/containerd

## Migration Strategy Overview

### Phase 1: Stateless Services
1. Frontend (React)
2. Auth Service  
3. User Service
4. Email Service

### Phase 2: Stateful Services
1. MySQL database
2. MinIO object storage

### Phase 3: Advanced Features
1. Ingress routing
2. SSL/TLS termination
3. Monitoring & logging
4. Auto-scaling policies

## Key Differences: Docker Compose vs K8s

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Networking | Bridge network | Service discovery + DNS |
| Load balancing | Basic | Advanced (kube-proxy) |
| Storage | Named volumes | PV/PVC + StorageClass |
| Configuration | .env files | ConfigMaps + Secrets |
| Service discovery | Container names | Service names + DNS |
| Health checks | Basic | Liveness/Readiness probes |
| Scaling | Manual | Auto (HPA) |
| Updates | Stop/Start | Rolling updates |

## Next Steps
1. Tìm hiểu K8s architecture chi tiết
2. Thực hành với basic workloads
3. Học về networking và service discovery
4. Implement storage solutions