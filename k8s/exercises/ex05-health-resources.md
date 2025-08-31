# Exercise 05: Health Checks & Resource Management

## 🎯 Objective
Implement production-ready health checks và resource management cho portfolio services.

## 📋 Prerequisites
- Completed Exercise 04 (deployments running)
- Basic understanding của probes

## 🧪 Tasks

### Task 1: Liveness Probes - Spring Boot Health Endpoints

Implement liveness probes cho Java services:

1. **Auth Service với HTTP health check:**
```yaml
# File: auth-deployment-health.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service-v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: portfolio
      service: auth
      version: v2
  template:
    metadata:
      labels:
        app: portfolio
        service: auth
        version: v2
    spec:
      containers:
      - name: auth
        image: ____  # Use Spring Boot image or nginx with /health endpoint
        ports:
        - containerPort: ____
        livenessProbe:
          httpGet:
            path: ____           # Spring Boot actuator health endpoint
            port: ____
          initialDelaySeconds: ____  # Spring Boot startup time
          periodSeconds: ____
          timeoutSeconds: ____
          failureThreshold: ____     # How many failures before restart
        resources:
          requests:
            memory: "____"
            cpu: "____"
          limits:
            memory: "____"
            cpu: "____"
```

**Hints:**
- Spring Boot health endpoint: `/actuator/health`
- Java apps need longer startup time: 60-90s
- Check docker-compose.yml cho port numbers

2. **Test liveness probe failure:**
```bash
# Apply deployment with health checks:


# Simulate app failure by making health endpoint return 500:
kubectl exec deployment/auth-service-v2 -- ____  # Command to break health endpoint

# Watch pod restart:
kubectl get pods -l service=auth,version=v2 -w

# What happened after probe failures? ____
# How long did it take to restart? ____
```

### Task 2: Readiness Probes - Traffic Management

Implement readiness probes để control traffic flow:

1. **User Service với separate readiness endpoint:**
```yaml
# File: user-deployment-readiness.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-v2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: portfolio
      service: user
      version: v2
  template:
    metadata:
      labels:
        app: portfolio
        service: user
        version: v2
    spec:
      containers:
      - name: user
        image: ____
        ports:
        - containerPort: ____
        readinessProbe:
          httpGet:
            path: ____       # Readiness endpoint
            port: ____
          initialDelaySeconds: ____
          periodSeconds: ____
          timeoutSeconds: ____
        livenessProbe:
          httpGet:
            path: ____       # Health endpoint  
            port: ____
          initialDelaySeconds: ____
          periodSeconds: ____
```

2. **Test readiness probe behavior:**
```bash
# Apply deployment:


# Check service endpoints before pods are ready:
kubectl get endpoints user-service

# Wait for pods to become ready:
kubectl get pods -l service=user,version=v2 -w

# Check endpoints after pods are ready:
kubectl get endpoints user-service

# How many endpoints before ready? ____
# How many endpoints after ready? ____
```

3. **Simulate readiness failure:**
```bash
# Make one pod's readiness fail:
kubectl exec <user-pod-name> -- ____  # Command to break readiness

# Check service endpoints:
kubectl get endpoints user-service

# Is the failing pod still in endpoints? ____
# Can you still access the service? ____
```

### Task 3: Startup Probes - Slow Starting Applications

Handle slow-starting applications (như database connections):

1. **Email Service với startup probe:**
```yaml
# File: email-deployment-startup.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: email-service-v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: portfolio
      service: email
      version: v2
  template:
    metadata:
      labels:
        app: portfolio  
        service: email
        version: v2
    spec:
      containers:
      - name: email
        image: ____
        ports:
        - containerPort: ____
        startupProbe:
          httpGet:
            path: ____
            port: ____
          initialDelaySeconds: ____
          periodSeconds: ____
          failureThreshold: ____    # 30 failures = 30*5s = 150s max startup
        livenessProbe:
          httpGet:
            path: ____
            port: ____
          initialDelaySeconds: ____  # Short because startup probe handles initial delay
          periodSeconds: ____
        readinessProbe:
          httpGet:
            path: ____
            port: ____
          initialDelaySeconds: ____
          periodSeconds: ____
```

2. **Compare startup times:**
```bash
# Deploy email service with startup probe:


# Deploy another version without startup probe:
# (Edit yaml to remove startupProbe section)

# Compare startup behavior:
kubectl get pods -l service=email -w

# Which version starts faster? ____
# Why is startup probe useful? ____
```

### Task 4: Resource Requests và Limits

Set appropriate resources based on observations:

1. **Frontend with resource constraints:**
```yaml
# File: frontend-deployment-resources.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-v2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: portfolio
      component: frontend
      version: v2
  template:
    metadata:
      labels:
        app: portfolio
        component: frontend  
        version: v2
    spec:
      containers:
      - name: frontend
        image: nginx
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "____Mi"    # Minimum needed
            cpu: "____m"        # Minimum CPU
          limits:
            memory: "____Mi"    # Maximum allowed
            cpu: "____m"        # Maximum CPU
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
```

**Resource planning guide:**
```
Service Type    Base Memory    Base CPU    Limit Multiplier
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend        64Mi           50m         2x
Auth Service    256Mi          100m        2x  
User Service    256Mi          100m        2x
Email Service   128Mi          50m         2x
Database        512Mi          200m        1.5x
```

2. **Test resource limits:**
```bash
# Apply frontend with tight limits:


# Create memory stress test:
kubectl run memory-test --image=progrium/stress --rm -it -- --vm 1 --vm-bytes 150M --timeout 60s

# What happens when memory limit is exceeded? ____

# Check events:
kubectl describe pod memory-test

# Error message: ____
```

### Task 5: Quality of Service Classes

