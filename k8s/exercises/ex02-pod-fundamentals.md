# Exercise 02: Pod Fundamentals

## 🎯 Objective
Thực hành tạo và quản lý pods, hiểu pod lifecycle với portfolio services.

## 📋 Prerequisites
- Cluster đã setup và running
- Completed Exercise 01

## 🧪 Tasks

### Task 1: Single Container Pod - Auth Service

Create pod tương tự auth-service của project:

1. **Create auth-service pod:**
```yaml
# File: auth-service-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: auth-pod
  labels:
    app: ____
    service: ____
spec:
  containers:
  - name: ____
    image: ____ # Use a Spring Boot image or simple nginx for testing
    ports:
    - containerPort: ____
    env:
    - name: SERVER_PORT
      value: "____"
    # Add other environment variables from docker-compose.yml:
    - name: ____
      value: ____
```

**Hints:**
- Check `docker-compose.yml` for auth-service port and env vars
- Can use `nginx` for now, later replace with actual Spring Boot image

2. **Apply and test:**
```bash
# Apply the pod:


# Check pod status:


# Get detailed info:


# What's the pod IP? ____
# What node is it running on? ____
```

3. **Test connectivity:**
```bash
# Port forward to test:


# Test in another terminal:
curl http://localhost:8082

# What response did you get? ____
```

### Task 2: Multi-Container Pod - User Service with Sidecar

Create pod với main container + sidecar (logging):

```yaml
# File: user-service-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: user-pod
  labels:
    app: ____
    service: ____
spec:
  containers:
  # Main container
  - name: user-service
    image: ____
    ports:
    - containerPort: ____
    volumeMounts:
    - name: ____
      mountPath: ____
    env:
    - name: SERVER_PORT
      value: "____"
    # Add other env vars from docker-compose.yml
    
  # Sidecar container for logging
  - name: ____
    image: busybox
    command: ["____"]
    args: ["____", "____"] # Hint: tail logs from shared volume
    volumeMounts:
    - name: ____
      mountPath: ____
      
  volumes:
  - name: ____
    emptyDir: {}
```

**Fill in the blanks and apply:**
```bash
# Apply pod:


# Check both containers are running:


# Check logs from main container:


# Check logs from sidecar:


# Both containers should be running: ____/____
```

### Task 3: Pod with ConfigMap - Email Service

Create ConfigMap và pod tương tự email-service:

1. **Create ConfigMap from literal values:**
```bash
# Extract email service config from docker-compose.yml
# Create ConfigMap:
kubectl create configmap email-config \
  --from-literal=SMTP_HOST=____ \
  --from-literal=SMTP_PORT=____ \
  --from-literal=____=____
```

2. **Create pod using ConfigMap:**
```yaml
# File: email-service-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: email-pod
spec:
  containers:
  - name: ____
    image: ____ # Use appropriate image
    ports:
    - containerPort: ____
    env:
    - name: ____
      valueFrom:
        configMapKeyRef:
          name: ____
          key: ____
    # Add more env vars from ConfigMap
```

3. **Test configuration:**
```bash
# Apply pod:


# Check env vars inside pod:
kubectl exec email-pod -- env | grep ____

# List the environment variables you see:
# ____
# ____
# ____
```

### Task 4: Pod with Secret - Database Connection

Create Secret cho database credentials:

1. **Create Secret:**
```bash
# Create secret with database credentials from docker-compose.yml:
kubectl create secret generic db-secret \
  --from-literal=MYSQL_USER=____ \
  --from-literal=MYSQL_PASSWORD=____ \
  --from-literal=MYSQL_DATABASE=____
```

2. **Create pod using Secret:**
```yaml
# File: db-client-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: db-client
spec:
  containers:
  - name: mysql-client
    image: mysql:8.0
    command: ["sleep", "3600"]
    env:
    - name: ____
      valueFrom:
        secretKeyRef:
          name: ____
          key: ____
    # Add other secret values
```

