# Kubernetes Architecture & Components

## Control Plane Deep Dive

### 1. API Server
**Thực chiến**: Tất cả commands kubectl sẽ interact với API server
```bash
# Check API server status
kubectl cluster-info

# Direct API calls (thực hành debugging)
kubectl get --raw=/api/v1/nodes
kubectl get --raw=/api/v1/namespaces/default/pods
```

### 2. etcd
**Thực chiến**: Backup etcd cho production
```bash
# Backup etcd (production skill)
ETCDCTL_API=3 etcdctl snapshot save backup.db

# Restore từ backup
ETCDCTL_API=3 etcdctl snapshot restore backup.db
```

### 3. Scheduler
**Thực chiến**: Control pod placement cho portfolio services
```yaml
# Node affinity cho database pods
apiVersion: v1
kind: Pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: node-type
            operator: In
            values: ["database"]
```

## Node Components Hands-on

### kubelet Configuration
**Thực chiến**: Debug pod issues
```bash
# Check kubelet logs
journalctl -u kubelet -f

# Kubelet config
kubectl get --raw=/api/v1/nodes/NODE_NAME/proxy/configz
```

### kube-proxy Network Rules
**Thực chiến**: Debug service connectivity
```bash
# Check iptables rules created by kube-proxy
iptables -t nat -L | grep KUBE

# Check service endpoints
kubectl get endpoints
```

## Portfolio Project Component Mapping

### Current Docker Compose Services → K8s Components

#### 1. Frontend Service
```bash
# Docker Compose approach:
docker-compose up frontend

# K8s approach - hands-on commands:
kubectl create deployment frontend --image=portfolio-frontend
kubectl expose deployment frontend --type=LoadBalancer --port=80 --target-port=3000
kubectl get services frontend
```

#### 2. Auth Service với Service Discovery
```yaml
# Thay vì container linking trong docker-compose
# Sử dụng K8s native service discovery
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 8082
    targetPort: 8082
---
# Frontend sẽ call: http://auth-service:8082
# Thay vì: http://${VM_HOST:-localhost}:8082
```

#### 3. Database Migration Strategy
```bash
# Docker Compose: depends_on
# K8s: Init containers + Jobs

# Thực chiến migration:
kubectl create job flyway-migrate --image=flyway/flyway:10-alpine
kubectl logs job/flyway-migrate -f
kubectl wait --for=condition=complete job/flyway-migrate --timeout=300s
```

## Resource Requirements Planning

### Current Docker Services → K8s Resources

```yaml
# Auth Service resource requirements
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2  # HA setup
  template:
    spec:
      containers:
      - name: auth-service
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi" 
            cpu: "500m"
```

### MySQL StatefulSet Planning
```yaml
# Database cần stable hostname và storage
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 1
  template:
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## Networking Deep Dive

### Service Discovery Implementation
```bash
# Test service discovery
kubectl run test-pod --image=busybox --rm -it -- sh

# Inside pod:
nslookup auth-service
nslookup user-service
wget -qO- http://auth-service:8082/health
```

### Port Mapping Strategy
```yaml
# Docker Compose ports mapping:
# "3000:80" → NodePort/LoadBalancer
# Internal services → ClusterIP only

services:
  frontend:
    type: LoadBalancer
    ports: [80:3000]
  
  auth-service:
    type: ClusterIP  
    ports: [8082:8082]
  
  user-service:
    type: ClusterIP
    ports: [8083:8083]
```

## Storage Architecture

### Volume Migration Strategy
```bash
# Docker named volumes → PersistentVolumes
# Create storage classes
kubectl get storageclass

# Create PVCs
kubectl apply -f mysql-pvc.yaml
kubectl apply -f minio-pvc.yaml

# Check PVC binding
kubectl get pvc
kubectl describe pvc mysql-data
```

## Security Implementation

### Secrets Management
```bash
# Migrate environment variables to secrets
kubectl create secret generic mysql-secret \
  --from-literal=root-password=rootpassword \
  --from-literal=user-password=password

kubectl create secret generic jwt-secret \
  --from-literal=jwt-key=bXlWZXJ5U2VjcmV0S2V5

# Use in deployments
kubectl set env deployment/auth-service \
  --from=secret/jwt-secret \
  --from=secret/mysql-secret
```

## Practical Migration Commands

### 1. Quick Deployment Commands
```bash
# Deploy all services in order:
kubectl apply -f mysql/
kubectl apply -f minio/
kubectl apply -f auth-service/
kubectl apply -f user-service/
kubectl apply -f email-service/
kubectl apply -f frontend/

# Check rollout status
kubectl rollout status deployment/auth-service
kubectl rollout status deployment/user-service
```

### 2. Debugging Commands
```bash
# Debug failing pods
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl exec -it <pod-name> -- sh

# Debug services
kubectl get endpoints
kubectl port-forward svc/auth-service 8082:8082
```

### 3. Scaling Commands
```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=3

# Auto-scaling setup
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10
```

## Health Checks Implementation

```yaml
# Migrate Docker health checks to K8s probes
containers:
- name: auth-service
  livenessProbe:
    httpGet:
      path: /actuator/health
      port: 8082
    initialDelaySeconds: 60
    periodSeconds: 30
  readinessProbe:
    httpGet:
      path: /actuator/health/readiness
      port: 8082
    initialDelaySeconds: 30
    periodSeconds: 10
```

## Next Practical Steps
1. Setup local K8s cluster (minikube/kind)
2. Convert docker-compose services to K8s manifests
3. Test service-to-service communication
4. Implement persistent storage
5. Setup ingress for external access