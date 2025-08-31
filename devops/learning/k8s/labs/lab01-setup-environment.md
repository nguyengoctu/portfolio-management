# Lab 1: Setup Kubernetes Environment

## Objectives
- Cài đặt kubectl
- Setup local Kubernetes cluster
- Hiểu cách connect và verify cluster

## Prerequisites
- Docker installed
- Terminal/Command line access

## Setup Options (Chọn 1 trong 3)

### Option 1: Minikube (Recommended for beginners)
```bash
# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start cluster
minikube start

# Check status
minikube status
```

### Option 2: Kind (Kubernetes in Docker)
```bash
# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name dev-cluster

# List clusters
kind get clusters
```

### Option 3: Docker Desktop (Windows/Mac)
- Enable Kubernetes in Docker Desktop settings
- Wait for green status indicator

## Install kubectl

### Linux:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Mac:
```bash
brew install kubectl
```

### Windows:
```powershell
choco install kubernetes-cli
```

## Verify Installation

### Check kubectl version:
```bash
kubectl version --client
```

### Check cluster info:
```bash
kubectl cluster-info
```

### List nodes:
```bash
kubectl get nodes
```

Expected output:
```
NAME                 STATUS   ROLES           AGE   VERSION
minikube             Ready    control-plane   1m    v1.28.3
```

## Basic kubectl Commands Practice

### Get cluster information:
```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl describe node <node-name>
```

### Explore namespaces:
```bash
kubectl get namespaces
kubectl get pods --all-namespaces
```

### Context management:
```bash
kubectl config get-contexts
kubectl config current-context
kubectl config use-context <context-name>
```

## Tasks to Complete

### Task 1: Cluster Verification
1. Start your chosen K8s environment
2. Run `kubectl get nodes` and verify 1 node is Ready
3. Run `kubectl get pods -A` to see system pods
4. Take screenshot of successful setup

### Task 2: Context Exploration
1. List all available contexts: `kubectl config get-contexts`
2. Check current context: `kubectl config current-context`  
3. View cluster info: `kubectl cluster-info`

### Task 3: Namespace Exploration  
1. List all namespaces: `kubectl get ns`
2. Explore kube-system namespace: `kubectl get pods -n kube-system`
3. Describe one system pod to understand its structure

## Troubleshooting

### Minikube Issues:
```bash
# If minikube won't start
minikube delete
minikube start --driver=docker

# Check logs
minikube logs
```

### kubectl Issues:
```bash
# Check config
kubectl config view

# Reset context
kubectl config use-context minikube
```

### Docker Issues:
```bash
# Restart Docker service
sudo systemctl restart docker

# Check Docker is running
docker ps
```

## Success Criteria
- [x] kubectl installed and working
- [x] Local K8s cluster running
- [x] Can run `kubectl get nodes` successfully
- [x] Can see system pods with `kubectl get pods -A`

## Next Steps
After completing this lab, proceed to Lab 2: Basic Pod Operations

## Additional Resources
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kind Documentation](https://kind.sigs.k8s.io/)