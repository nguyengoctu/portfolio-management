# Lab 02: Basic Workloads - Pods, Deployments, Services

## Mục tiêu
Deploy portfolio services từ Docker Compose sang Kubernetes workloads cơ bản.

## Setup
```bash
# Ensure cluster đang chạy
kubectl get nodes

# Switch to portfolio namespace
kubectl config set-context --current --namespace=portfolio

# Verify namespace
kubectl get namespace portfolio || kubectl create namespace portfolio
```

## Task 1: Pod Fundamentals

### Single Container Pods
```bash
# Deploy email service như single pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: email-service-pod
  namespace: portfolio
  labels:
    app: email-service
    tier: backend
spec:
  containers:
  - name: email-service
    image: node:18-alpine
    command: ["sh", "-c", "echo 'Email Service Running' && sleep 3600"]
    ports:
    - containerPort: 8081
    env:
    - name: PORT
      value: "8081"
    - name: NODE_ENV
      value: "development"
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
EOF

# Monitor pod startup
kubectl get pods -w
kubectl describe pod email-service-pod
kubectl logs email-service-pod -f
```

### Multi-container Pod Pattern
```bash
# Auth service với sidecar logging
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: auth-service-sidecar
  namespace: portfolio
  labels:
    app: auth-service
spec:
  containers:
  - name: auth-service
    image: openjdk:17-jre-slim
    command: ["sh", "-c", "echo 'Auth Service' && tail -f /var/log/app.log"]
    ports:
    - containerPort: 8082
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
    env:
    - name: JAVA_OPTS
      value: "-Xmx512m"
    resources:
      requests:
        memory: "512Mi"
        cpu: "250m"
      limits:
        memory: "1Gi"
        cpu: "500m"
  - name: log-shipper
    image: fluent/fluent-bit:2.1
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
    - name: fluent-bit-config
      mountPath: /fluent-bit/etc
  volumes:
  - name: shared-logs
    emptyDir: {}
  - name: fluent-bit-config
    configMap:
      name: fluent-bit-config
      defaultMode: 0644
EOF
```

### Pod Lifecycle Testing
```bash
# Test pod operations
kubectl get pods
kubectl describe pod email-service-pod
kubectl logs email-service-pod

# Exec into pod
kubectl exec -it email-service-pod -- sh
# Inside pod:
# ps aux
# netstat -tulpn
# curl localhost:8081/health

# Port forwarding for testing
kubectl port-forward pod/email-service-pod 8081:8081 &
curl http://localhost:8081
```

## Task 2: ReplicaSets - Managing Pod Replicas

### Manual ReplicaSet
```bash
# Create ReplicaSet cho user service
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: user-service-rs
  namespace: portfolio
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
      tier: backend
  template:
    metadata:
      labels:
        app: user-service
        tier: backend
    spec:
      containers:
      - name: user-service
        image: openjdk:17-jre-slim
        command: ["sh", "-c", "echo 'User Service Instance:' \$HOSTNAME && sleep 3600"]
        ports:
        - containerPort: 8083
        env:
        - name: SERVICE_NAME
          value: "user-service"
        - name: REPLICA_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi" 
            cpu: "400m"
        readinessProbe:
          httpGet:
            path: /health
            port: 8083
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8083
          initialDelaySeconds: 60
          periodSeconds: 30
EOF

# Monitor ReplicaSet behavior
kubectl get rs user-service-rs -o wide
kubectl get pods -l app=user-service
kubectl describe rs user-service-rs
```

### Scaling Operations
```bash
# Scale up replicas
kubectl scale rs user-service-rs --replicas=5
kubectl get pods -l app=user-service -w

# Scale down
kubectl scale rs user-service-rs --replicas=2
kubectl get pods -l app=user-service

# Auto-healing test - delete a pod
POD_NAME=$(kubectl get pods -l app=user-service -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD_NAME
kubectl get pods -l app=user-service -w
```

## Task 3: Deployments - Production Workloads

### Frontend Deployment
```bash
# Create frontend deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: portfolio
  labels:
    app: frontend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        tier: frontend
    spec:
      containers:
      - name: frontend
        image: nginx:1.21
        ports:
        - containerPort: 80
        env:
        - name: API_URL
          value: "http://auth-service:8082"
        volumeMounts:
        - name: frontend-config
          mountPath: /etc/nginx/conf.d
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
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
      volumes:
      - name: frontend-config
        configMap:
          name: frontend-nginx-config
EOF

# Monitor deployment
kubectl rollout status deployment/frontend-deployment
kubectl get deployment frontend-deployment -o wide
kubectl get pods -l app=frontend
```

