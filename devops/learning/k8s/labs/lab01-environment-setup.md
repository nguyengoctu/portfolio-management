# Lab 01: Kubernetes Environment Setup

## Mục tiêu
Setup môi trường Kubernetes local để thực hành migration portfolio project.

## Prerequisites
```bash
# Kiểm tra Docker đã cài đặt
docker --version
docker compose --version

# Kiểm tra resources
free -h  # Cần ít nhất 4GB RAM
df -h    # Cần ít nhất 10GB disk space
```

## Option 1: Kind (Kubernetes in Docker) - Recommended

### Step 1: Install Kind
```bash
# Download kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Verify installation
kind --version
```

### Step 2: Create Cluster Config
```bash
# Tạo multi-node cluster config cho thực tế
cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: portfolio-cluster
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
- role: worker
  labels:
    node-type: "application"
- role: worker
  labels:
    node-type: "database"
EOF

# Create cluster
kind create cluster --config=kind-config.yaml

# Verify cluster
kubectl cluster-info --context kind-portfolio-cluster
```

### Step 3: Install kubectl
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify kubectl
kubectl version --client
kubectl get nodes
```

## Option 2: Minikube

### Install Minikube
```bash
# Download minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube với resources phù hợp
minikube start --memory=4096 --cpus=2 --disk-size=20GB

# Enable addons cần thiết
minikube addons enable ingress
minikube addons enable dashboard
minikube addons enable metrics-server
```

## Lab Tasks

### Task 1: Cluster Verification
```bash
# Check cluster status
kubectl get nodes -o wide
kubectl get namespaces
kubectl get all --all-namespaces

# Check cluster info
kubectl cluster-info
kubectl version

# Test cluster DNS
kubectl run test-pod --image=busybox --rm -it -- nslookup kubernetes.default
```

### Task 2: Deploy Test Application
```bash
# Deploy nginx test
kubectl create deployment nginx-test --image=nginx:latest
kubectl expose deployment nginx-test --port=80 --type=NodePort

# Get service info
kubectl get services
kubectl describe service nginx-test

# Test access (Kind)
kubectl port-forward service/nginx-test 8080:80
curl http://localhost:8080

# Test access (Minikube)
minikube service nginx-test --url
```

### Task 3: Create Namespace for Portfolio
```bash
# Create dedicated namespace
kubectl create namespace portfolio

# Set default namespace
kubectl config set-context --current --namespace=portfolio

# Verify
kubectl config view --minify | grep namespace
```

### Task 4: Install Essential Tools

#### Helm (Package Manager)
```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version

# Add common repositories
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update
```

#### k9s (Cluster Management)
```bash
# Install k9s
wget https://github.com/derailed/k9s/releases/latest/download/k9s_Linux_amd64.tar.gz
tar -xzf k9s_Linux_amd64.tar.gz
sudo mv k9s /usr/local/bin/

# Launch k9s
k9s
```

### Task 5: Setup Ingress Controller
```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Wait for ingress controller
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Test ingress
kubectl get pods -n ingress-nginx
kubectl get services -n ingress-nginx
```

### Task 6: Storage Setup
```bash
# Check default storage class
kubectl get storageclass

# Create storage class nếu cần (Kind usually has local-path)
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: portfolio-storage
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
EOF
```

### Task 7: Test Portfolio-specific Resources

#### Create MySQL Test
```bash
# Test StatefulSet với persistent storage
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: mysql-test-secret
  namespace: portfolio
type: Opaque
data:
  root-password: cm9vdHBhc3N3b3Jk  # rootpassword base64
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql-test
  namespace: portfolio
spec:
  serviceName: mysql-test
  replicas: 1
  selector:
    matchLabels:
      app: mysql-test
  template:
    metadata:
      labels:
        app: mysql-test
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-test-secret
              key: root-password
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 1Gi
EOF

# Monitor deployment
kubectl get statefulsets -n portfolio
kubectl get pods -n portfolio -w
```

#### Test Service Discovery
```bash
# Create MySQL service
kubectl expose statefulset mysql-test --port=3306 --namespace=portfolio

# Test connectivity
kubectl run mysql-client --image=mysql:8.0 --rm -it --namespace=portfolio -- bash
# mysql -h mysql-test.portfolio.svc.cluster.local -u root -p
```

### Task 8: Monitoring Setup
```bash
# Install metrics-server (if not already)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait for metrics server
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system

# Test metrics
kubectl top nodes
kubectl top pods -A
```

## Verification Checklist

### Environment Check
```bash
# ✅ Cluster running with multiple nodes
kubectl get nodes

# ✅ All system pods running
kubectl get pods -A | grep -E "(Running|Completed)"

# ✅ Ingress controller ready
kubectl get pods -n ingress-nginx

# ✅ Storage class available
kubectl get storageclass

# ✅ Metrics server working
kubectl top nodes

# ✅ Portfolio namespace created
kubectl get namespace portfolio

# ✅ Test MySQL StatefulSet running
kubectl get statefulsets -n portfolio
```

### Troubleshooting Common Issues

#### Kind Issues
```bash
# Cluster not starting
kind delete cluster --name portfolio-cluster
kind create cluster --config=kind-config.yaml

# Port forwarding issues
docker ps | grep kindest
```

#### Network Issues
```bash
# DNS resolution
kubectl run test-dns --image=busybox --rm -it -- nslookup kubernetes.default

# Service connectivity
kubectl get endpoints
```

#### Storage Issues
```bash
# PVC stuck in pending
kubectl describe pvc <pvc-name>
kubectl get storageclass
```

## Next Steps
1. Deploy portfolio services one by one
2. Test inter-service communication
3. Setup persistent storage for production data
4. Configure ingress for external access

## Cleanup
```bash
# Clean test resources
kubectl delete namespace portfolio

# Delete cluster (Kind)
kind delete cluster --name portfolio-cluster

# Delete cluster (Minikube)
minikube delete
```

## Production Considerations
1. **Multi-node setup**: Kind với 3+ nodes
2. **Resource limits**: 8GB+ RAM, 50GB+ storage
3. **Network policies**: Restrict inter-pod communication
4. **RBAC**: Role-based access control
5. **Backup strategy**: etcd snapshots, persistent volume backups