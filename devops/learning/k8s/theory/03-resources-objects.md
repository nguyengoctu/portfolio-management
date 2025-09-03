# Kubernetes Resources & Objects - Hands-on Focus

## Core Resources cho Portfolio Migration

### 1. Pods - Container Groups

#### Thực chiến: Single vs Multi-container Pods
```bash
# Simple pod cho email service
kubectl run email-service --image=portfolio-email --port=8081

# Multi-container pod với sidecar logging
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: auth-service-pod
spec:
  containers:
  - name: auth-service
    image: portfolio-auth-service
    ports:
    - containerPort: 8082
  - name: log-collector
    image: fluentd:latest
    volumeMounts:
    - name: logs
      mountPath: /var/log
  volumes:
  - name: logs
    emptyDir: {}
EOF
```

#### Debug Pod Issues
```bash
# Pod lifecycle commands
kubectl get pods -o wide
kubectl describe pod auth-service-pod
kubectl logs auth-service-pod -c auth-service
kubectl exec -it auth-service-pod -c auth-service -- bash

# Pod resource usage
kubectl top pods
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU:.spec.containers[0].resources.requests.cpu,MEM:.spec.containers[0].resources.requests.memory
```

### 2. ReplicaSets & Deployments

#### ReplicaSet Hands-on
```bash
# Tạo ReplicaSet cho user-service
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: user-service-rs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: portfolio-user-service:latest
        ports:
        - containerPort: 8083
EOF

# Test scaling
kubectl scale rs user-service-rs --replicas=5
kubectl get rs user-service-rs -w
```

#### Deployment Best Practices
```bash
# Create deployment với rolling update strategy
kubectl create deployment auth-service \
  --image=portfolio-auth-service:v1 \
  --replicas=3 \
  --port=8082

# Rolling update simulation
kubectl set image deployment/auth-service auth-service=portfolio-auth-service:v2
kubectl rollout status deployment/auth-service
kubectl rollout history deployment/auth-service

# Rollback nếu có issues
kubectl rollout undo deployment/auth-service
kubectl rollout undo deployment/auth-service --to-revision=1
```

### 3. Services - Network Abstraction

#### Service Types Thực tế

##### ClusterIP (Internal Services)
```bash
# Auth service - chỉ internal access
kubectl expose deployment auth-service --type=ClusterIP --port=8082

# Test internal connectivity
kubectl run test-pod --image=curlimages/curl --rm -it -- sh
# curl http://auth-service:8082/health
```

##### NodePort (Development Access)  
```bash
# Frontend với NodePort để test external access
kubectl expose deployment frontend --type=NodePort --port=3000

# Get NodePort
kubectl get svc frontend
# Access via: http://<node-ip>:<nodeport>
```

##### LoadBalancer (Production)
```bash
# Production frontend với LoadBalancer
kubectl expose deployment frontend --type=LoadBalancer --port=80 --target-port=3000

# Check external IP
kubectl get svc frontend -w
```

#### Service Discovery Testing
```bash
# Test service discovery between services
kubectl exec -it deployment/frontend -- nslookup auth-service
kubectl exec -it deployment/frontend -- nslookup user-service

# Environment variables method
kubectl exec -it deployment/frontend -- env | grep SERVICE
```

### 4. ConfigMaps - Configuration Management

#### Migrate Docker Compose Environment Variables
```bash
# Current docker-compose environment:
# AUTH_URL=http://${VM_HOST:-localhost}:8082
# USER_URL=http://${VM_HOST:-localhost}:8083

# Create ConfigMap
kubectl create configmap app-config \
  --from-literal=AUTH_URL=http://auth-service:8082 \
  --from-literal=USER_URL=http://user-service:8083 \
  --from-literal=EMAIL_URL=http://email-service:8081

# Use ConfigMap in deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: portfolio-frontend
        envFrom:
        - configMapRef:
            name: app-config
EOF
```

