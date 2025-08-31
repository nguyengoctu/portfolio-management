# Network Lab 02: DNS & Service Discovery

## 🎯 Objective
Deep dive into DNS resolution và service discovery trong Docker, Kubernetes, và production environments.

## 📋 Prerequisites
- Completed Lab 01
- Portfolio services running
- Access to Kubernetes cluster (minikube/kind)

## 🧪 Tasks

### Task 1: Docker DNS Deep Dive

Understand Docker's internal DNS mechanism:

1. **Docker DNS server discovery:**
```bash
# Check Docker daemon DNS configuration:
docker system info | grep -A 5 "DNS"

# Enter auth-service container:
docker exec -it auth-service /bin/bash

# Check container's DNS configuration:
cat /etc/resolv.conf

# What DNS server is configured? ____
# What domain search paths exist? ____

# Test DNS server directly:
nslookup user-service <dns-server-ip>
```

2. **DNS resolution testing:**
```bash
# Still trong auth-service container:

# Test different resolution methods:
nslookup user-service
dig user-service
host user-service

# Results comparison:
nslookup result: ____
dig result: ____
host result: ____

# Test FQDN resolution:
nslookup user-service.user-portfolio-management-master_portfolio-management-network
```

3. **Custom network DNS testing:**
```bash
# Exit container and create custom network:
docker network create --driver bridge custom-dns-network

# Run services trong custom network:
docker run -d --name dns-test-1 --network custom-dns-network nginx
docker run -d --name dns-test-2 --network custom-dns-network nginx

# Test DNS resolution between them:
docker exec dns-test-1 nslookup dns-test-2
docker exec dns-test-1 ping -c 3 dns-test-2

# Does DNS work trong custom network? ____
```

### Task 2: Kubernetes DNS Architecture

Setup và explore K8s DNS:

1. **Deploy portfolio services trong K8s:**
```yaml
# File: k8s-portfolio-test.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portfolio-dns-test
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: portfolio-dns-test
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth
  template:
    metadata:
      labels:
        app: auth
    spec:
      containers:
      - name: auth
        image: nginx  # Placeholder
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: portfolio-dns-test
spec:
  selector:
    app: auth
  ports:
  - port: 8082
    targetPort: 80
---
# Add similar deployment và service for user-service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: portfolio-dns-test
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user
  template:
    metadata:
      labels:
        app: user
    spec:
      containers:
      - name: user
        image: nginx  # Placeholder
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: portfolio-dns-test
spec:
  selector:
    app: user
  ports:
  - port: 8083
    targetPort: 80
```

```bash
# Apply K8s manifests:
kubectl apply -f k8s-portfolio-test.yaml

# Check deployments:
kubectl get pods -n portfolio-dns-test

# Check services:
kubectl get services -n portfolio-dns-test

# Services created:
# auth-service: ____
# user-service: ____
```

2. **K8s DNS resolution testing:**
```bash
# Get into a pod:
kubectl exec -it <auth-pod-name> -n portfolio-dns-test -- /bin/bash

# Test different DNS resolution patterns:

# Short name (same namespace):
nslookup user-service
dig user-service

# FQDN resolution:
nslookup user-service.portfolio-dns-test.svc.cluster.local

# Cross-namespace resolution:
nslookup kube-dns.kube-system.svc.cluster.local

# Results:
Short name resolution: ____
FQDN resolution: ____
Cross-namespace resolution: ____
```

3. **K8s DNS troubleshooting:**
```bash
# Check CoreDNS pods:
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Are CoreDNS pods running? ____

# Check CoreDNS configuration:
kubectl get configmap coredns -n kube-system -o yaml

# Test DNS from debug pod:
kubectl run dns-debug --image=busybox:1.28 --rm -it --restart=Never -- nslookup kubernetes.default

# DNS debug results: ____
```

### Task 3: Service Discovery Patterns

Implement different service discovery patterns:

1. **Environment Variables Discovery:**
```bash
# Check service environment variables trong K8s pod:
kubectl exec <auth-pod-name> -n portfolio-dns-test -- env | grep SERVICE

# What service variables are available?
Service environment variables:
____
____
____

# Create pod using service env vars:
kubectl run env-test --image=busybox --rm -it -- sh
# Inside pod:
/ # echo $USER_SERVICE_SERVICE_HOST
/ # echo $USER_SERVICE_SERVICE_PORT
```

