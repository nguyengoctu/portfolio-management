# Exercise 01: Basic K8s Concepts - Hands-on Practice

## Overview
Thực hành các concepts cơ bản của Kubernetes thông qua portfolio project context.

## Setup Requirements
```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Create exercise namespace
kubectl create namespace exercise-01
kubectl config set-context --current --namespace=exercise-01
```

## Exercise 1.1: Pod Fundamentals

### Task: Create Single Container Pod
**Scenario**: Deploy email service như một simple pod

```bash
# Create pod manifest
cat <<EOF > email-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: email-service
  labels:
    app: email-service
    tier: backend
spec:
  containers:
  - name: email-service
    image: node:18-alpine
    command: ["sh", "-c"]
    args: ["echo 'Email Service Starting...' && sleep 3600"]
    ports:
    - containerPort: 8081
    env:
    - name: NODE_ENV
      value: "production"
    - name: PORT
      value: "8081"
    - name: MAIL_HOST
      value: "smtp.gmail.com"
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"
EOF

# Apply pod
kubectl apply -f email-pod.yaml
```

**Verification Commands:**
```bash
# Check pod status
kubectl get pods

# Describe pod details
kubectl describe pod email-service

# Check pod logs
kubectl logs email-service

# Access pod shell
kubectl exec -it email-service -- sh
# Inside pod: env | grep -E "(NODE_ENV|PORT|MAIL_HOST)"
```

**Expected Output:**
- Pod should be in `Running` state
- Environment variables correctly set
- Resource limits applied

### Task: Multi-container Pod with Shared Volume
**Scenario**: Auth service with logging sidecar

```bash
cat <<EOF > auth-sidecar-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: auth-with-logger
  labels:
    app: auth-service
spec:
  containers:
  - name: auth-service
    image: openjdk:17-jre-slim
    command: ["sh", "-c"]
    args: ["echo 'Auth Service Starting...' && while true; do echo \$(date): Auth processing request >> /shared/app.log; sleep 30; done"]
    volumeMounts:
    - name: shared-logs
      mountPath: /shared
    resources:
      requests:
        memory: "256Mi"
        cpu: "200m"
  - name: log-shipper  
    image: busybox:1.35
    command: ["sh", "-c"]
    args: ["while true; do echo 'Shipping logs...'; tail -f /shared/app.log 2>/dev/null || sleep 5; done"]
    volumeMounts:
    - name: shared-logs
      mountPath: /shared
    resources:
      requests:
        memory: "64Mi"
        cpu: "50m"
  volumes:
  - name: shared-logs
    emptyDir: {}
EOF

kubectl apply -f auth-sidecar-pod.yaml
```

**Verification:**
```bash
# Check both containers running
kubectl get pods auth-with-logger

# Check logs from each container
kubectl logs auth-with-logger -c auth-service
kubectl logs auth-with-logger -c log-shipper

# Verify shared volume
kubectl exec -it auth-with-logger -c auth-service -- ls -la /shared/
kubectl exec -it auth-with-logger -c log-shipper -- cat /shared/app.log
```

## Exercise 1.2: Labels and Selectors

### Task: Label Management
```bash
# Add labels to existing pods
kubectl label pod email-service version=v1.0 environment=development

# Add more labels  
kubectl label pod auth-with-logger version=v2.0 environment=production team=backend

# View labels
kubectl get pods --show-labels

# Filter pods by labels
kubectl get pods -l app=email-service
kubectl get pods -l environment=production
kubectl get pods -l 'version in (v1.0,v2.0)'
```

**Questions to Answer:**
1. Làm thế nào để list all pods có label `tier=backend`?
2. Làm thế nào để remove label `environment` từ pod?
3. Làm thế nao để update label value?

**Answers:**
```bash
# 1. List pods with tier=backend
kubectl get pods -l tier=backend

# 2. Remove environment label
kubectl label pod email-service environment-

# 3. Update label value
kubectl label pod email-service version=v1.1 --overwrite
```

## Exercise 1.3: ReplicaSets

### Task: Create ReplicaSet for User Service
```bash
cat <<EOF > user-service-rs.yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: user-service-rs
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
        version: v1.0
    spec:
      containers:
      - name: user-service
        image: openjdk:17-jre-slim  
        command: ["sh", "-c"]
        args: ["echo 'User Service \$HOSTNAME starting...' && sleep 3600"]
        ports:
        - containerPort: 8083
        env:
        - name: SERVICE_NAME
          value: "user-service"
        - name: DATABASE_URL
          value: "jdbc:mysql://mysql:3306/portfolio"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
EOF

kubectl apply -f user-service-rs.yaml
```

**Scaling Operations:**
```bash
# Check initial replicas
kubectl get rs user-service-rs
kubectl get pods -l app=user-service

# Scale up
kubectl scale rs user-service-rs --replicas=5
kubectl get pods -l app=user-service -w

# Scale down
kubectl scale rs user-service-rs --replicas=2
kubectl get pods -l app=user-service

# Test self-healing
POD_NAME=$(kubectl get pods -l app=user-service -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD_NAME
kubectl get pods -l app=user-service -w
```