#### File-based Configuration
```bash
# Spring Boot application.yml via ConfigMap
kubectl create configmap auth-config \
  --from-file=application.yml=./auth-service/application.yml

# Mount as volume
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
      - name: auth-service
        volumeMounts:
        - name: config
          mountPath: /app/config
      volumes:
      - name: config
        configMap:
          name: auth-config
EOF
```

### 5. Secrets - Sensitive Data

#### Database Credentials Migration
```bash
# Docker Compose secrets → K8s Secrets
kubectl create secret generic mysql-secret \
  --from-literal=MYSQL_ROOT_PASSWORD=rootpassword \
  --from-literal=MYSQL_USER=user \
  --from-literal=MYSQL_PASSWORD=password

kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET=bXlWZXJ5U2VjcmV0S2V5VGhhdElzMzJDaGFyc0xvbmc=

# Use secrets in deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
      - name: auth-service
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: JWT_SECRET
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_PASSWORD
EOF
```

#### TLS Secrets cho HTTPS
```bash
# Create TLS secret
kubectl create secret tls portfolio-tls \
  --cert=path/to/tls.cert \
  --key=path/to/tls.key

# Use với Ingress
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-ingress
spec:
  tls:
  - hosts:
    - portfolio.example.com
    secretName: portfolio-tls
EOF
```

### 6. StatefulSets - Stateful Applications

#### MySQL StatefulSet Implementation
```bash
# MySQL cần stable network identity và persistent storage
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
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
              name: mysql-secret
              key: MYSQL_ROOT_PASSWORD
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
          storage: 20Gi
EOF

# Test MySQL connectivity
kubectl exec -it mysql-0 -- mysql -u root -p
```

### 7. Jobs & CronJobs - Background Tasks

#### Flyway Database Migration Job
```bash
# Migrate flyway-migrate service to K8s Job
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: flyway-migrate
spec:
  template:
    spec:
      containers:
      - name: flyway
        image: flyway/flyway:10-alpine
        command: ["flyway", "migrate"]
        env:
        - name: FLYWAY_URL
          value: "jdbc:mysql://mysql:3306/portfolio"
        - name: FLYWAY_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_USER
        - name: FLYWAY_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_PASSWORD
        volumeMounts:
        - name: migrations
          mountPath: /flyway/sql
      volumes:
      - name: migrations
        configMap:
          name: flyway-migrations
      restartPolicy: OnFailure
  backoffLimit: 3
EOF

# Monitor job execution
kubectl get jobs
kubectl logs job/flyway-migrate -f
```

#### Backup CronJob
```bash
# Automated database backup
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mysql-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: mysql-backup
            image: mysql:8.0
            command:
            - sh
            - -c
            - |
              mysqldump -h mysql -u \$MYSQL_USER -p\$MYSQL_PASSWORD portfolio > /backup/backup-\$(date +%Y%m%d-%H%M%S).sql
            env:
            - name: MYSQL_USER
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_USER
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_PASSWORD
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF
```

## Resource Management & Limits

### Resource Requests & Limits
```bash
# Set resource constraints cho production
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
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
EOF

# Monitor resource usage
kubectl top nodes
kubectl top pods
kubectl describe node <node-name>
```

### Quality of Service Classes
```bash
# Guaranteed QoS (requests = limits)
# Burstable QoS (requests < limits)
# BestEffort QoS (no requests/limits)

kubectl get pods -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

## Practical Troubleshooting

### Common Issues & Solutions
```bash
# Pod stuck in Pending
kubectl describe pod <pod-name>
kubectl get events --sort-by=.metadata.creationTimestamp

# Service not accessible
kubectl get endpoints
kubectl describe service <service-name>

# Config issues
kubectl get configmaps
kubectl describe configmap <configmap-name>

# Secret issues
kubectl get secrets
kubectl describe secret <secret-name>
```

## Next Steps: Real Implementation
1. Convert docker-compose.yml to K8s manifests
2. Setup persistent storage for MySQL/MinIO
3. Implement service mesh for inter-service communication
4. Setup monitoring và logging stack