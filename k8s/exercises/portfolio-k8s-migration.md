# Exercise: Migrate Portfolio App to Kubernetes

## Objective
Chuyển đổi portfolio management application từ Docker Compose sang Kubernetes manifests.

## Current Architecture (Docker Compose)
```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend  │    │ Auth Service │    │ User Service │
│   (React)   │◄──►│   (Spring)   │◄──►│   (Spring)   │
└─────────────┘    └──────────────┘    └──────────────┘
                           │                    │
                           ▼                    ▼
                   ┌─────────────────────────────────┐
                   │          MySQL DB           │
                   │    + Flyway Migration       │
                   └─────────────────────────────────┘
```

## Target K8s Architecture
```
┌─────────────────────────────────────┐
│              Ingress                │ ← HTTP/HTTPS traffic
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│Frontend │ │   Auth   │ │   User   │ ← Services
│ Service │ │ Service  │ │ Service  │
└─────────┘ └──────────┘ └──────────┘
    │             │           │
    ▼             ▼           ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│Frontend │ │   Auth   │ │   User   │ ← Deployments
│  Pods   │ │  Pods    │ │  Pods    │
└─────────┘ └──────────┘ └──────────┘
                  │           │
                  ▼───────────▼
              ┌─────────────────┐
              │   MySQL DB      │ ← StatefulSet + PV
              │ + Migration Job │
              └─────────────────┘
```

## Exercise Structure

### Phase 1: Database Migration (Gợi ý)
**Task**: Tạo K8s manifests cho MySQL database

**Hints**:
- Sử dụng `StatefulSet` cho database
- Cần `PersistentVolume` và `PersistentVolumeClaim`
- Database credentials nên store trong `Secret`
- Expose qua `Service` (ClusterIP)
- Health checks cho MySQL container

**Files cần tạo**:
- `mysql-secret.yaml` - Database credentials
- `mysql-pvc.yaml` - Persistent storage claim  
- `mysql-statefulset.yaml` - MySQL StatefulSet
- `mysql-service.yaml` - Database service

**Validation**:
```bash
# Commands để test database
kubectl exec -it mysql-0 -- mysql -u user -ppassword -e "SHOW DATABASES;"
```

### Phase 2: Flyway Migration Job (Gợi ý)
**Task**: Convert Flyway container thành Kubernetes Job

**Hints**:
- Sử dụng `Job` resource (not Deployment)  
- Job should run to completion then terminate
- Mount migration files qua `ConfigMap`
- Depend on MySQL service being ready
- Use `restartPolicy: Never` hoặc `OnFailure`

**Files cần tạo**:
- `flyway-configmap.yaml` - Migration SQL files
- `flyway-job.yaml` - Migration job

**Validation**:
```bash
kubectl get jobs
kubectl logs job/flyway-migrate
```

### Phase 3: Backend Services (Gợi ý)
**Task**: Deploy Auth và User services

**Hints cho Auth Service**:
- `Deployment` với 2-3 replicas
- Environment variables từ `ConfigMap` và `Secret`
- Resource requests/limits
- Health checks (liveness/readiness probes)
- Expose qua `Service`

**Hints cho User Service**:  
- Similar structure như Auth service
- Different port và environment variables
- Có thể depend on Auth service

**Files cần tạo**:
- `auth-configmap.yaml` - Auth service config
- `auth-deployment.yaml` - Auth service deployment  
- `auth-service.yaml` - Auth service exposure
- `user-configmap.yaml` - User service config
- `user-deployment.yaml` - User service deployment
- `user-service.yaml` - User service exposure

### Phase 4: Frontend (Gợi ý)
**Task**: Deploy React frontend

**Hints**:
- Static content có thể dùng nginx base image
- Build process có thể tách riêng
- Environment variables cho API endpoints
- Multiple replicas cho high availability

**Files cần tạo**:
- `frontend-configmap.yaml` - API URLs configuration
- `frontend-deployment.yaml` - Frontend deployment
- `frontend-service.yaml` - Frontend service

### Phase 5: Ingress & External Access (Gợi ý)
**Task**: Setup external access to applications

