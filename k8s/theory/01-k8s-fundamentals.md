# Kubernetes Fundamentals - Giải thích chi tiết

## 1. Kubernetes là gì và tại sao cần nó?

### Vấn đề trước khi có Kubernetes

Tưởng tượng bạn có một website bán hàng với:
- **Frontend**: React app
- **Backend**: API viết bằng Spring Boot  
- **Database**: MySQL
- **Cache**: Redis

**Với Docker thông thường:**
```bash
# Bạn phải chạy từng container thủ công
docker run -d --name mysql mysql:8.0
docker run -d --name redis redis:6.0
docker run -d --name backend --link mysql --link redis my-api:1.0
docker run -d --name frontend --link backend my-frontend:1.0
```

**Vấn đề phát sinh:**
1. **Nếu container backend crash** → Ai restart nó?
2. **Traffic tăng cao** → Làm sao chạy thêm 5 containers backend?  
3. **Server die** → Containers mất hết, phải setup lại từ đầu
4. **Deploy version mới** → Phải stop toàn bộ rồi start lại (downtime)
5. **100 containers** → Quản lý thủ công = địa ngục

### Kubernetes giải quyết như thế nào?

Kubernetes như một "người quản lý thông minh" tự động:
- **Self-healing**: Container crash? Tự động tạo cái mới
- **Auto-scaling**: Traffic cao? Tự động thêm containers  
- **Zero-downtime deployment**: Deploy không cần tắt service
- **Load balancing**: Tự động phân tán traffic
- **Service discovery**: Containers tự tìm thấy nhau

**Ví dụ thực tế:**
```yaml
# Bạn chỉ cần nói: "Tôi muốn 3 containers backend luôn chạy"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3  # Luôn có 3 containers
  template:
    spec:
      containers:
      - name: api
        image: my-api:1.0
```

Kubernetes sẽ:
- Tạo 3 containers backend
- Nếu 1 container chết → Tự tạo cái mới
- Nếu server chết → Chuyển containers sang server khác
- Nếu muốn update → Rolling update từng cái một (không downtime)

## 2. Kiến trúc Kubernetes - Giải thích bằng ví dụ thực tế

### Hãy tưởng tượng Kubernetes như một công ty

```
🏢 CÔNG TY KUBERNETES
├── 👔 BAN GIÁM ĐỐC (Control Plane/Master Node)
│   ├── 🎯 CEO (API Server) - Nhận mọi yêu cầu, ra quyết định
│   ├── 📋 Thư ký (etcd) - Ghi nhớ mọi thông tin công ty
│   ├── 👥 HR (Scheduler) - Quyết định nhân viên làm ở phòng nào
│   └── 📊 Manager (Controller) - Đảm bảo mọi thứ chạy đúng kế hoạch
│
└── 🏭 CÁC PHÒNG BAN (Worker Nodes)
    ├── 👨‍💼 Trưởng phòng (kubelet) - Quản lý nhân viên trong phòng
    ├── 📞 Tổng đài (kube-proxy) - Kết nối các phòng với nhau
    └── 👷‍♂️ Nhân viên (Containers) - Làm việc thực tế
```

### Master Node (Control Plane) - Ban Giám Đốc

#### 🎯 API Server (CEO)
```bash
# Khi bạn chạy lệnh:
kubectl create deployment nginx --image=nginx --replicas=3

# API Server nhận lệnh và nói:
# "OK, tôi cần tạo 3 containers nginx. Để tôi kiểm tra và thực hiện..."
```
- Nhận tất cả requests từ kubectl, web UI, hoặc các tools khác
- Xác thực, phân quyền (authentication & authorization)
- Giao tiếp với tất cả components khác

#### 📋 etcd (Thư ký)
```bash
# etcd lưu trữ mọi thứ:
{
  "deployments": {
    "nginx": {
      "replicas": 3,
      "image": "nginx",
      "status": "running"
    }
  },
  "nodes": ["worker1", "worker2", "worker3"],
  "pods": [...]
}
```
- Database phân tán, lưu trữ toàn bộ trạng thái cluster
- Mọi thông tin về pods, services, configs đều ở đây
- **Nếu etcd mất → Cluster chết hoàn toàn**