**Verification Tasks:**
1. Confirm 5 pods are running after scale up
2. Confirm only 2 pods remain after scale down  
3. Confirm new pod is created when one is deleted
4. Check that all pods have correct labels

## Exercise 1.4: Deployments

### Task: Convert ReplicaSet to Deployment
```bash
# Delete existing ReplicaSet (keep pods running)
kubectl delete rs user-service-rs --cascade=orphan

# Create Deployment
cat <<EOF > user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        tier: backend
    spec:
      containers:
      - name: user-service
        image: openjdk:17-jre-slim
        command: ["sh", "-c"] 
        args: ["echo 'User Service v1.0 on \$HOSTNAME' && sleep 3600"]
        ports:
        - containerPort: 8083
        env:
        - name: APP_VERSION
          value: "v1.0"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
        readinessProbe:
          exec:
            command:
            - sh
            - -c
            - "echo 'Ready check passed'"
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          exec:
            command:
            - sh  
            - -c
            - "echo 'Live check passed'"
          initialDelaySeconds: 20
          periodSeconds: 10
EOF

kubectl apply -f user-service-deployment.yaml
```

### Task: Rolling Update Simulation
```bash
# Check initial deployment
kubectl get deployment user-service
kubectl get pods -l app=user-service

# Update image (simulate new version)
kubectl patch deployment user-service -p='{"spec":{"template":{"spec":{"containers":[{"name":"user-service","env":[{"name":"APP_VERSION","value":"v2.0"}],"args":["echo \"User Service v2.0 on $HOSTNAME\" && sleep 3600"]}]}}}}'

# Watch rolling update
kubectl rollout status deployment/user-service
kubectl get pods -l app=user-service -w

# Check rollout history  
kubectl rollout history deployment/user-service

# Rollback to previous version
kubectl rollout undo deployment/user-service
kubectl rollout status deployment/user-service
```

**Verification:**
```bash
# Verify pods are updated
kubectl get pods -l app=user-service
kubectl logs <pod-name> | grep "v2.0"

# After rollback, verify v1.0
kubectl logs <pod-name> | grep "v1.0"
```

## Exercise 1.5: Services

### Task: ClusterIP Service for Internal Communication
```bash
cat <<EOF > user-service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service-internal
  labels:
    app: user-service
spec:
  type: ClusterIP
  selector:
    app: user-service
  ports:
  - name: http
    port: 8083
    targetPort: 8083
    protocol: TCP
EOF

kubectl apply -f user-service-clusterip.yaml
```

### Task: NodePort Service for External Access
```bash
cat <<EOF > user-service-nodeport.yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service-external
spec:
  type: NodePort
  selector:
    app: user-service
  ports:
  - name: http
    port: 8083
    targetPort: 8083
    nodePort: 30083
    protocol: TCP
EOF

kubectl apply -f user-service-nodeport.yaml
```

### Task: Test Service Discovery
```bash
# Create test pod for connectivity testing
kubectl run test-client --image=curlimages/curl --rm -it -- sh

# Inside test pod:
# Test ClusterIP service
# nslookup user-service-internal
# wget -qO- http://user-service-internal:8083 || echo "Connection test"

# Test NodePort (from outside cluster)
kubectl get services user-service-external
# Access via: http://<node-ip>:30083
```

## Exercise 1.6: ConfigMaps and Secrets

### Task: Create Application Configuration
```bash
# Create ConfigMap for application settings
kubectl create configmap portfolio-config \
  --from-literal=database.host=mysql-service \
  --from-literal=database.port=3306 \
  --from-literal=database.name=portfolio \
  --from-literal=log.level=INFO \
  --from-literal=app.environment=kubernetes

# Create ConfigMap from file
cat <<EOF > application.properties
server.port=8083
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=INFO
EOF

kubectl create configmap app-properties --from-file=application.properties

# Create Secrets
kubectl create secret generic database-credentials \
  --from-literal=username=portfolio_user \
  --from-literal=password=portfolio_pass \
  --from-literal=root-password=root123

kubectl create secret generic api-keys \
  --from-literal=jwt-secret=myverylongsecretKeythatIs32CharsLong123456789ABC \
  --from-literal=github-client-id=your_github_client_id \
  --from-literal=github-client-secret=your_github_client_secret
```

### Task: Use ConfigMap and Secrets in Deployment
```bash
cat <<EOF > user-service-with-config.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-configured
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service-configured
  template:
    metadata:
      labels:
        app: user-service-configured
    spec:
      containers:
      - name: user-service
        image: openjdk:17-jre-slim
        command: ["sh", "-c"]
        args: ["echo 'Starting with config...' && env | sort && sleep 3600"]
        ports:
        - containerPort: 8083
        env:
        # From ConfigMap
        - name: DATABASE_HOST
          valueFrom:
            configMapKeyRef:
              name: portfolio-config
              key: database.host
        - name: DATABASE_PORT
          valueFrom:
            configMapKeyRef:
              name: portfolio-config
              key: database.port
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: portfolio-config
              key: log.level
        # From Secret
        - name: DATABASE_USERNAME
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: username
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: jwt-secret
        # Mount ConfigMap as volume
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
        # Mount Secret as volume
        - name: secret-volume
          mountPath: /app/secrets
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-properties
      - name: secret-volume
        secret:
          secretName: database-credentials
EOF

kubectl apply -f user-service-with-config.yaml
```