Create deployments với different QoS classes:

1. **Guaranteed QoS (requests = limits):**
```yaml
# File: guaranteed-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guaranteed-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qos-test
      type: guaranteed
  template:
    metadata:
      labels:
        app: qos-test
        type: guaranteed
    spec:
      containers:
      - name: app
        image: nginx
        resources:
          requests:
            memory: "____Mi"
            cpu: "____m"
          limits:
            memory: "____Mi"    # Same as requests
            cpu: "____m"        # Same as requests
```

2. **Burstable QoS (requests < limits):**
```yaml  
# File: burstable-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: burstable-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qos-test
      type: burstable
  template:
    metadata:
      labels:
        app: qos-test
        type: burstable
    spec:
      containers:
      - name: app
        image: nginx
        resources:
          requests:
            memory: "____Mi"
            cpu: "____m"  
          limits:
            memory: "____Mi"    # Higher than requests
            cpu: "____m"        # Higher than requests
```

3. **BestEffort QoS (no resources):**
```yaml
# File: besteffort-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: besteffort-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qos-test
      type: besteffort
  template:
    metadata:
      labels:
        app: qos-test
        type: besteffort
    spec:
      containers:
      - name: app
        image: nginx
        # No resources section
```

4. **Check QoS classes:**
```bash
# Apply all QoS deployments:


# Check QoS class for each pod:
kubectl get pods -l app=qos-test -o custom-columns="NAME:.metadata.name,QOS:.status.qosClass"

# Results:
# Guaranteed pod QoS: ____
# Burstable pod QoS: ____
# BestEffort pod QoS: ____
```

### Task 6: Horizontal Pod Autoscaler

Set up autoscaling cho portfolio services:

1. **Enable metrics server** (if not already):
```bash
# Check if metrics server is running:
kubectl get deployment metrics-server -n kube-system

# If not available:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait for metrics to be available:
kubectl top nodes
kubectl top pods
```

2. **Create HPA cho auth service:**
```yaml
# File: auth-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ____
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ____
  minReplicas: ____
  maxReplicas: ____
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ____  # Scale when CPU > this %
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: ____  # Scale when memory > this %
```

3. **Test autoscaling:**
```bash
# Apply HPA:


# Generate load:
kubectl run load-generator --image=busybox --rm -it -- /bin/sh
# Inside pod:
/ # while true; do wget -q -O- http://auth-service; done

# Watch scaling in another terminal:
kubectl get hpa -w
kubectl get pods -l service=auth -w

# Did autoscaling trigger? ____
# How many pods were created? ____
```

### Task 7: Resource Monitoring

Monitor resource usage across portfolio services:

1. **Check resource usage:**
```bash
# Current pod resource usage:


# Node resource usage:


# Resource requests vs limits vs usage:
kubectl describe nodes

# Fill in observed values:
Service         CPU Request    CPU Usage    Memory Request    Memory Usage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth            ____m         ____m        ____Mi            ____Mi
User            ____m         ____m        ____Mi            ____Mi  
Email           ____m         ____m        ____Mi            ____Mi
Frontend        ____m         ____m        ____Mi            ____Mi
```

2. **Resource optimization:**
```bash
# Based on observations, adjust resource requests:
kubectl patch deployment auth-service-v2 -p '{"spec":{"template":{"spec":{"containers":[{"name":"auth","resources":{"requests":{"cpu":"____m","memory":"____Mi"},"limits":{"cpu":"____m","memory":"____Mi"}}}]}}}}'

# Monitor after changes:
kubectl top pods -l service=auth
```

### Task 8: Health Check Troubleshooting

Practice debugging health check issues:

1. **Probe timeout issues:**
```yaml
# Create deployment with unrealistic probe timeouts:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: timeout-test
spec:
  replicas: 1
  selector:
    matchLabels:
      app: timeout-test
  template:
    metadata:
      labels:
        app: timeout-test
    spec:
      containers:
      - name: app
        image: nginx
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 1    # Very short timeout
          failureThreshold: 1  # Fail after 1 attempt
```

2. **Debug probe failures:**
```bash
# Apply problematic deployment:


# Watch pod behavior:
kubectl get pods -l app=timeout-test -w

# Check events:
kubectl describe pod <timeout-test-pod>

# What's happening? ____
# How would you fix it? ____

# Fix the deployment:
# kubectl edit deployment timeout-test
# Change timeoutSeconds to: ____
# Change failureThreshold to: ____
```

## 🎯 Success Criteria

- [ ] Implemented liveness probes cho all services
- [ ] Implemented readiness probes cho traffic management  
- [ ] Used startup probes cho slow-starting services
- [ ] Set appropriate resource requests/limits
- [ ] Created different QoS classes
- [ ] Setup autoscaling với HPA
- [ ] Monitored resource usage
- [ ] Successfully debugged health check issues

## 📝 Health Check Summary

Document your health check configuration:

```
Service    Liveness Path    Readiness Path    Startup Time    QoS Class
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth       ____            ____             ____s           ____
User       ____            ____             ____s           ____
Email      ____            ____             ____s           ____
Frontend   ____            ____             ____s           ____
```

## 📝 Resource Optimization Results

```
Service     Before (Req/Lim)         After (Req/Lim)         Improvement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Auth        ____Mi/____Mi           ____Mi/____Mi           ____%
User        ____Mi/____Mi           ____Mi/____Mi           ____%
Email       ____Mi/____Mi           ____Mi/____Mi           ____%
Frontend    ____Mi/____Mi           ____Mi/____Mi           ____%
```

## 🚀 Next Step
Proceed to **Exercise 06: Storage & StatefulSets** (`k8s/exercises/ex06-storage-statefulsets.md`)