### Auth Service Deployment
```bash
# Auth service deployment với environment variables
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service-deployment
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
        tier: backend
    spec:
      containers:
      - name: auth-service
        image: openjdk:17-jre-slim
        command: ["sh", "-c", "echo 'Auth Service Starting...' && sleep 3600"]
        ports:
        - containerPort: 8082
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "kubernetes"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-secret
        - name: DB_URL
          value: "jdbc:mysql://mysql-service:3306/portfolio"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: password
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
EOF
```

### Rolling Updates Demo
```bash
# Update image version
kubectl set image deployment/frontend-deployment frontend=nginx:1.22

# Watch rolling update
kubectl rollout status deployment/frontend-deployment
kubectl get pods -l app=frontend -w

# Check rollout history
kubectl rollout history deployment/frontend-deployment

# Rollback if needed
kubectl rollout undo deployment/frontend-deployment
kubectl rollout status deployment/frontend-deployment
```

## Task 4: Services - Network Abstraction

### ClusterIP Services (Internal)
```bash
# Auth service - internal only
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: portfolio
  labels:
    app: auth-service
spec:
  type: ClusterIP
  selector:
    app: auth-service
  ports:
  - name: http
    port: 8082
    targetPort: 8082
    protocol: TCP
  sessionAffinity: None
EOF

# User service
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: portfolio
spec:
  type: ClusterIP
  selector:
    app: user-service
  ports:
  - name: http
    port: 8083
    targetPort: 8083
EOF

# Test service discovery
kubectl get services
kubectl get endpoints
```

### NodePort Service (Development)
```bash
# Frontend với NodePort để test
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: frontend-nodeport
  namespace: portfolio
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 30080
    protocol: TCP
EOF

# Test NodePort access
kubectl get services frontend-nodeport
# Access: http://<node-ip>:30080
```

### LoadBalancer Service (Production-like)
```bash
# Frontend LoadBalancer (MetalLB hoặc cloud provider)
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: frontend-loadbalancer
  namespace: portfolio
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
  - name: http
    port: 80
    targetPort: 80
  sessionAffinity: ClientIP
EOF

# Monitor external IP assignment
kubectl get services frontend-loadbalancer -w
```

## Task 5: Service Discovery Testing

### Internal Communication Test
```bash
# Deploy test pod for service discovery
kubectl run test-pod --image=curlimages/curl --rm -it --namespace=portfolio -- sh

# Inside test pod:
# Test DNS resolution
# nslookup auth-service
# nslookup user-service.portfolio.svc.cluster.local

# Test HTTP connectivity
# curl -v http://auth-service:8082/health
# curl -v http://user-service:8083/health

# Test environment variables
# env | grep SERVICE
```

### Cross-namespace Communication
```bash
# Create service in different namespace
kubectl create namespace test-ns
kubectl run nginx --image=nginx --namespace=test-ns
kubectl expose pod nginx --port=80 --namespace=test-ns

# Test from portfolio namespace
kubectl run test-cross-ns --image=curlimages/curl --rm -it --namespace=portfolio -- sh
# curl http://nginx.test-ns.svc.cluster.local
```

## Task 6: ConfigMaps và Secrets

### Create Configuration Data
```bash
# Application ConfigMap
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: portfolio
data:
  database.url: "mysql-service:3306"
  cache.ttl: "3600"
  log.level: "INFO"
  feature.flags: |
    oauth.enabled=true
    registration.open=true
    email.verification=true
EOF

# Nginx Config
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-nginx-config
  namespace: portfolio
data:
  default.conf: |
    server {
        listen 80;
        server_name localhost;
        
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files \$uri \$uri/ /index.html;
        }
        
        location /api/auth {
            proxy_pass http://auth-service:8082;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /api/users {
            proxy_pass http://user-service:8083;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
EOF
```