2. **DNS-based Discovery:**
```yaml
# File: dns-discovery-test.yaml
apiVersion: v1
kind: Pod
metadata:
  name: dns-discovery-client
  namespace: portfolio-dns-test
spec:
  containers:
  - name: client
    image: busybox:1.28
    command: ['sleep', '3600']
    env:
    - name: AUTH_SERVICE_URL
      value: "http://auth-service.portfolio-dns-test.svc.cluster.local:8082"
    - name: USER_SERVICE_URL  
      value: "http://user-service:8083"  # Short name
```

```bash
# Apply và test:
kubectl apply -f dns-discovery-test.yaml

# Test service URLs:
kubectl exec dns-discovery-client -n portfolio-dns-test -- wget -qO- $AUTH_SERVICE_URL
kubectl exec dns-discovery-client -n portfolio-dns-test -- wget -qO- $USER_SERVICE_URL

# Which URL format works better? ____
```

3. **Headless Service Discovery:**
```yaml
# File: headless-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-headless
  namespace: portfolio-dns-test
spec:
  clusterIP: None  # Headless service
  selector:
    app: auth
  ports:
  - port: 8082
    targetPort: 80
```

```bash
# Apply headless service:
kubectl apply -f headless-service.yaml

# Test individual pod discovery:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup auth-headless

# How many IPs returned? ____
# Are these individual pod IPs? ____
```

### Task 4: External DNS Integration

Setup external DNS resolution:

1. **External service DNS:**
```yaml
# File: external-dns.yaml
apiVersion: v1
kind: Service
metadata:
  name: external-api
  namespace: portfolio-dns-test
spec:
  type: ExternalName
  externalName: jsonplaceholder.typicode.com
  ports:
  - port: 80
```

```bash
# Apply external service:
kubectl apply -f external-dns.yaml

# Test external DNS resolution:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup external-api

# What IP is resolved? ____

# Test external connectivity:
kubectl exec dns-discovery-client -n portfolio-dns-test -- wget -qO- http://external-api/posts/1

# External API response: ____
```

2. **Custom DNS configuration:**
```yaml
# File: custom-dns-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: custom-dns-pod
  namespace: portfolio-dns-test
spec:
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
      - 8.8.8.8
      - 1.1.1.1
    searches:
      - portfolio-dns-test.svc.cluster.local
    options:
      - name: ndots
        value: "2"
  containers:
  - name: test
    image: busybox:1.28
    command: ['sleep', '3600']
```

```bash
# Apply custom DNS pod:
kubectl apply -f custom-dns-pod.yaml

# Check DNS configuration:
kubectl exec custom-dns-pod -n portfolio-dns-test -- cat /etc/resolv.conf

# Test resolution with custom DNS:
kubectl exec custom-dns-pod -n portfolio-dns-test -- nslookup google.com

# Custom DNS results: ____
```

### Task 5: DNS Performance & Caching

Test DNS performance và caching behavior:

1. **DNS response time testing:**
```bash
# Test DNS resolution time:
kubectl exec dns-discovery-client -n portfolio-dns-test -- time nslookup user-service

# First lookup time: ____

# Test again immediately:
kubectl exec dns-discovery-client -n portfolio-dns-test -- time nslookup user-service

# Second lookup time: ____
# Is there caching happening? ____
```

2. **DNS cache analysis:**
```bash
# Check nscd cache (if available):
kubectl exec dns-discovery-client -n portfolio-dns-test -- nscd -g

# Test with different domains:
kubectl exec dns-discovery-client -n portfolio-dns-test -- time nslookup google.com
kubectl exec dns-discovery-client -n portfolio-dns-test -- time nslookup github.com
kubectl exec dns-discovery-client -n portfolio-dns-test -- time nslookup stackoverflow.com

# External DNS times:
google.com: ____
github.com: ____  
stackoverflow.com: ____
```

### Task 6: DNS Troubleshooting Scenarios

Practice common DNS issues:

1. **Scenario A: Service Not Found**
```bash
# Try to resolve non-existent service:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup nonexistent-service

# Error message: ____

# Debug steps:
kubectl exec dns-discovery-client -n portfolio-dns-test -- cat /etc/resolv.conf
kubectl get services -n portfolio-dns-test

# How to debug DNS issues?
Debug steps: ____
```

2. **Scenario B: Cross-namespace Access**
```bash
# Create service trong different namespace:
kubectl create namespace other-ns
kubectl run test-app --image=nginx -n other-ns
kubectl expose pod test-app --port=80 -n other-ns

# Try to access from portfolio-dns-test namespace:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup test-app

# Does it work? ____

# Try with FQDN:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup test-app.other-ns.svc.cluster.local

# FQDN works? ____
```