#### 👥 Scheduler (HR Department)
```bash
# Scheduler nghĩ:
# "Cần tạo 3 pods nginx. Để xem..."
# "Worker1: CPU 50%, RAM 60% - OK"
# "Worker2: CPU 90%, RAM 80% - Quá tải!"
# "Worker3: CPU 30%, RAM 40% - Tốt nhất!"
# "Quyết định: Pod1 → Worker1, Pod2 → Worker3, Pod3 → Worker1"
```
- Quyết định pod chạy trên node nào dựa trên:
  - Resource availability (CPU, RAM)
  - Node constraints (labels, taints)
  - Pod requirements (resource requests)

#### 📊 Controller Manager (Các Manager)
```bash
# Deployment Controller kiểm tra:
# "Spec nói cần 3 replicas, hiện tại có 2. Thiếu 1!"
# "Tạo thêm 1 pod nữa..."

# ReplicaSet Controller:
# "Pod nginx-123 chết rồi! Tạo pod mới thay thế!"

# Node Controller:
# "Worker2 không phản hồi 5 phút rồi. Chuyển pods sang node khác!"
```
- **Deployment Controller**: Quản lý deployments
- **ReplicaSet Controller**: Đảm bảo số lượng pods
- **Node Controller**: Theo dõi trạng thái nodes
- **Endpoint Controller**: Cập nhật service endpoints

### Worker Nodes - Các Phòng Ban

#### 👨‍💼 kubelet (Trưởng phòng)
```bash
# kubelet nhận lệnh từ API Server:
# "Anh cần chạy pod nginx với image nginx:1.20"

# kubelet thực hiện:
1. Pull image nginx:1.20
2. Tạo container
3. Monitor container health
4. Báo cáo trạng thái về API Server
```
- Agent chạy trên mỗi worker node
- Nhận pod specs từ API Server
- Quản lý container lifecycle (create, start, stop, restart)
- Health monitoring và reporting

#### 📞 kube-proxy (Tổng đài viên)
```bash
# Khi có service:
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - port: 80

# kube-proxy tạo iptables rules:
# "Traffic đến nginx-service:80 → Load balance giữa 3 pods nginx"
```
- Network proxy chạy trên mỗi node
- Implement Kubernetes Services
- Load balancing traffic giữa pods
- Maintain network rules (iptables/ipvs)

#### 🐳 Container Runtime
```bash
# kubelet nói với container runtime:
# "Tạo container với image nginx:1.20"

# Container runtime (Docker/containerd):
# "OK, đang pull image... Tạo container... Start container... Done!"
```
- Docker, containerd, CRI-O
- Thực tế tạo và chạy containers
- Managed bởi kubelet

### Workflow thực tế

**Ví dụ: Tạo deployment nginx với 3 replicas**

```bash
kubectl create deployment nginx --image=nginx --replicas=3
```

**Quá trình diễn ra:**

1. **kubectl** → **API Server**: "Tạo deployment nginx với 3 replicas"

2. **API Server**:
   - Validate request
   - Lưu vào **etcd**: "Deployment nginx cần 3 pods"
   - Notify **Controller Manager**

3. **Deployment Controller** (part of Controller Manager):
   - Đọc etcd: "Cần 3 pods nhưng hiện có 0"
   - Tạo **ReplicaSet** với 3 pod specs
   - Lưu ReplicaSet vào etcd

4. **Scheduler**:
   - Đọc etcd: "3 pods chưa được assign node"
   - Evaluate nodes: "Worker1 tốt nhất cho pod1, Worker2 cho pod2..."
   - Update etcd: "Pod1 → Worker1, Pod2 → Worker2, Pod3 → Worker1"

5. **kubelet** trên mỗi worker:
   - Watch etcd changes
   - Worker1 kubelet: "Tôi cần chạy pod1 và pod3"
   - Pull nginx image
   - Tạo containers
   - Report trạng thái về API Server

6. **kube-proxy**:
   - Nếu có Service → Setup network rules
   - Load balance traffic giữa 3 pods

