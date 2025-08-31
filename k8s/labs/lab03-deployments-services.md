# Lab 3: Deployments & Services

## Objectives
- Tạo và quản lý Deployments
- Thực hiện rolling updates và rollbacks
- Tạo Services để expose applications
- Hiểu các loại Services (ClusterIP, NodePort, LoadBalancer)

## Deployment Concepts
- Manages ReplicaSets
- Declarative updates
- Rolling updates/rollbacks
- Scaling capabilities

## Hands-on Tasks

### Task 1: Tạo Deployment cơ bản

Tạo `nginx-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

Deploy và explore:
```bash
# Apply deployment
kubectl apply -f nginx-deployment.yaml

# Check deployment status
kubectl get deployments
kubectl describe deployment nginx-deployment

# Check ReplicaSet created by deployment
kubectl get replicasets
kubectl describe replicaset <replicaset-name>

# Check pods created
kubectl get pods -l app=nginx
kubectl get pods --show-labels
```

**Exploration questions:**
1. Deployment tạo bao nhiêu ReplicaSets?
2. Naming convention của pods như thế nào?
3. Labels được gán như thế nào?

### Task 2: Scaling Deployment

```bash
# Scale up to 5 replicas
kubectl scale deployment nginx-deployment --replicas=5

# Check scaling progress
kubectl get pods -l app=nginx -w

# Scale down to 2 replicas  
kubectl scale deployment nginx-deployment --replicas=2

# Alternative: Edit deployment
kubectl edit deployment nginx-deployment
# Change replicas field in editor

# Verify final state
kubectl get deployment nginx-deployment
kubectl get pods -l app=nginx
```

**Tasks to complete:**
1. Scale to 10 replicas, observe pod creation
2. Scale down to 1 replica rapidly
3. Use `kubectl get pods -w` để watch changes real-time

### Task 3: Rolling Updates

Current deployment sử dụng nginx:1.20. Update to nginx:1.21:

```bash
# Method 1: kubectl set image
kubectl set image deployment/nginx-deployment nginx=nginx:1.21

# Watch rollout progress
kubectl rollout status deployment/nginx-deployment

# Check rollout history
kubectl rollout history deployment/nginx-deployment

# Method 2: Edit deployment directly
kubectl edit deployment nginx-deployment
# Change image version in editor

# Check pods during update
kubectl get pods -l app=nginx -o wide
```

Observe rolling update behavior:
```bash
# Watch pod changes during update
kubectl get pods -l app=nginx -w

# Check ReplicaSets during update
kubectl get replicasets

# Describe deployment to see events
kubectl describe deployment nginx-deployment
```

### Task 4: Rollback Deployment

```bash
# Check rollout history
kubectl rollout history deployment/nginx-deployment

# Get details of specific revision
kubectl rollout history deployment/nginx-deployment --revision=1

# Rollback to previous version
kubectl rollout undo deployment/nginx-deployment

# Rollback to specific revision
kubectl rollout undo deployment/nginx-deployment --to-revision=1

# Verify rollback
kubectl describe deployment nginx-deployment | grep Image
kubectl get pods -l app=nginx
```

### Task 5: ClusterIP Service

Tạo `nginx-service-clusterip.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP  # This is default
```

Test ClusterIP service:
```bash
kubectl apply -f nginx-service-clusterip.yaml

# Check service
kubectl get services
kubectl describe service nginx-service

# Get service endpoints
kubectl get endpoints nginx-service

# Test từ within cluster
kubectl run test-pod --image=busybox --rm -it -- /bin/sh
# Inside the pod:
# wget -qO- http://nginx-service
# nslookup nginx-service
# exit
```

### Task 6: NodePort Service

Tạo `nginx-service-nodeport.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
    nodePort: 30080  # Optional: K8s will assign if not specified
  type: NodePort
```

Test NodePort:
```bash
kubectl apply -f nginx-service-nodeport.yaml

# Check service
kubectl get service nginx-nodeport

# Get node IP
kubectl get nodes -o wide