3. **Test secret usage:**
```bash
# Apply pod:


# Check secrets are properly mounted:
kubectl exec db-client -- env | grep MYSQL

# What values do you see? (Should be the actual values, not base64)
# ____
```

### Task 5: Pod Lifecycle và Health Checks

Create pod với health checks giống production setup:

```yaml
# File: healthy-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: healthy-service
spec:
  containers:
  - name: web
    image: nginx
    ports:
    - containerPort: 80
    # Add liveness probe
    livenessProbe:
      httpGet:
        path: ____
        port: ____
      initialDelaySeconds: ____
      periodSeconds: ____
    # Add readiness probe  
    readinessProbe:
      httpGet:
        path: ____
        port: ____
      initialDelaySeconds: ____
      periodSeconds: ____
    # Add resource limits
    resources:
      requests:
        memory: "____"
        cpu: "____"
      limits:
        memory: "____"
        cpu: "____"
```

**Test health checks:**
```bash
# Apply pod:


# Watch pod startup:
kubectl get pod healthy-service -w

# Describe pod to see health check results:


# What's the readiness status? ____
# What's the restart count? ____
```

### Task 6: Portfolio Service Integration Test

Create all portfolio services as pods để test communication:

1. **Create namespace:**
```bash
# Create namespace for portfolio:


# Set as default:

```

2. **Deploy all services as pods:**
```bash
# Apply all previous pod manifests to the namespace:
kubectl apply -f auth-service-pod.yaml -n ____
kubectl apply -f user-service-pod.yaml -n ____
kubectl apply -f email-service-pod.yaml -n ____

# Check all pods:


# List pod IPs:

```

3. **Test inter-pod communication:**
```bash
# From auth-pod, try to reach user-pod:
kubectl exec auth-pod -n ____ -- curl http://<user-pod-ip>:____

# From user-pod, try to reach email-pod:
kubectl exec user-pod -n ____ -- ____

# Results:
# Auth -> User: ____
# User -> Email: ____
```

### Task 7: Troubleshooting Exercise

Intentionally create problematic pods:

1. **Pod with wrong image:**
```yaml
# File: broken-auth.yaml
apiVersion: v1
kind: Pod
metadata:
  name: broken-auth
spec:
  containers:
  - name: auth
    image: nonexistent/auth:latest
    ports:
    - containerPort: 8082
```

2. **Debug the issue:**
```bash
# Apply broken pod:


# Check status:


# What's the status? ____

# Get events:


# What's the error message? ____

# Fix the issue by editing the pod:
# kubectl edit pod broken-auth
# Change image to: ____
```

3. **Pod with resource constraints:**
```yaml
# File: resource-limited.yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-limited
spec:
  containers:
  - name: app
    image: nginx
    resources:
      limits:
        memory: "1Mi"  # Intentionally too low
        cpu: "1m"
```

**Debug resource issues:**
```bash
# Apply and observe:


# What happens? ____
# Check events: ____
# Fix by changing limits to: memory="____", cpu="____"
```

## 🎯 Success Criteria

- [ ] Created single container pod (auth-service)
- [ ] Created multi-container pod (user-service + sidecar)
- [ ] Used ConfigMap trong pod (email-service)
- [ ] Used Secret trong pod (database client)
- [ ] Implemented health checks
- [ ] Tested inter-pod communication
- [ ] Successfully debugged problematic pods

## 📝 Key Learnings

1. **Pod IP addresses:**
   - Auth pod IP: ____
   - User pod IP: ____
   - Email pod IP: ____

2. **What happens when pod restarts?**
   Answer: ____

3. **How do containers trong same pod communicate?**
   Answer: ____

4. **Best practices learned:**
   - Always set ____
   - Use ____ for configuration
   - Use ____ for sensitive data
   - Implement ____ for production

## 🚀 Next Step
Proceed to **Exercise 03: Services & Networking** (`k8s/exercises/ex03-services-networking.md`)