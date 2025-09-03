# Migration Analysis & Planning - Portfolio Project

## Current State Analysis

### Docker Compose Architecture
```yaml
# Hiện tại có 7 services chính:
services:
  frontend:           # React app (port 3000)
  auth-service:       # Spring Boot (port 8082)  
  user-service:       # Spring Boot (port 8083)
  email-service:      # Node.js (port 8081)
  flyway-migrate:     # Database migration (job)
  portfolio-db:       # MySQL 8.0 (port 3306)
  minio:             # Object storage (port 9000/9001)
```

### Dependencies Map
```
frontend ──┬─→ auth-service ──┬─→ portfolio-db
           └─→ user-service ──┼─→ portfolio-db
                              ├─→ email-service  
                              └─→ minio

flyway-migrate ─→ portfolio-db (one-time setup)
```

### Resource Requirements Analysis
```bash
# Current Docker resources:
docker stats
# Expected output analysis:
# frontend: ~100MB RAM, ~0.1 CPU
# auth-service: ~512MB RAM, ~0.5 CPU  
# user-service: ~512MB RAM, ~0.5 CPU
# email-service: ~128MB RAM, ~0.2 CPU
# portfolio-db: ~1GB RAM, ~1.0 CPU
# minio: ~256MB RAM, ~0.3 CPU
```

## Migration Challenges Identification

### 1. Network Communication Changes
**Docker Compose:**
- Services communicate via container names
- Single bridge network
- Fixed port mappings

**Kubernetes:**
- Service discovery through DNS
- Multi-node networking
- Dynamic pod IPs

### 2. Configuration Management  
**Docker Compose:**
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
  - MYSQL_PASSWORD=${MYSQL_PASSWORD}
```

**Kubernetes:**
- ConfigMaps cho non-sensitive config
- Secrets cho passwords/tokens
- Environment variable injection

### 3. Data Persistence
**Docker Compose:**
```yaml
volumes:
  mysql_data:
  minio_data:
```

**Kubernetes:**
- StatefulSets cho stateful services
- PersistentVolumes cho data storage
- Volume migration strategy needed

### 4. Service Dependencies
**Docker Compose:**
```yaml
depends_on:
  flyway-migrate:
    condition: service_completed_successfully
```

**Kubernetes:**
- Init containers
- Jobs cho one-time tasks
- Readiness/liveness probes

## Migration Strategy

### Phase 1: Stateless Services (Week 1-2)
**Priority**: Low risk, easy rollback

1. **Frontend Service**
   - Convert to Deployment (2 replicas)
   - Create LoadBalancer Service
   - Update API URLs to use ingress

2. **Email Service**  
   - Convert to Deployment (1 replica)
   - Create ClusterIP Service
   - Migrate SMTP config to ConfigMap/Secret

3. **Auth Service**
   - Convert to Deployment (2 replicas)
   - Create ClusterIP Service
   - Migrate JWT config to Secrets

4. **User Service**
   - Convert to Deployment (2 replicas)  
   - Create ClusterIP Service
   - Connect to other K8s services

### Phase 2: Database Layer (Week 3)
**Priority**: High risk, careful planning needed

1. **Database Migration Job**
   - Convert flyway-migrate to K8s Job
   - Create init container pattern
   - Test migration scripts

2. **MySQL Database**
   - Deploy as StatefulSet
   - Setup persistent storage
   - Migrate existing data
   - Configure backups

### Phase 3: Object Storage (Week 4)
**Priority**: Medium risk

1. **MinIO Storage**
   - Deploy as StatefulSet
   - Setup persistent volumes
   - Migrate existing objects
   - Configure access policies

### Phase 4: Integration & Testing (Week 5-6)
**Priority**: Critical validation

1. **Service Integration**
   - Test all service-to-service communication
   - Validate data flow
   - Performance testing

2. **External Access**
   - Setup Ingress controller
   - Configure SSL/TLS
   - Domain routing

## Detailed Migration Plan

### Prerequisites Setup
```bash
# 1. Create dedicated namespace
kubectl create namespace portfolio

# 2. Setup storage classes
kubectl apply -f storage-class.yaml

# 3. Create secrets for sensitive data
kubectl create secret generic mysql-secret \
  --from-literal=root-password='rootpassword' \
  --from-literal=user='user' \
  --from-literal=password='password' \
  --namespace=portfolio

kubectl create secret generic auth-secret \
  --from-literal=jwt-secret='bXlWZXJ5U2VjcmV0S2V5VGhhdElzMzJDaGFyc0xvbmc=' \
  --from-literal=github-client-id='${GITHUB_CLIENT_ID}' \
  --from-literal=github-client-secret='${GITHUB_CLIENT_SECRET}' \
  --namespace=portfolio

kubectl create secret generic email-secret \
  --from-literal=mail-password='emailpassword' \
  --namespace=portfolio

# 4. Create configmaps for application config
kubectl create configmap app-config \
  --from-literal=frontend.url='http://localhost:3000' \
  --from-literal=auth.service.url='http://auth-service:8082' \
  --from-literal=user.service.url='http://user-service:8083' \
  --from-literal=email.service.url='http://email-service:8081' \
  --namespace=portfolio
```

### Service Conversion Templates

#### Frontend Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: portfolio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: DOCKER_USER/portfolio-management-networkporfolio-management-frontend:TAG
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_AUTH_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: auth.service.url
        - name: REACT_APP_USER_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: user.service.url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi" 
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: portfolio
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: frontend
```

