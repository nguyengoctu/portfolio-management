# Exercise 01: Architecture Exploration

## 🎯 Objective
Khám phá kiến trúc Kubernetes cluster và hiểu cách các components hoạt động với portfolio project.

## 📋 Prerequisites  
- Đã setup minikube hoặc kind cluster
- kubectl đã configure

## 🧪 Tasks

### Task 1: Explore Control Plane Components

**Hint**: Sử dụng `kubectl get pods -n kube-system` để xem system pods

1. **List all system pods:**
```bash
# Your command here:


# Expected output: Pods như etcd, kube-apiserver, kube-scheduler, etc.
```

2. **Identify the API Server pod:**
```bash
# Command to describe API server pod:


# What port is API server running on? ____
# What image is being used? ____
```

3. **Check etcd database:**
```bash
# Command to describe etcd pod:


# Where is etcd data stored? (check volumeMounts): ____
```

### Task 2: Node Architecture Analysis

**Hint**: `kubectl describe nodes` và `kubectl get nodes -o wide`

1. **Get node information:**
```bash
# Command to get detailed node info:


# How many nodes do you have? ____
# What's the node's internal IP? ____
# What container runtime is used? ____
```

2. **Find kubelet and kube-proxy:**
```bash
# These run as system services, not pods
# On minikube, check with: minikube ssh -> ps aux | grep kubelet


# What's the kubelet configuration directory? ____
```

### Task 3: Understanding Pod Scheduling

Create a simple pod và trace the scheduling process:

1. **Create test pod:**
```yaml
# File: test-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: scheduling-test
spec:
  containers:
  - name: nginx
    image: nginx
```

2. **Apply and watch scheduling:**
```bash
# Apply the pod:


# Watch pod events:


# What happened step by step?
# 1. ____
# 2. ____  
# 3. ____
# 4. ____
```

### Task 4: Portfolio Services Architecture Planning

Based on current Docker Compose setup, plan K8s architecture:

1. **Analyze current services:**
```bash
# List current services in Docker Compose:
cd /path/to/portfolio
grep "services:" -A 20 docker-compose.yml
```

**Current services found:**
- Frontend: ____
- Auth-service: ____
- User-service: ____
- Email-service: ____
- Database: ____

2. **Plan K8s mapping:**
```
Docker Compose Service → K8s Resource Type → Reasoning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend        → ______________ → ________________
Auth-service    → ______________ → ________________  
User-service    → ______________ → ________________
Email-service   → ______________ → ________________
MySQL Database  → ______________ → ________________
Flyway Migration → _____________ → ________________
```

3. **Network planning:**
```
Service Communication Matrix:
Frontend → Auth-service: _______ (port: ____)
Frontend → User-service: _______ (port: ____)
Auth-service → Database: _______ (port: ____)
User-service → Database: _______ (port: ____)
Auth-service → Email-service: _______ (port: ____)
```

### Task 5: Resource Planning

Based on current resource usage, estimate K8s resources:

1. **Check current Docker stats:**
```bash
# Run current setup:
docker compose up -d

# Check resource usage:
docker stats

# Fill in observed values:
Service         CPU%    MEM Usage    MEM Limit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend        ____    ________     ________
Auth-service    ____    ________     ________
User-service    ____    ________     ________
Email-service   ____    ________     ________
MySQL           ____    ________     ________
```

2. **Plan K8s resource requests/limits:**
```yaml
# Example for auth-service:
resources:
  requests:
    memory: "____Mi"  # Based on observed usage
    cpu: "____m"      # Based on observed usage
  limits:
    memory: "____Mi"  # 1.5-2x of requests
    cpu: "____m"      # 1.5-2x of requests
```

### Task 6: Troubleshooting Practice

Intentionally break something và practice debugging:

1. **Create broken pod:**
```yaml
# File: broken-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: broken-test
spec:
  containers:
  - name: broken
    image: nonexistent:latest
```

2. **Debug the issue:**
```bash
# Apply broken pod:


# Check status:


# Get detailed information:


# Check events:


# What's the issue? ____
# How would you fix it? ____
```

## 🎯 Success Criteria

- [ ] Identified all control plane components
- [ ] Understood node architecture
- [ ] Traced pod scheduling process  
- [ ] Planned portfolio services mapping
- [ ] Estimated resource requirements
- [ ] Successfully debugged broken pod

## 📝 Reflection Questions

1. **What happens if etcd goes down?**
   Answer: ____

2. **Why does K8s use a scheduler instead of random assignment?**
   Answer: ____

3. **How would you handle database persistence in K8s?**
   Answer: ____

4. **What's the difference between requests and limits?**
   Answer: ____

## 🚀 Next Step
After completing this exercise, proceed to **Exercise 02: Pod Fundamentals** (`k8s/exercises/ex02-pod-fundamentals.md`)