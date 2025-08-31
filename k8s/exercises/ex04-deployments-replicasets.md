# Exercise 04: Deployments & ReplicaSets

## 🎯 Objective
Convert portfolio service pods thành production-ready Deployments với scaling và rolling updates.

## 📋 Prerequisites
- Completed Exercise 03 (services created)
- Portfolio service pods running

## 🧪 Tasks

### Task 1: Auth Service Deployment

Convert auth-service pod thành Deployment:

1. **Create auth-service deployment:**
```yaml
# File: auth-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ____
  namespace: ____
spec:
  replicas: ____    # Start with 2 replicas
  selector:
    matchLabels:
      app: ____
      service: ____
  template:
    metadata:
      labels:
        app: ____
        service: ____
        version: "____"  # Add version label
    spec:
      containers:
      - name: ____
        image: ____      # Use nginx for now
        ports:
        - containerPort: ____
        env:
        - name: SERVER_PORT
          value: "____"
        resources:
          requests:
            memory: "____"    # Based on Exercise 01 observations  
            cpu: "____"
          limits:
            memory: "____"
            cpu: "____"
```

2. **Apply và observe ReplicaSet creation:**
```bash
# Apply deployment:


# Check deployment status:


# Check ReplicaSet created:


# What's the ReplicaSet name? ____
# How is it named? ____

# Check pods created:


# How are pods named? ____
```

3. **Test self-healing:**
```bash
# Delete one pod:
kubectl delete pod <auth-pod-name>

# Watch what happens:
kubectl get pods -l app=portfolio,service=auth -w

# What happened? ____
# How long did it take to recreate? ____
```

### Task 2: Scaling Operations

Practice scaling deployments:

1. **Manual scaling:**
```bash
# Scale auth-service to 5 replicas:


# Watch scaling process:
kubectl get pods -l service=auth -w

# Scale down to 3 replicas:


# How many pods are terminated? ____
```

2. **Declarative scaling:**
```bash
# Edit deployment file to change replicas to 4:
# Then apply:


# Check current replica count:


# Which method do you prefer and why?
# Answer: ____
```

### Task 3: Rolling Updates

Practice zero-downtime updates:

1. **Update image version:**
```bash
# Current image version:
kubectl get deployment auth-service -o jsonpath='{.spec.template.spec.containers[0].image}'

# Update to new version:
kubectl set image deployment/auth-service ____=nginx:1.21

# Watch rollout:
kubectl rollout status deployment/____

# Monitor pods during update:
kubectl get pods -l service=auth -w
```

2. **Observe rolling update process:**
```bash
# Check rollout history:


# What's the revision number? ____

# Check ReplicaSets during update:


# How many ReplicaSets exist? ____
# Why? ____
```

3. **Test rollback:**
```bash
# Rollback to previous version:


# Check rollback status:


# Verify image version:
kubectl get deployment auth-service -o jsonpath='{.spec.template.spec.containers[0].image}'

# Current image: ____
```

### Task 4: User Service Deployment với ConfigMap

Create Deployment sử dụng ConfigMap từ Exercise 02:

1. **Create user-service deployment:**
```yaml
# File: user-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ____
spec:
  replicas: ____
  selector:
    matchLabels:
      app: ____
      service: ____
  template:
    metadata:
      labels:
        app: ____
        service: ____
        version: "v1.0"
    spec:
      containers:
      - name: ____
        image: ____
        ports:
        - containerPort: ____
        envFrom:
        - configMapRef:
            name: ____  # Reference ConfigMap from Ex02
        resources:
          requests:
            memory: "____"
            cpu: "____"
          limits:
            memory: "____"  
            cpu: "____"
```

2. **Test configuration updates:**
```bash
# Apply deployment:


# Update ConfigMap:
kubectl patch configmap ____ -p '{"data":{"NEW_CONFIG":"new-value"}}'

# Restart deployment to pick up changes:
kubectl rollout restart deployment/____

# Verify new config in pod:
kubectl exec deployment/____ -- env | grep NEW_CONFIG

# Result: ____
```

### Task 5: Database StatefulSet Preparation

