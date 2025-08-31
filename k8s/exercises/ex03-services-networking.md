# Exercise 03: Services & Networking

## 🎯 Objective
Tạo Services để expose pods và enable communication giữa portfolio services.

## 📋 Prerequisites
- Completed Exercise 02 (pods are running)
- Portfolio service pods deployed

## 🧪 Tasks

### Task 1: ClusterIP Service - Internal Communication

Create ClusterIP service để expose auth-service internally:

1. **Create auth-service ClusterIP:**
```yaml
# File: auth-service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
  namespace: ____
spec:
  selector:
    app: ____        # Match label from auth-service pod
    service: ____
  ports:
  - protocol: ____
    port: ____       # Service port (same as docker-compose)
    targetPort: ____  # Pod port
  type: ____
```

2. **Apply và test internal connectivity:**
```bash
# Apply service:


# Check service details:


# What's the service IP? ____
# What endpoints are connected? ____

# Test from another pod:
kubectl run test-pod --image=busybox --rm -it -- /bin/sh
# Inside the pod:
/ # nslookup ____
/ # wget -qO- http://____:____
```

3. **Test service discovery:**
```bash
# From test pod, check DNS resolution:
/ # nslookup auth-service.____
/ # env | grep ____  # Check service environment variables

# DNS results:
# Service FQDN: ____
# Service IP: ____
```

### Task 2: NodePort Service - External Access

Expose frontend service với NodePort:

1. **Create frontend pod:**
```yaml
# File: frontend-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: frontend-pod
  labels:
    app: ____
    service: ____
spec:
  containers:
  - name: ____
    image: nginx  # Simulate frontend
    ports:
    - containerPort: ____
```

2. **Create NodePort service:**
```yaml
# File: frontend-nodeport.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
spec:
  selector:
    app: ____
  ports:
  - protocol: TCP
    port: ____        # Internal service port
    targetPort: ____  # Pod port  
    nodePort: ____   # External port (30000-32767)
  type: ____
```

3. **Test external access:**
```bash
# Apply frontend pod and service:


# Get node IP:
kubectl get nodes -o wide

# Test external access:
# If using minikube: minikube ip
curl http://<node-ip>:____

# Result: ____
```

### Task 3: Service Endpoints và Load Balancing

Scale up auth-service để test load balancing:

1. **Create multiple auth pods:**
```bash
# Create 3 auth pods with same labels:
kubectl run auth-pod-1 --image=nginx --labels="app=portfolio,service=auth" --port=80
kubectl run auth-pod-2 --image=nginx --labels="app=portfolio,service=auth" --port=80  
kubectl run auth-pod-3 --image=nginx --labels="app=portfolio,service=auth" --port=80
```

2. **Check service endpoints:**
```bash
# Check endpoints for auth-service:
kubectl get endpoints ____

# How many endpoints? ____
# List the IPs: ____
```

3. **Test load balancing:**
```bash
# Create test script trong test pod:
kubectl run load-test --image=busybox --rm -it -- /bin/sh

# Inside pod, run multiple requests:
/ # for i in {1..10}; do wget -qO- http://auth-service; echo; done

# Do you see traffic distributed across pods? ____
```

### Task 4: Service Communication Matrix

Setup complete portfolio service communication:

1. **Create all ClusterIP services:**

```yaml
# File: user-service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
spec:
  selector:
    app: ____
    service: ____
  ports:
  - port: ____
    targetPort: ____
```

```yaml
# File: email-service-clusterip.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
spec:
  selector:
    app: ____
    service: ____
  ports:
  - port: ____
    targetPort: ____
```

2. **Test service mesh connectivity:**
```bash
# Apply all services:


# Test from frontend to auth:
kubectl exec frontend-pod -- curl http://____:____

# Test from auth to user:
kubectl exec auth-pod-1 -- curl http://____:____

# Test from auth to email:
kubectl exec auth-pod-1 -- curl http://____:____

# Results matrix:
# Frontend -> Auth: ____
# Auth -> User: ____  
# Auth -> Email: ____
```

### Task 5: Database Service - StatefulService Preparation

Create service cho database (preparation for StatefulSet):

