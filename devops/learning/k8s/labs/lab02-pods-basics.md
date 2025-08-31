# Lab 2: Pod Basics

## Objectives
- Tạo và quản lý Pods
- Hiểu Pod lifecycle
- Debug và troubleshoot Pods
- Thực hành với Pod manifest files

## Pod Concepts Review
- Pod là atomic unit của K8s
- Chứa 1+ containers
- Chia sẻ network và storage
- Ephemeral (temporary)

## Hands-on Tasks

### Task 1: Tạo Pod đơn giản với kubectl run

```bash
# Tạo nginx pod
kubectl run my-nginx --image=nginx:1.20

# Xem pods
kubectl get pods
kubectl get pods -o wide

# Mô tả pod details
kubectl describe pod my-nginx

# Xem logs
kubectl logs my-nginx

# Clean up
kubectl delete pod my-nginx
```

**Questions to explore:**
1. Pod ở trạng thái nào sau khi tạo?
2. IP address của Pod là gì?
3. Pod chạy trên node nào?

### Task 2: Tạo Pod với YAML manifest

Tạo file `nginx-pod.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    environment: dev
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

Apply và test:
```bash
# Apply manifest
kubectl apply -f nginx-pod.yaml

# Verify
kubectl get pod nginx-pod
kubectl describe pod nginx-pod

# Port forward để test
kubectl port-forward nginx-pod 8080:80

# Test trong terminal khác
curl http://localhost:8080
```

**Tasks:**
1. Modify memory limit to 256Mi và apply lại
2. Add thêm label `version: "1.0"`
3. Check resource usage: `kubectl top pod nginx-pod` (nếu metrics server available)

### Task 3: Multi-container Pod

Tạo `multi-container-pod.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-container-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.20
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-volume
      mountPath: /usr/share/nginx/html
  - name: content-generator
    image: busybox
    command: ["/bin/sh"]
    args: ["-c", "while true; do echo 'Hello from sidecar at' $(date) > /shared/index.html; sleep 30; done"]
    volumeMounts:
    - name: shared-volume
      mountPath: /shared
  volumes:
  - name: shared-volume
    emptyDir: {}
```

Test multi-container:
```bash
kubectl apply -f multi-container-pod.yaml

# Check both containers
kubectl get pod multi-container-pod
kubectl describe pod multi-container-pod

# Logs from specific container  
kubectl logs multi-container-pod -c nginx
kubectl logs multi-container-pod -c content-generator

# Port forward và test
kubectl port-forward multi-container-pod 8081:80
curl http://localhost:8081
```

**Exploration tasks:**
1. Exec vào nginx container: `kubectl exec -it multi-container-pod -c nginx -- /bin/bash`
2. Check shared volume content: `cat /usr/share/nginx/html/index.html`
3. Exec vào busybox container và explore shared volume

### Task 4: Pod với ConfigMap và Secret

Tạo ConfigMap:
```bash
kubectl create configmap app-config --from-literal=DATABASE_URL=mysql://localhost:3306/mydb
```

Tạo Secret:
```bash
kubectl create secret generic app-secret --from-literal=DATABASE_PASSWORD=mysecretpassword
```

Tạo `pod-with-config.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: busybox
    command: ["/bin/sh"]  
    args: ["-c", "env | grep DATABASE; sleep 3600"]
    env:
    - name: DATABASE_URL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: DATABASE_URL
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: DATABASE_PASSWORD
```

Test configuration:
```bash
kubectl apply -f pod-with-config.yaml
kubectl logs app-pod
kubectl exec app-pod -- env | grep DATABASE
```

### Task 5: Health Checks (Probes)

Tạo `pod-with-probes.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: probe-pod
spec:
  containers:
  - name: app
    image: nginx:1.20
    ports:
    - containerPort: 80
    livenessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /
        port: 80  
      initialDelaySeconds: 5
      periodSeconds: 5
```

Observe probe behavior:
```bash
kubectl apply -f pod-with-probes.yaml
kubectl describe pod probe-pod
kubectl get pod probe-pod -w  # Watch pod status changes
```

**Experiments:**
1. Modify liveness probe path to `/nonexistent` và observe
2. Increase initialDelaySeconds và watch startup
3. Check probe logs in describe output

### Task 6: Pod Debugging và Troubleshooting

Tạo một broken pod:
```yaml
apiVersion: v1
kind: Pod  
metadata:
  name: broken-pod
spec:
  containers:
  - name: app
    image: nginx:nonexistent-tag
    ports:
    - containerPort: 80
```

Debug process:
```bash
kubectl apply -f broken-pod.yaml

# Check status
kubectl get pod broken-pod
kubectl describe pod broken-pod

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Try to fix
kubectl edit pod broken-pod  # Change image to nginx:1.20
```

Common debugging commands:
```bash
# Get detailed pod info
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Previous container logs

# Exec into pod
kubectl exec -it <pod-name> -- /bin/bash

# Get pod YAML
kubectl get pod <pod-name> -o yaml

# Watch pod status
kubectl get pod <pod-name> -w
```

## Practice Exercises

### Exercise 1: Pod Lifecycle
1. Tạo một pod với image `busybox` chạy `sleep 3600`
2. Watch pod progression: Pending → ContainerCreating → Running
3. Delete pod và observe termination process

### Exercise 2: Resource Management
1. Tạo pod với memory limit 50Mi và request 100Mi (invalid)
2. Observe error và fix manifest
3. Create pod với CPU request 2 cores (if node has less)

### Exercise 3: Networking
1. Tạo 2 pods trên cùng node
2. Get IP addresses của cả 2 pods
3. Exec vào pod 1 và ping pod 2
4. Test connectivity giữa containers

## Clean Up
```bash
kubectl delete pod --all
kubectl delete configmap app-config
kubectl delete secret app-secret
```

## Success Criteria
- [x] Tạo được pod với kubectl run
- [x] Tạo được pod với YAML manifest  
- [x] Hiểu multi-container pods
- [x] Sử dụng được ConfigMap/Secret
- [x] Configure được health probes
- [x] Debug được pod issues

## Next Steps
Lab 3: ReplicaSets và Deployments