**Kết quả cuối cùng:**
```bash
kubectl get pods
# NAME                     READY   STATUS    RESTARTS   AGE
# nginx-7d8b49557f-abc123  1/1     Running   0          30s
# nginx-7d8b49557f-def456  1/1     Running   0          30s  
# nginx-7d8b49557f-ghi789  1/1     Running   0          30s
```

### Tại sao thiết kế như vậy?

1. **Separation of Concerns**: Mỗi component có trách nhiệm riêng
2. **Scalability**: Có thể có nhiều worker nodes
3. **High Availability**: Master components có thể chạy nhiều instances
4. **Modularity**: Có thể thay thế từng component (VD: Docker → containerd)

---
## 🧪 **HANDS-ON EXERCISE**
**[Exercise 01: Architecture Exploration](../exercises/ex01-architecture-exploration.md)**

Khám phá kiến trúc cluster thực tế và plan architecture cho portfolio project.
- Identify control plane components
- Understand node architecture  
- Plan portfolio services mapping
- Practice troubleshooting

---

## 3. Core Objects - Hiểu bằng ví dụ thực tế

### 🏠 Pod - Căn hộ chứa containers

**Pod giống như một căn hộ:**
- 1 căn hộ có thể có 1 hoặc nhiều người ở (containers)
- Cùng chia sẻ điện nước internet (network & storage)
- Nếu căn hộ bị phá → Mọi người trong đó đều mất

```yaml
# Ví dụ: Căn hộ có 1 người (container nginx)
apiVersion: v1
kind: Pod
metadata:
  name: web-server
spec:
  containers:
  - name: nginx
    image: nginx:1.20
    ports:
    - containerPort: 80
```

**Thực tế:**
```bash
# Tạo pod
kubectl run web-server --image=nginx

# Kiểm tra
kubectl get pods
# NAME         READY   STATUS    RESTARTS   AGE
# web-server   1/1     Running   0          10s

# Vào trong pod
kubectl exec -it web-server -- bash
```

**Multi-container Pod:**
```yaml
# Ví dụ: Căn hộ có 2 người - nginx và logger
apiVersion: v1
kind: Pod
metadata:
  name: web-with-logger
spec:
  containers:
  - name: nginx
    image: nginx:1.20
    volumeMounts:
    - name: logs
      mountPath: /var/log/nginx
  - name: logger
    image: busybox
    command: ["tail", "-f", "/logs/access.log"]
    volumeMounts:
    - name: logs
      mountPath: /logs
  volumes:
  - name: logs
    emptyDir: {}
```

**Vấn đề với Pod:**
- Pod chết → Mất luôn
- Không tự động restart nếu crash
- Phải tạo thủ công từng cái

### 🏢 ReplicaSet - Công ty xây nhiều căn hộ giống nhau

**ReplicaSet đảm bảo luôn có N pods giống nhau:**

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-replicaset
spec:
  replicas: 3  # Luôn có 3 pods
  selector:
    matchLabels:
      app: nginx
  template:    # Template để tạo pod
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.20
```

**Thực tế:**
```bash
kubectl apply -f replicaset.yaml

# Check
kubectl get replicasets
kubectl get pods
# Sẽ có 3 pods nginx

# Test self-healing: Xóa 1 pod
kubectl delete pod <pod-name>
# ReplicaSet sẽ tự tạo pod mới thay thế
```

**Nhưng ReplicaSet có vấn đề:**
- Khó update image version
- Không có rolling update
- Phải quản lý thủ công

### 🏗️ Deployment - Công ty xây dựng thông minh

**Deployment = ReplicaSet + Rolling Updates + Rollback**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
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
        image: nginx:1.20  # Version cũ
```

**Kịch bản thực tế - Rolling Update:**
```bash
# 1. Deploy version 1.20
kubectl apply -f deployment.yaml

# 2. Check pods
kubectl get pods
# 3 pods với nginx:1.20

# 3. Update lên version 1.21
kubectl set image deployment/nginx-deployment nginx=nginx:1.21

# 4. Watch rolling update
kubectl rollout status deployment/nginx-deployment

# Quá trình diễn ra:
# - Tạo 1 pod mới với nginx:1.21
# - Khi pod mới ready → Xóa 1 pod cũ
# - Lặp lại cho đến khi có 3 pods mới
# - Zero downtime!
```