3. **Scenario C: CoreDNS Issues**
```bash
# Simulate CoreDNS issue by scaling down:
kubectl scale deployment coredns --replicas=0 -n kube-system

# Wait a moment, then test DNS:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup user-service

# Error when CoreDNS down: ____

# Restore CoreDNS:
kubectl scale deployment coredns --replicas=2 -n kube-system

# Wait for CoreDNS pods to be ready:
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Test DNS again:
kubectl exec dns-discovery-client -n portfolio-dns-test -- nslookup user-service

# Works after restore? ____
```

### Task 7: Production DNS Best Practices

Implement production DNS patterns:

1. **DNS policy configuration:**
```yaml
# File: dns-policy-examples.yaml
# Pod with Default DNS policy
apiVersion: v1
kind: Pod
metadata:
  name: dns-default
  namespace: portfolio-dns-test
spec:
  dnsPolicy: Default  # Use node's DNS
  containers:
  - name: test
    image: busybox:1.28
    command: ['sleep', '3600']
---
# Pod with ClusterFirst DNS policy
apiVersion: v1
kind: Pod
metadata:
  name: dns-clusterfirst
  namespace: portfolio-dns-test  
spec:
  dnsPolicy: ClusterFirst  # Use cluster DNS first
  containers:
  - name: test
    image: busybox:1.28
    command: ['sleep', '3600']
```

```bash
# Apply DNS policy examples:
kubectl apply -f dns-policy-examples.yaml

# Compare DNS configurations:
kubectl exec dns-default -n portfolio-dns-test -- cat /etc/resolv.conf
kubectl exec dns-clusterfirst -n portfolio-dns-test -- cat /etc/resolv.conf

# What differences do you see?
Default policy DNS: ____
ClusterFirst policy DNS: ____
```

2. **Health check endpoints:**
```bash
# Check CoreDNS health:
kubectl exec -n kube-system <coredns-pod-name> -- wget -qO- http://localhost:8080/health

# CoreDNS health status: ____

# Check CoreDNS metrics:
kubectl exec -n kube-system <coredns-pod-name> -- wget -qO- http://localhost:9153/metrics

# Key metrics to monitor: ____
```

### Task 8: Service Mesh DNS

Explore service mesh DNS patterns (if Istio available):

1. **Istio DNS integration:**
```bash
# If Istio is available:
kubectl label namespace portfolio-dns-test istio-injection=enabled

# Redeploy pods to get sidecar:
kubectl rollout restart deployment auth-service -n portfolio-dns-test

# Check DNS với Istio sidecar:
kubectl exec <auth-pod-name> -c auth -n portfolio-dns-test -- nslookup user-service

# Istio DNS behavior: ____
```

## 🎯 Success Criteria

- [ ] Understood Docker DNS mechanism
- [ ] Mastered K8s DNS patterns (short name, FQDN, cross-namespace)
- [ ] Implemented different service discovery patterns
- [ ] Configured external DNS integration
- [ ] Analyzed DNS performance và caching
- [ ] Troubleshot common DNS issues
- [ ] Applied production DNS best practices

## 📝 DNS Resolution Summary

Document your DNS resolution findings:

```
Environment       Resolution Method         Result          Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Docker            service-name              ____            ____ms
Docker            FQDN                      ____            ____ms
K8s               short-name                ____            ____ms  
K8s               FQDN                      ____            ____ms
K8s               cross-namespace           ____            ____ms
External          domain.com                ____            ____ms
```

## 📝 Service Discovery Patterns

```
Pattern                   Pros                    Cons                Use Case
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment Variables     ____                   ____                ____
DNS Short Names           ____                   ____                ____  
DNS FQDN                  ____                   ____                ____
Headless Services         ____                   ____                ____
External Services         ____                   ____                ____
```

## 📝 Troubleshooting Checklist

Common DNS issues và solutions:

1. **Service not resolving:**
   - Check: ____
   - Debug: ____
   - Solution: ____

2. **Cross-namespace access fails:**
   - Check: ____
   - Debug: ____
   - Solution: ____

3. **External DNS slow:**
   - Check: ____
   - Debug: ____
   - Solution: ____

## 🚀 Next Lab
Proceed to **Lab 03: Load Balancing & Traffic Management** (`networking/labs/lab03-load-balancing.md`)