### Create Secrets
```bash
# Database secrets
kubectl create secret generic mysql-secrets \
  --from-literal=username=portfolio_user \
  --from-literal=password=portfolio_pass \
  --from-literal=root-password=rootpass123 \
  --namespace=portfolio

# JWT secrets
kubectl create secret generic auth-secrets \
  --from-literal=jwt-secret=myverylongsecretKeythatIs32CharsLong123456789ABC \
  --from-literal=oauth-client-id=github_client_id \
  --from-literal=oauth-client-secret=github_client_secret \
  --namespace=portfolio

# Verify secrets
kubectl get secrets -n portfolio
kubectl describe secret mysql-secrets -n portfolio
```

## Task 7: Complete Application Stack

### Deploy MySQL Database
```bash
# MySQL StatefulSet with persistent storage
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: portfolio
spec:
  serviceName: mysql-service
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: root-password
        - name: MYSQL_DATABASE
          value: "portfolio"
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: username
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secrets
              key: password
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        readinessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 60
          periodSeconds: 30
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: portfolio
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
  - port: 3306
EOF
```

### Deployment Verification
```bash
# Check all resources
kubectl get all -n portfolio

# Check persistent volumes
kubectl get pv,pvc -n portfolio

# Test database connectivity
kubectl exec -it mysql-0 -n portfolio -- mysql -u root -p
# Inside MySQL:
# SHOW DATABASES;
# USE portfolio;
# CREATE TABLE test (id INT PRIMARY KEY, name VARCHAR(50));
```

## Task 8: Health Checks và Monitoring

### Liveness và Readiness Probes
```bash
# Update deployment với comprehensive health checks
kubectl patch deployment frontend-deployment -n portfolio --type='merge' -p='
{
  "spec": {
    "template": {
      "spec": {
        "containers": [
          {
            "name": "frontend",
            "livenessProbe": {
              "httpGet": {
                "path": "/",
                "port": 80
              },
              "initialDelaySeconds": 30,
              "periodSeconds": 10,
              "timeoutSeconds": 5,
              "failureThreshold": 3
            },
            "readinessProbe": {
              "httpGet": {
                "path": "/",
                "port": 80
              },
              "initialDelaySeconds": 5,
              "periodSeconds": 5,
              "timeoutSeconds": 3,
              "failureThreshold": 2
            }
          }
        ]
      }
    }
  }
}'
```

### Resource Monitoring
```bash
# Monitor resource usage
kubectl top nodes
kubectl top pods -n portfolio

# Describe pods for events
kubectl describe pods -n portfolio

# Check pod logs
kubectl logs -l app=frontend -n portfolio --tail=50
```

## Verification Checklist

```bash
# ✅ All pods running
kubectl get pods -n portfolio | grep Running

# ✅ Services accessible
kubectl get services -n portfolio

# ✅ Service discovery working
kubectl run test --image=busybox --rm -it -n portfolio -- nslookup auth-service

# ✅ ConfigMaps mounted correctly
kubectl describe pod <pod-name> -n portfolio | grep -A 10 Volumes

# ✅ Secrets accessible
kubectl exec <pod-name> -n portfolio -- env | grep -E "(PASSWORD|SECRET)"

# ✅ Health checks passing
kubectl get pods -n portfolio -o wide
```

## Troubleshooting Common Issues

### Pod Issues
```bash
# Pod stuck in Pending
kubectl describe pod <pod-name> -n portfolio
kubectl get events -n portfolio --sort-by=.metadata.creationTimestamp

# Pod CrashLoopBackOff
kubectl logs <pod-name> -n portfolio --previous
kubectl describe pod <pod-name> -n portfolio
```

### Service Issues
```bash
# Service not accessible
kubectl get endpoints -n portfolio
kubectl describe service <service-name> -n portfolio

# DNS not resolving
kubectl exec -it test-pod -n portfolio -- nslookup <service-name>
```

### Storage Issues
```bash
# PVC stuck in Pending
kubectl describe pvc <pvc-name> -n portfolio
kubectl get storageclass
```

## Cleanup
```bash
# Delete specific resources
kubectl delete deployment frontend-deployment -n portfolio
kubectl delete service frontend-nodeport -n portfolio

# Delete all resources in namespace
kubectl delete all --all -n portfolio

# Delete secrets và configmaps
kubectl delete secrets --all -n portfolio
kubectl delete configmaps --all -n portfolio
```

## Next Lab Preview
Lab 03 sẽ focus vào:
- Ingress controllers và routing
- Advanced networking
- Service mesh introduction
- SSL/TLS termination
- External service integration