**Rollback nếu có lỗi:**
```bash
# Version mới có bug, rollback ngay
kubectl rollout undo deployment/nginx-deployment

# Hoặc rollback to version cụ thể
kubectl rollout undo deployment/nginx-deployment --to-revision=1
```

### 🌐 Service - Hệ thống định tuyến thông minh

**Vấn đề:** Pod có IP thay đổi liên tục, làm sao client kết nối?

**Service = Load Balancer + DNS name cố định**

#### ClusterIP Service (Internal)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx  # Chọn pods có label app=nginx
  ports:
  - port: 80      # Port của service
    targetPort: 80 # Port của pods
  type: ClusterIP  # Chỉ access từ trong cluster
```

**Thực tế:**
```bash
kubectl apply -f service.yaml

# Service tạo DNS name: nginx-service
# Pods khác có thể access: http://nginx-service

# Test từ pod khác
kubectl run test --image=busybox --rm -it -- sh
/ # wget -qO- http://nginx-service
# Sẽ load balance giữa 3 pods nginx
```

#### NodePort Service (External)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Port trên node
  type: NodePort
```

**Access từ bên ngoài:**
```bash
# Lấy IP của node
kubectl get nodes -o wide

# Access từ browser hoặc curl
curl http://<node-ip>:30080
```

#### LoadBalancer Service (Cloud)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
spec:
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer  # Cloud provider tạo LB
```

### 🗄️ ConfigMap - File cấu hình

**ConfigMap chứa configuration không nhạy cảm:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database_url: "mysql://localhost:3306/mydb"
  debug_mode: "true"
  max_connections: "100"
```

**Sử dụng trong Pod:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: my-app:1.0
    env:
    - name: DATABASE_URL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: database_url
    - name: DEBUG_MODE
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: debug_mode
```

### 🔐 Secret - Kho mật khẩu

**Secret chứa thông tin nhạy cảm (mã hóa base64):**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  username: YWRtaW4=     # admin (base64)
  password: cGFzc3dvcmQ= # password (base64)
```

**Tạo Secret từ command line:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=username=admin \
  --from-literal=password=password
```

**Sử dụng trong Pod:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: my-app:1.0
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: password
```

### 🏢 Namespace - Phân chia không gian

**Namespace = Virtual clusters trong cluster**

```bash
# Tạo namespace cho môi trường khác nhau
kubectl create namespace development
kubectl create namespace staging  
kubectl create namespace production

# Deploy app vào namespace cụ thể
kubectl apply -f deployment.yaml -n development
kubectl apply -f deployment.yaml -n production

# List resources theo namespace
kubectl get pods -n development
kubectl get pods -n production

# Set default namespace
kubectl config set-context --current --namespace=development
```

**Namespace isolation:**
```yaml
# development/app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: development
spec:
  replicas: 1  # Dev chỉ cần 1 pod
  # ...

---
# production/app-deployment.yaml  
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 10  # Production cần 10 pods
  # ...
```

### 🔄 Tổng hợp workflow thực tế

**Scenario: Deploy một web application**

1. **Tạo namespace:**
```bash
kubectl create namespace my-app
```

2. **Tạo ConfigMap:**
```bash
kubectl create configmap app-config \
  --from-literal=API_URL=https://api.example.com \
  -n my-app
```

3. **Tạo Secret:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=API_KEY=secret123 \
  -n my-app
```

4. **Deploy application:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web
        image: my-web-app:v1.0
        env:
        - name: API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: API_URL
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: API_KEY
```

5. **Expose với Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: my-app
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

6. **Deploy và test:**
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check status
kubectl get all -n my-app