#### Auth Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: portfolio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: DOCKER_USER/portfolio-management-auth-service:TAG
        ports:
        - containerPort: 8082
        env:
        - name: SPRING_DATASOURCE_URL
          value: "jdbc:mysql://mysql:3306/portfolio"
        - name: SPRING_DATASOURCE_USERNAME
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: user
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: jwt-secret
        - name: FRONTEND_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: frontend.url
        - name: EMAIL_SERVICE_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: email.service.url
        - name: GITHUB_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: github-client-id
        - name: GITHUB_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: github-client-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8082
          initialDelaySeconds: 45
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness  
            port: 8082
          initialDelaySeconds: 90
          periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: portfolio
spec:
  type: ClusterIP
  ports:
  - port: 8082
    targetPort: 8082
  selector:
    app: auth-service
```

### Data Migration Strategy

#### Database Migration Plan
```bash
# Step 1: Backup current data
docker exec portfolio-db mysqldump -u root -p portfolio > portfolio_backup.sql

# Step 2: Deploy MySQL StatefulSet
kubectl apply -f mysql-statefulset.yaml

# Step 3: Wait for pod ready
kubectl wait --for=condition=ready pod/mysql-0 --timeout=120s

# Step 4: Restore data  
kubectl cp portfolio_backup.sql mysql-0:/tmp/
kubectl exec -it mysql-0 -- mysql -u root -p portfolio < /tmp/portfolio_backup.sql

# Step 5: Verify data integrity
kubectl exec -it mysql-0 -- mysql -u root -p -e "USE portfolio; SHOW TABLES; SELECT COUNT(*) FROM users;"
```

#### MinIO Data Migration
```bash
# Step 1: Export current MinIO data
docker exec minio mc mirror --overwrite /data /backup/

# Step 2: Deploy MinIO StatefulSet  
kubectl apply -f minio-statefulset.yaml

# Step 3: Wait for pod ready
kubectl wait --for=condition=ready pod/minio-0 --timeout=120s

# Step 4: Restore data
kubectl cp /backup/ minio-0:/data/

# Step 5: Verify objects
kubectl exec -it minio-0 -- mc ls /data/
```

## Risk Assessment & Mitigation

### High Risk Areas
1. **Database migration** - Data loss potential
   - **Mitigation**: Multiple backups, test restore procedure
   - **Rollback**: Keep Docker containers running during migration

2. **Service communication** - Network connectivity issues  
   - **Mitigation**: Thorough testing of service discovery
   - **Rollback**: Quick switch back to Docker network

3. **Configuration management** - Environment variable mapping
   - **Mitigation**: Validate all config values before deployment
   - **Rollback**: Keep original .env files

### Medium Risk Areas
1. **Resource constraints** - K8s resource limits
   - **Mitigation**: Monitor resource usage, adjust limits
   
2. **Storage performance** - Different storage backend
   - **Mitigation**: Performance testing with realistic load

### Low Risk Areas
1. **Frontend deployment** - Stateless, easy to rollback
2. **Email service** - Simple service, minimal dependencies

## Testing Strategy

### Unit Testing
- All existing tests must pass in K8s environment
- Environment variable resolution testing
- Database connectivity testing

### Integration Testing  
```bash
# Service-to-service communication
kubectl exec -it frontend-pod -- curl http://auth-service:8082/health
kubectl exec -it auth-service-pod -- curl http://user-service:8083/health  
kubectl exec -it user-service-pod -- curl http://email-service:8081/health

# Database connectivity
kubectl exec -it auth-service-pod -- curl http://auth-service:8082/actuator/health
kubectl exec -it user-service-pod -- curl http://user-service:8083/actuator/health
```

### Load Testing
- Use same load testing tools as Docker environment
- Compare performance metrics
- Test auto-scaling behavior

### Disaster Recovery Testing
- Pod failure scenarios
- Node failure scenarios  
- Data corruption scenarios
- Backup/restore procedures

## Success Metrics

### Functional Metrics
- ✅ All API endpoints responding
- ✅ User authentication working
- ✅ File upload/download working
- ✅ Email notifications sending
- ✅ Database queries executing

### Performance Metrics
- Response time < 200ms (same as Docker)
- Database queries < 100ms  
- File upload/download speed maintained
- Memory usage within limits
- CPU usage within limits

### Reliability Metrics
- 99.9% uptime target
- Zero data loss
- Automatic recovery from pod failures
- Successful backup/restore operations

## Timeline & Milestones

### Week 1: Setup & Stateless Services
- Day 1-2: Cluster setup, namespace creation
- Day 3-4: Frontend and email service migration  
- Day 5-7: Auth and user service migration, testing

### Week 2: Database Migration
- Day 1-2: MySQL StatefulSet deployment
- Day 3-4: Data migration and validation
- Day 5-7: Database connection testing

### Week 3: Object Storage & Integration
- Day 1-2: MinIO deployment and data migration
- Day 3-4: Service integration testing
- Day 5-7: End-to-end testing

### Week 4: Production Readiness
- Day 1-2: Performance tuning
- Day 3-4: Security hardening
- Day 5-7: Documentation and deployment

## Next Steps
1. Review and approve migration plan
2. Setup K8s cluster environment  
3. Create migration scripts and manifests
4. Begin Phase 1 implementation