**Hints**:
- `Ingress` resource for HTTP routing
- Path-based routing:
  - `/` → Frontend
  - `/api/auth/*` → Auth service  
  - `/api/user/*` → User service
- TLS termination (optional)
- For local testing: NodePort services

**Files cần tạo**:
- `ingress.yaml` - HTTP routing rules

### Phase 6: Advanced Features (Optional)

#### 6a: Monitoring
- Add Prometheus metrics endpoints
- Create ServiceMonitor resources
- Setup Grafana dashboard

#### 6b: Scaling  
- Configure Horizontal Pod Autoscaler
- Set proper resource requests/limits
- Test scaling behavior

#### 6c: Security
- Network Policies cho inter-service communication
- Pod Security Standards
- RBAC cho service accounts

## Step-by-step Approach

### Step 1: Analysis (Tự làm)
1. Review Docker Compose files
2. List all services và dependencies  
3. Identify configuration values
4. Map out resource requirements

### Step 2: Create Namespace
```bash
kubectl create namespace portfolio
kubectl config set-context --current --namespace=portfolio
```

### Step 3: Start with Database (Gợi ý trong Phase 1)
- Tạo MySQL manifests
- Test database connectivity
- Verify data persistence

### Step 4: Migration Job (Gợi ý trong Phase 2)
- Convert Flyway setup
- Test migration execution
- Verify schema creation

### Step 5: Backend Services (Gợi ý trong Phase 3)
- Deploy services incrementally
- Test service-to-service communication
- Verify database connections

### Step 6: Frontend & Access (Gợi ý trong Phase 4-5)
- Deploy frontend
- Setup routing
- Test end-to-end functionality

## Troubleshooting Guide

### Common Issues và Solutions:

**Database không start**:
```bash
kubectl describe statefulset mysql
kubectl logs mysql-0
kubectl describe pvc mysql-data-mysql-0
```

**Migration job fails**:
```bash
kubectl describe job flyway-migrate
kubectl logs job/flyway-migrate
```

**Service connectivity issues**:
```bash
kubectl get endpoints <service-name>
kubectl run debug --image=busybox --rm -it -- /bin/sh
# nslookup <service-name>
```

**Pod không start**:
```bash
kubectl describe pod <pod-name>
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Success Criteria

### Basic Success:
- [x] All pods running and healthy
- [x] Database accessible và migration completed
- [x] Services can communicate with each other
- [x] Frontend accessible through ingress/nodeport
- [x] Application functions end-to-end

### Advanced Success:
- [x] Proper resource limits set
- [x] Health checks configured
- [x] Horizontal scaling works  
- [x] Data persists through pod restarts
- [x] Logs và metrics available

## Testing Strategy

### Unit Tests:
```bash
# Test each component individually
kubectl port-forward service/mysql 3306:3306
kubectl port-forward service/auth-service 8082:8082
kubectl port-forward service/user-service 8083:8083
```

### Integration Tests:
```bash  
# Test service communication
kubectl run test --image=busybox --rm -it -- /bin/sh
# wget -qO- http://auth-service:8082/health
```

### End-to-end Tests:
```bash
# Test complete application flow
kubectl port-forward service/frontend 3000:80
# Open browser to http://localhost:3000
```

## Bonus Challenges

1. **GitOps**: Setup ArgoCD for deployment automation
2. **Monitoring**: Add Prometheus/Grafana stack
3. **Security**: Implement Pod Security Standards
4. **Performance**: Load test và optimize resource usage
5. **Disaster Recovery**: Backup/restore procedures

## Resources và References

- Compare với Docker Compose files trong project root
- Use `kubectl explain <resource>` for manifest structure  
- Test locally với minikube hoặc kind
- Refer to Kubernetes documentation for best practices

## Submission Guidelines

1. Create tất cả YAML manifests trong `k8s/manifests/` directory
2. Organize theo logical groups (database, backend, frontend)
3. Include README với deployment instructions
4. Test thoroughly trước khi submission
5. Document any custom configurations hoặc assumptions