# Test application
kubectl port-forward service/web-app-service 8080:80 -n my-app
curl http://localhost:8080
```

**Kết quả:**
- 3 pods chạy web application  
- Load balancer phân tán traffic
- Config và secrets được inject vào containers
- Zero downtime updates với rolling deployment

---
## 🧪 **HANDS-ON EXERCISES**

**[Exercise 02: Pod Fundamentals](../exercises/ex02-pod-fundamentals.md)**

Thực hành tạo pods cho portfolio services với ConfigMaps và Secrets.
- Single và multi-container pods
- ConfigMap và Secret integration
- Health checks implementation
- Inter-pod communication testing

**[Exercise 03: Services & Networking](../exercises/ex03-services-networking.md)**

Setup networking và service discovery cho portfolio services.
- ClusterIP vs NodePort vs LoadBalancer
- Service discovery và DNS
- Load balancing testing
- Troubleshooting connectivity

**[Exercise 04: Deployments & ReplicaSets](../exercises/ex04-deployments-replicasets.md)**

Convert pods thành production-ready deployments.
- Scaling và self-healing
- Rolling updates và rollbacks  
- Deployment strategies
- Complete portfolio deployment

---

## 4. Health Checks - Đảm bảo ứng dụng khỏe mạnh

### 🏥 Probes - Bác sĩ kiểm tra sức khỏe

Kubernetes có 3 loại "bác sĩ" kiểm tra pods:

#### Liveness Probe - "Còn sống không?"
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: app
    image: my-app:1.0
    livenessProbe:
      httpGet:
        path: /health      # Endpoint kiểm tra health
        port: 8080
      initialDelaySeconds: 30  # Đợi 30s sau khi start
      periodSeconds: 10        # Kiểm tra mỗi 10s
```

**Thực tế:**
- Nếu `/health` trả về lỗi → K8s restart container
- Tránh trường hợp app "zombie" (chạy nhưng không hoạt động)

#### Readiness Probe - "Sẵn sàng phục vụ chưa?"
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Thực tế:**
- Nếu `/ready` trả về lỗi → Service không route traffic đến pod này
- Pod vẫn chạy, chỉ không nhận requests

#### Startup Probe - "Đã start xong chưa?"
```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  periodSeconds: 5
  failureThreshold: 30  # Tối đa 30 * 5s = 150s để start
```

**Khi nào dùng:**
- App startup chậm (Java applications, database connections)
- Tránh liveness probe kill app đang starting

---
## 🧪 **HANDS-ON EXERCISE**
**[Exercise 05: Health Checks & Resource Management](../exercises/ex05-health-resources.md)**

Implement production-ready health checks và resource management.
- Liveness, readiness, và startup probes
- Resource requests/limits optimization
- Quality of Service classes
- Horizontal Pod Autoscaler setup

---

## 5. Resource Management - Quản lý tài nguyên

### 💰 CPU và Memory - Ngân sách cho containers

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-demo
spec:
  containers:
  - name: app
    image: nginx
    resources:
      requests:    # "Tôi cần ít nhất"
        memory: "64Mi"   # 64 MB RAM
        cpu: "250m"      # 0.25 CPU core
      limits:      # "Tôi không được vượt quá"
        memory: "128Mi"  # 128 MB RAM  
        cpu: "500m"      # 0.5 CPU core
```

**Requests vs Limits:**
- **Requests**: Kubernetes đảm bảo có ít nhất resources này
- **Limits**: Container không được vượt quá

**CPU Units:**
- `1000m = 1` CPU core
- `500m = 0.5` CPU core  
- `250m = 0.25` CPU core

### 🏷️ Quality of Service (QoS)

1. **Guaranteed** (requests = limits):
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "500m"
  limits:
    memory: "128Mi"  # Same as requests
    cpu: "500m"      # Same as requests
```

2. **Burstable** (requests < limits):
```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "250m"
  limits:
    memory: "128Mi"  # More than requests
    cpu: "500m"
```

3. **BestEffort** (no requests/limits):
```yaml
# No resources section
```

**Ưu tiên khi node hết resources:**
Guaranteed > Burstable > BestEffort

## 6. Scaling - Tự động mở rộng

### 📈 Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale khi CPU > 70%
```

**Thực tế:**
```bash
# Deploy HPA
kubectl apply -f hpa.yaml

# Tạo load test
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh
# Trong pod: while true; do wget -q -O- http://web-app-service; done