Convert MySQL pod thành Deployment (later we'll use StatefulSet):

1. **Create MySQL deployment:**
```yaml
# File: mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ____
spec:
  replicas: ____    # Database should be 1 replica
  selector:
    matchLabels:
      app: ____
      service: ____
  template:
    metadata:
      labels:
        app: ____
        service: ____
    spec:
      containers:
      - name: ____
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ____  # Use secret from Exercise 02
              key: ____
        # Add other env vars from secret
        ports:
        - containerPort: ____
        resources:
          requests:
            memory: "____"    # MySQL needs more memory
            cpu: "____"
          limits:
            memory: "____"
            cpu: "____"
```

**Important note about database replicas:**
```bash
# Apply with 1 replica:


# Try scaling to 2 replicas:
kubectl scale deployment mysql --replicas=2

# What problems might this cause?
# Answer: ____
```

### Task 6: Complete Portfolio Deployment

Create deployments for all services:

1. **Email service deployment:**
```yaml
# File: email-deployment.yaml
# Fill in based on previous patterns:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ____
spec:
  replicas: ____
  # Complete the rest...
```

2. **Frontend deployment:**
```yaml
# File: frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ____
spec:
  replicas: ____
  selector:
    matchLabels:
      app: ____
      component: ____
  template:
    metadata:
      labels:
        app: ____
        component: ____
    spec:
      containers:
      - name: ____
        image: nginx
        ports:
        - containerPort: ____
        # Add env vars for API URLs (from ConfigMap):
        env:
        - name: AUTH_SERVICE_URL
          value: "http://____:____"
        - name: USER_SERVICE_URL  
          value: "http://____:____"
```

3. **Deploy all services:**
```bash
# Apply all deployments:
kubectl apply -f auth-deployment.yaml
kubectl apply -f user-deployment.yaml
kubectl apply -f email-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f mysql-deployment.yaml

# Check all deployments:


# Check all pods:


# Total pods running: ____
```

### Task 7: Deployment Strategies

Experiment với different deployment strategies:

1. **RollingUpdate strategy (default):**
```yaml
# Add to deployment spec:
spec:
  strategy:
    type: ____
    rollingUpdate:
      maxSurge: ____      # Max pods above desired count
      maxUnavailable: ____ # Max pods unavailable during update
```

2. **Recreate strategy:**
```yaml
# Edit one deployment to use Recreate:
spec:
  strategy:
    type: ____
```

**Compare strategies:**
```bash
# Update deployment with RollingUpdate:
kubectl set image deployment/auth-service auth=nginx:1.20
kubectl rollout status deployment/auth-service

# Update deployment with Recreate:  
kubectl set image deployment/____ ____=nginx:1.21
kubectl rollout status deployment/____

# Which strategy caused downtime? ____
# When would you use each strategy? ____
```

### Task 8: Deployment Troubleshooting

Practice debugging deployment issues:

1. **Deployment with wrong image:**
```yaml
# File: broken-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: broken-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: broken
  template:
    metadata:
      labels:
        app: broken
    spec:
      containers:
      - name: app
        image: nonexistent:latest
```

2. **Debug the deployment:**
```bash
# Apply broken deployment:


# Check deployment status:


# Check ReplicaSet:


# Check pods:


# What's the issue? ____

# Check events:


# Fix the deployment:
# kubectl edit deployment broken-deploy
# Change image to: ____
```

3. **Resource constraint issues:**
```bash
# Edit deployment to use very high resource requests:
kubectl patch deployment auth-service -p '{"spec":{"template":{"spec":{"containers":[{"name":"auth","resources":{"requests":{"cpu":"10","memory":"10Gi"}}}]}}}}'

# What happens? ____
# Why can't it schedule? ____

# Fix by reducing resources:
kubectl patch deployment auth-service -p '{"spec":{"template":{"spec":{"containers":[{"name":"auth","resources":{"requests":{"cpu":"100m","memory":"128Mi"}}}]}}}}'
```

### Task 9: Service Integration Test

Test complete portfolio stack:

1. **Verify all services are accessible:**
```bash
# Test service connectivity:
kubectl run test-client --image=busybox --rm -it -- /bin/sh

# Inside test pod:
/ # wget -qO- http://frontend-service
/ # wget -qO- http://auth-service  
/ # wget -qO- http://user-service
/ # wget -qO- http://email-service

# Results:
# Frontend: ____
# Auth: ____
# User: ____
# Email: ____
```

2. **Load test với multiple replicas:**
```bash
# Scale up all services:
kubectl scale deployment auth-service --replicas=____
kubectl scale deployment user-service --replicas=____
kubectl scale deployment email-service --replicas=____

# Run load test:
kubectl run load-test --image=busybox --rm -it -- /bin/sh
/ # for i in {1..50}; do wget -qO- http://auth-service; done

# Are requests load balanced? ____
```

## 🎯 Success Criteria

- [ ] Converted pods to Deployments
- [ ] Tested scaling operations
- [ ] Performed rolling updates and rollbacks
- [ ] Created deployments với ConfigMaps/Secrets
- [ ] Tested different deployment strategies
- [ ] Successfully debugged deployment issues
- [ ] Integrated all portfolio services

## 📝 Deployment Summary

Fill in your deployment configuration:

```
Service        Replicas    Image         Strategy      Resources
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth           ____        ____         ____          ____
User           ____        ____         ____          ____
Email          ____        ____         ____          ____
Frontend       ____        ____         ____          ____
MySQL          ____        ____         ____          ____
```

## 📝 Rolling Update Observations

1. **RollingUpdate vs Recreate:**
   - RollingUpdate pros: ____
   - RollingUpdate cons: ____
   - Recreate pros: ____
   - Recreate cons: ____

2. **Best practices learned:**
   - Always set ____
   - Use ____ for configuration
   - Test ____ before production
   - Monitor ____ during updates

## 🚀 Next Step
Proceed to **Exercise 05: Health Checks & Resource Management** (`k8s/exercises/ex05-health-resources.md`)