# Test access (adjust IP accordingly)
# For minikube: minikube ip
minikube_ip=$(minikube ip)
curl http://$minikube_ip:30080

# Or use port-forward
kubectl port-forward service/nginx-nodeport 8080:80
curl http://localhost:8080
```

### Task 7: LoadBalancer Service (Cloud environment)

Tạo `nginx-service-lb.yaml`:
```yaml
apiVersion: v1  
kind: Service
metadata:
  name: nginx-loadbalancer
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

**Note**: LoadBalancer chỉ work trong cloud environment (AWS, GCP, Azure)

```bash
kubectl apply -f nginx-service-lb.yaml
kubectl get service nginx-loadbalancer

# In local environment, EXTERNAL-IP sẽ là <pending>
# In cloud, sẽ có real external IP
```

### Task 8: Service Discovery và DNS

```bash
# Create test pod để explore service discovery
kubectl run dns-test --image=busybox --rm -it -- /bin/sh

# Inside pod, test DNS resolution:
nslookup nginx-service
nslookup nginx-service.default.svc.cluster.local

# Test connectivity
wget -qO- http://nginx-service
wget -qO- http://nginx-service.default.svc.cluster.local

# Check environment variables
env | grep NGINX_SERVICE
```

### Task 9: Multi-port Service

Tạo deployment với multiple ports:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-port-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: multi-port-app
  template:
    metadata:
      labels:
        app: multi-port-app  
    spec:
      containers:
      - name: app
        image: nginx:1.20
        ports:
        - containerPort: 80
          name: http
        - containerPort: 443
          name: https
```

Service cho multi-port:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: multi-port-service
spec:
  selector:
    app: multi-port-app
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: http
  - name: https  
    protocol: TCP
    port: 443
    targetPort: https
```

Test multi-port service:
```bash
kubectl apply -f multi-port-deployment.yaml
kubectl apply -f multi-port-service.yaml

kubectl get service multi-port-service
kubectl describe service multi-port-service

# Test both ports
kubectl port-forward service/multi-port-service 8080:80
kubectl port-forward service/multi-port-service 8443:443
```

## Practice Exercises

### Exercise 1: Blue-Green Deployment Pattern
1. Create deployment "app-blue" với nginx:1.20, label `version: blue`
2. Create deployment "app-green" với nginx:1.21, label `version: green`  
3. Create service pointing to blue version
4. Switch service từ blue sang green bằng cách change selector

### Exercise 2: Deployment Strategies
1. Create deployment với strategy `RollingUpdate`
2. Set `maxUnavailable: 1` và `maxSurge: 1`
3. Perform rolling update và observe behavior
4. Try với `Recreate` strategy

### Exercise 3: Service Load Balancing
1. Create deployment với 5 replicas
2. Create ClusterIP service
3. Run multiple requests và verify load balancing
4. Scale down to 2 replicas và test again

### Exercise 4: Troubleshooting
1. Create service với wrong selector
2. Check endpoints: `kubectl get endpoints`
3. Fix selector và verify connectivity
4. Create service với wrong port mapping

## Monitoring Commands

```bash
# Watch deployment rollout
kubectl rollout status deployment/<name> -w

# Check deployment events  
kubectl describe deployment <name>

# Monitor pods during scaling
kubectl get pods -l app=<label> -w

# Check service endpoints
kubectl get endpoints <service-name>

# Test service connectivity
kubectl run test --image=busybox --rm -it -- /bin/sh
```

## Clean Up
```bash
kubectl delete deployment nginx-deployment
kubectl delete deployment multi-port-app  
kubectl delete service nginx-service
kubectl delete service nginx-nodeport
kubectl delete service nginx-loadbalancer
kubectl delete service multi-port-service
```

## Success Criteria
- [x] Tạo và manage được Deployments
- [x] Perform được rolling updates và rollbacks
- [x] Scaling deployments successfully  
- [x] Tạo các loại Services khác nhau
- [x] Hiểu service discovery và DNS
- [x] Debug được connectivity issues

## Next Steps
Lab 4: ConfigMaps, Secrets, và Persistent Volumes