# Watch scaling
kubectl get hpa -w
kubectl get pods -w
```

## 7. Storage - Lưu trữ dữ liệu

### 💾 Volume Types

#### emptyDir - Thư mục tạm
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: shared-storage
spec:
  containers:
  - name: writer
    image: busybox
    command: ["/bin/sh", "-c", "echo 'Hello' > /shared/message.txt; sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  - name: reader  
    image: busybox
    command: ["/bin/sh", "-c", "cat /shared/message.txt; sleep 3600"]
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  volumes:
  - name: shared-data
    emptyDir: {}  # Mất khi pod bị xóa
```

#### PersistentVolume - Lưu trữ lâu dài
```yaml
# PersistentVolume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /mnt/data

---
# PersistentVolumeClaim  
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi

---
# Pod sử dụng PVC
apiVersion: v1
kind: Pod
metadata:
  name: storage-pod
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: storage
      mountPath: /usr/share/nginx/html
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: my-pvc
```

## 8. Best Practices - Kinh nghiệm thực tế

### ✅ Resource Management
```yaml
# ALWAYS set requests và limits
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"

# Use namespaces
metadata:
  namespace: production

# Implement health checks
livenessProbe:
  httpGet:
    path: /health
    port: 8080
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
```

### 🔒 Security
```yaml
# Don't run as root
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  
# Read-only root filesystem
securityContext:
  readOnlyRootFilesystem: true

# Drop capabilities
securityContext:
  capabilities:
    drop:
    - ALL
```

### 📊 Labels và Selectors
```yaml
# Consistent labeling
metadata:
  labels:
    app: web-app
    version: "1.0"
    environment: production
    component: frontend

# Use in selectors
spec:
  selector:
    matchLabels:
      app: web-app
      environment: production
```

## 9. Common Troubleshooting - Debug như pro

### 🐛 Pod không start
```bash
# 1. Check pod status
kubectl get pods

# 2. Describe pod  
kubectl describe pod <pod-name>

# 3. Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# 4. Check logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Previous container
```

### 🌐 Service connectivity issues
```bash
# 1. Check service endpoints
kubectl get endpoints <service-name>

# 2. Test DNS resolution
kubectl run debug --image=busybox --rm -it -- nslookup <service-name>

# 3. Test connectivity
kubectl run debug --image=busybox --rm -it -- wget -qO- http://<service-name>

# 4. Check service selector
kubectl get service <service-name> -o yaml
kubectl get pods --show-labels
```

### 🔍 Resource issues
```bash
# Check node resources
kubectl describe nodes

# Check pod resource usage
kubectl top pods

# Check resource quotas
kubectl describe resourcequota
```

## 10. What's Next - Bước tiếp theo

### 🚀 Immediate Next Steps:
1. **Setup local cluster**: minikube hoặc kind
2. **Practice labs**: `k8s/labs/lab01-setup-environment.md`
3. **Try kubectl commands**: `k8s/exercises/kubectl-practice.md`

### 🎯 Advanced Topics:
1. **Helm** - Package manager for Kubernetes
2. **Ingress Controllers** - Advanced routing (nginx, traefik)
3. **StatefulSets** - For databases và stateful apps  
4. **Jobs & CronJobs** - Batch processing
5. **Custom Resources** - Extend Kubernetes

### 📚 Real Project:
- **Portfolio Migration**: `k8s/exercises/portfolio-k8s-migration.md`
- Convert Docker Compose app → Kubernetes manifests
- Learn by doing với real application

**Remember**: Kubernetes phức tạp nhưng logical. Start với basics, practice nhiều, và build real applications!

---
## 🧪 **FINAL PROJECT EXERCISE**
**[Portfolio K8s Migration](../exercises/portfolio-k8s-migration.md)**

Main project: Convert toàn bộ portfolio application từ Docker Compose sang Kubernetes.
- Complete architecture migration
- Production-ready manifests  
- StatefulSets cho database
- Ingress setup
- Monitoring và scaling

**[Kubectl Practice Commands](../exercises/kubectl-practice.md)**

Master kubectl commands với hands-on practice.
- Essential commands drilling
- Troubleshooting scenarios
- Real-world debugging
- Advanced operations

---