1. **Create MySQL pod:**
```yaml
# File: mysql-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: mysql-pod
  labels:
    app: ____
    service: ____
spec:
  containers:
  - name: ____
    image: mysql:8.0
    env:
    - name: MYSQL_ROOT_PASSWORD
      value: "____"  # From docker-compose.yml
    - name: MYSQL_DATABASE  
      value: "____"
    - name: MYSQL_USER
      value: "____"
    - name: MYSQL_PASSWORD
      value: "____"
    ports:
    - containerPort: ____
```

2. **Create MySQL service:**
```yaml
# File: mysql-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
spec:
  selector:
    app: ____
    service: ____
  ports:
  - port: ____
    targetPort: ____
  type: ____  # Internal only
```

3. **Test database connectivity:**
```bash
# Apply MySQL pod and service:


# Test connection from auth service:
kubectl exec auth-pod-1 -- nslookup ____

# Create MySQL client pod:
kubectl run mysql-client --image=mysql:8.0 --rm -it -- mysql -h____ -u____ -p____

# Can you connect? ____
# What databases exist? 
mysql> SHOW DATABASES;
```

### Task 6: Headless Service - Service Discovery

Create headless service để discover individual pod IPs:

1. **Create headless service:**
```yaml
# File: auth-headless.yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-headless
spec:
  clusterIP: ____    # Set to None for headless
  selector:
    app: portfolio
    service: auth
  ports:
  - port: 80
```

2. **Test individual pod discovery:**
```bash
# Apply headless service:


# Test DNS resolution:
kubectl run dns-test --image=busybox --rm -it -- nslookup ____

# What IPs are returned? ____
# Are these the individual pod IPs? ____
```

### Task 7: Service Troubleshooting

Practice debugging service connectivity issues:

1. **Create service với wrong selector:**
```yaml
# File: broken-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: broken-service
spec:
  selector:
    app: wrong-label  # Intentionally wrong
  ports:
  - port: 80
    targetPort: 80
```

2. **Debug the issue:**
```bash
# Apply broken service:


# Check endpoints:
kubectl get endpoints broken-service

# How many endpoints? ____
# Why are there no endpoints? ____

# Fix by changing selector to correct labels:
# kubectl edit service broken-service
# Change app: to ____
```

3. **Service with wrong port:**
```yaml
# File: wrong-port-service.yaml
apiVersion: v1  
kind: Service
metadata:
  name: wrong-port-service
spec:
  selector:
    app: portfolio
    service: auth
  ports:
  - port: 80
    targetPort: 9999  # Wrong target port
```

**Debug port issues:**
```bash
# Apply and test:
kubectl apply -f wrong-port-service.yaml
kubectl run test --image=busybox --rm -it -- wget -qO- http://wrong-port-service

# What error do you get? ____
# Fix by changing targetPort to: ____
```

### Task 8: Multi-Port Service

Create service với multiple ports (như real microservice):

```yaml
# File: multi-port-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ____
spec:
  selector:
    app: ____
  ports:
  - name: ____      # HTTP traffic
    protocol: TCP
    port: ____
    targetPort: ____
  - name: ____      # Health check port  
    protocol: TCP
    port: ____
    targetPort: ____
  - name: ____      # Metrics port
    protocol: TCP
    port: ____
    targetPort: ____
```

**Test multi-port access:**
```bash
# Apply service:


# Test different ports:
kubectl port-forward service/____ ____:____  # HTTP port
kubectl port-forward service/____ ____:____  # Health port

# Can you access both ports? ____
```

## 🎯 Success Criteria

- [ ] Created ClusterIP service for internal communication
- [ ] Created NodePort service for external access
- [ ] Tested service load balancing với multiple pods
- [ ] Setup complete service communication matrix
- [ ] Created database service
- [ ] Tested headless service discovery
- [ ] Successfully debugged service issues
- [ ] Created multi-port service

## 📝 Service Discovery Summary

Fill in your service discovery results:

```
Service Name          Type        ClusterIP      External Access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
auth-service          ____        ____           ____
user-service          ____        ____           ____  
email-service         ____        ____           ____
frontend-service      ____        ____           ____:____
mysql-service         ____        ____           ____
```

## 📝 Communication Matrix

Test results:
```
From           To              Result    Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend   →   Auth-service    ____      ____
Auth       →   User-service    ____      ____
Auth       →   Email-service   ____      ____  
Auth       →   MySQL           ____      ____
User       →   MySQL           ____      ____
```

## 🚀 Next Step
Proceed to **Exercise 04: Deployments & ReplicaSets** (`k8s/exercises/ex04-deployments-replicasets.md`)