**Verification:**
```bash
# Check environment variables
kubectl exec -it deployment/user-service-configured -- env | grep -E "(DATABASE_|LOG_|JWT_)"

# Check mounted files
kubectl exec -it deployment/user-service-configured -- ls -la /app/config/
kubectl exec -it deployment/user-service-configured -- cat /app/config/application.properties

kubectl exec -it deployment/user-service-configured -- ls -la /app/secrets/
kubectl exec -it deployment/user-service-configured -- cat /app/secrets/username
```

## Exercise 1.7: Resource Management

### Task: Resource Requests and Limits
```bash
cat <<EOF > frontend-with-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
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
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        env:
        - name: BACKEND_API
          value: "http://user-service-internal:8083"
        # Simulate high CPU usage for testing
        lifecycle:
          postStart:
            exec:
              command: 
              - sh
              - -c
              - "echo 'Frontend starting...' && for i in {1..100}; do echo 'Processing request $i'; done"
EOF

kubectl apply -f frontend-with-resources.yaml
```

**Resource Monitoring:**
```bash
# Check resource usage
kubectl top nodes
kubectl top pods

# Describe nodes to see resource allocation
kubectl describe node <node-name>

# Check pod resource requests/limits
kubectl describe pod <frontend-pod-name>
```

### Task: Quality of Service Classes
```bash
# Check QoS class for different pods
kubectl get pods -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass

# Create pods with different QoS classes

# BestEffort (no requests/limits)
kubectl run besteffort-pod --image=nginx --rm -it --dry-run=client -o yaml | kubectl apply -f -

# Burstable (requests < limits) 
kubectl run burstable-pod --image=nginx --requests=cpu=100m,memory=128Mi --limits=cpu=200m,memory=256Mi --rm -it --dry-run=client -o yaml | kubectl apply -f -

# Guaranteed (requests = limits)
kubectl run guaranteed-pod --image=nginx --requests=cpu=200m,memory=256Mi --limits=cpu=200m,memory=256Mi --rm -it --dry-run=client -o yaml | kubectl apply -f -

# Check QoS classes
kubectl get pods -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

## Exercise 1.8: Health Checks

### Task: Implement Readiness and Liveness Probes
```bash
cat <<EOF > auth-service-with-probes.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
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
        image: openjdk:17-jre-slim
        command: ["sh", "-c"]
        args: |
          [
            "echo 'Auth Service Starting...' && 
             echo 'Ready' > /tmp/ready &&
             echo 'Alive' > /tmp/alive &&
             sleep 30 &&
             rm /tmp/ready &&
             echo 'Service became not ready' &&
             sleep 3600"
          ]
        ports:
        - containerPort: 8082
        readinessProbe:
          exec:
            command:
            - cat
            - /tmp/ready
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 1
          failureThreshold: 3
        livenessProbe:
          exec:
            command:
            - cat  
            - /tmp/alive
          initialDelaySeconds: 15
          periodSeconds: 10
          timeoutSeconds: 1
          failureThreshold: 3
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
EOF

kubectl apply -f auth-service-with-probes.yaml
```

**Health Check Testing:**
```bash
# Watch pod status changes
kubectl get pods -l app=auth-service -w

# Check pod events
kubectl describe pod <auth-service-pod>

# Check probe failures
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Cleanup
```bash
# Delete all resources in exercise namespace
kubectl delete all --all -n exercise-01

# Delete ConfigMaps and Secrets
kubectl delete configmaps --all -n exercise-01
kubectl delete secrets --all -n exercise-01

# Delete namespace
kubectl delete namespace exercise-01
```

## Summary Questions

1. **Pod Lifecycle**: Tại sao pod restart khi container fails?
2. **Labels**: Làm thế nào để select pods với multiple label conditions?
3. **ReplicaSet vs Deployment**: Khi nào dùng ReplicaSet thay vì Deployment?
4. **Services**: Tại sao cần ClusterIP service khi pods có thể talk directly?
5. **ConfigMaps vs Secrets**: Khi nào dùng ConfigMap vs Secret?
6. **Health Checks**: Khác biệt giữa readiness và liveness probes?
7. **Resources**: Ảnh hưởng của resource requests lên pod scheduling?

**Expected Learning Outcomes:**
- Hiểu rõ pod lifecycle và container management
- Thành thạo label selectors và resource filtering
- Nắm vững concepts của ReplicaSets và Deployments
- Hiểu service types và networking basics
- Biết cách manage configuration và secrets
- Implement health checks appropriately
- Manage resources effectively