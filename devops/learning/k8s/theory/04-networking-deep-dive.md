# Kubernetes Networking Deep Dive - Chi tiết từng khái niệm

## 1. Networking Model Overview

### Kubernetes Networking Rules (4 quy tắc cơ bản)
Kubernetes networking dựa trên 4 quy tắc cơ bản - cần hiểu rõ để không bị confused:

1. **Pods can communicate with all other pods** - Tất cả pods có thể talk với nhau
2. **Nodes can communicate with all pods** - Nodes có thể talk với tất cả pods  
3. **No NAT** - Pods thấy chính IP của chúng, không bị NAT
4. **Shared network namespace** - Containers trong same pod share network

### Tại sao cần hiểu networking?
**Docker Compose hiện tại:**
```yaml
# Services talk với nhau thông qua container names
frontend:
  environment:
    - AUTH_URL=http://auth-service:8082  # Container name resolution
networks:
  portfolio-management-network:
    driver: bridge  # Simple bridge network
```

**Kubernetes phức tạp hơn:**
- Multi-node cluster → pods có thể ở khác nodes
- Service discovery thông qua DNS  
- Load balancing automatic
- Network policies cho security

## 2. Pod Networking Chi Tiết

### Pod Network Namespace
Mỗi pod có 1 network namespace riêng:

```bash
# Trong 1 pod có nhiều containers
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: auth-service
    ports:
    - containerPort: 8082
  - name: sidecar-logger
    # Cùng share network với auth-service
    # Có thể access localhost:8082
```

**Thực tế:**
- Container 1: `curl localhost:8082` → reach container 2
- Container 1 và 2 có cùng IP address
- Port conflicts nếu 2 containers dùng cùng port

### Pod-to-Pod Communication

#### Same Node Communication
```
Pod A (10.244.1.2) → Pod B (10.244.1.3)
     ↓
   Node's bridge network (cbr0)
     ↓  
Pod B receives traffic
```

#### Cross-Node Communication  
```
Node 1: Pod A (10.244.1.2) → Node 2: Pod B (10.244.2.3)

Pod A → Node 1 bridge → Node 1 eth0 → Network → Node 2 eth0 → Node 2 bridge → Pod B
```

**CNI Plugins handle này:** Flannel, Calico, Weave

### IP Address Assignment
```bash
# Node 1 pods: 10.244.1.x
# Node 2 pods: 10.244.2.x  
# Node 3 pods: 10.244.3.x

# Check pod IPs
kubectl get pods -o wide
```

## 3. Services - Load Balancing & Discovery

### Tại sao cần Services?
**Problems without Services:**
- Pod IPs thay đổi khi restart
- Multiple pod replicas → client không biết connect đến cái nào
- Load balancing manual

**Services solve:**
- Stable IP và DNS name
- Automatic load balancing
- Service discovery

### Service Types Chi Tiết

#### ClusterIP - Internal Communication
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  type: ClusterIP          # Default type
  clusterIP: 10.96.1.100   # Virtual IP (kube-proxy tạo)
  selector:
    app: auth-service      # Target pods với label này
  ports:
  - port: 8082             # Service port
    targetPort: 8082       # Container port
```

**How it works:**
1. Client call `auth-service:8082`
2. DNS resolves to ClusterIP `10.96.1.100:8082`
3. kube-proxy intercepts traffic → iptables rules
4. Traffic forwarded to one of backend pods: `10.244.1.2:8082`

#### NodePort - External Access
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-nodeport
spec:
  type: NodePort
  nodePort: 30080          # Port on every node
  selector:
    app: frontend
  ports:
  - port: 80               # Service port
    targetPort: 3000       # Container port
    nodePort: 30080        # External port
```

**How it works:**
```
External client → Node IP:30080 → kube-proxy → Pod IP:3000
                                     ↓
                               iptables DNAT rule
```

#### LoadBalancer - Production External Access
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-lb
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
```

**How it works:**
1. Cloud provider creates external load balancer
2. External LB → NodePort → kube-proxy → Pods
3. External IP assigned: `34.102.136.180:80`

#### ExternalName - External Service Mapping
```yaml
# Map external database
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: rds.amazonaws.com
  ports:
  - port: 3306
```

### Service Discovery Mechanisms

#### DNS-based Discovery (Chủ yếu dùng)
```bash
# CoreDNS tự động tạo DNS records
auth-service.portfolio.svc.cluster.local → 10.96.1.100

# Short forms (trong cùng namespace):
auth-service → 10.96.1.100
auth-service.portfolio → 10.96.1.100

# Test DNS resolution:
kubectl exec -it frontend-pod -- nslookup auth-service
```

#### Environment Variables (Legacy)
```bash
# Kubernetes inject environment variables
AUTH_SERVICE_SERVICE_HOST=10.96.1.100
AUTH_SERVICE_SERVICE_PORT=8082

# Access in application:
String authUrl = System.getenv("AUTH_SERVICE_SERVICE_HOST");
```

## 4. kube-proxy Deep Dive

### kube-proxy là gì?
**kube-proxy** chạy trên mỗi node, implement Services bằng cách:
- Watch API server cho Service/Endpoints changes
- Update local networking rules (iptables/IPVS)
- Route traffic từ Service IP → Pod IPs

### Proxy Modes

#### iptables Mode (Default)
```bash
# kube-proxy tạo iptables rules
# Check iptables rules:
sudo iptables -t nat -L | grep KUBE

# Example rule:
KUBE-SVC-XYZABC → KUBE-SEP-POD1 (33%)
                → KUBE-SEP-POD2 (33%) 
                → KUBE-SEP-POD3 (34%)
```

#### IPVS Mode (Better Performance)
```bash
# Enable IPVS mode
kubectl edit configmap kube-proxy -n kube-system
# mode: "ipvs"

# Check IPVS rules:
ipvsadm -L -n
```

### SessionAffinity
```yaml
apiVersion: v1
kind: Service
spec:
  sessionAffinity: ClientIP  # Sticky sessions
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800   # 3 hours
```

## 5. Ingress - HTTP/HTTPS Routing

### Tại sao cần Ingress?
**Problems with LoadBalancer:**
- Mỗi service cần 1 external IP → expensive
- No SSL termination
- No URL-based routing

**Ingress Solutions:**
- 1 LoadBalancer cho multiple services  
- SSL/TLS termination
- Host/path-based routing
- Middleware: auth, rate limiting

### Ingress Controller Setup
```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Verify installation
kubectl get pods -n ingress-nginx
kubectl get services -n ingress-nginx
```

### Ingress Resource Examples

#### Host-based Routing
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: api.portfolio.com
    http:
      paths:
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 8082
      - path: /users  
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 8083
  - host: portfolio.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

#### SSL/TLS Termination
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portfolio-tls
spec:
  tls:
  - hosts:
    - portfolio.com
    - api.portfolio.com
    secretName: portfolio-tls-secret
  rules:
  - host: portfolio.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

## 6. Network Policies - Security

### Default Behavior
**By default:** All pods có thể communicate với tất cả pods (no restrictions)

### Network Policy Examples

#### Deny All Traffic
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: portfolio
spec:
  podSelector: {}  # Apply to all pods
  policyTypes:
  - Ingress
  - Egress
```

#### Allow Frontend → Backend Only
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-to-backend
  namespace: portfolio
spec:
  podSelector:
    matchLabels:
      tier: backend  # Apply to backend pods
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend  # Only allow from frontend pods
    ports:
    - protocol: TCP
      port: 8082
    - protocol: TCP
      port: 8083
```

## 7. Portfolio Project Networking Architecture

### Current Docker Compose Network
```
frontend:3000 ←→ auth-service:8082
                ↗              ↘
               ↙                ↘
user-service:8083            email-service:8081
       ↓                            ↓
portfolio-db:3306              (external SMTP)
       ↓
   minio:9000
```

### Target Kubernetes Network
```
Internet → LoadBalancer/Ingress → Frontend Pods (3000)
                    ↓
         Internal Services (ClusterIP):
         - auth-service:8082  (2-3 replicas)
         - user-service:8083  (2-3 replicas) 
         - email-service:8081 (1 replica)
                    ↓
         Stateful Services:
         - mysql-service:3306 (StatefulSet)
         - minio-service:9000 (StatefulSet)
```

### Service Dependencies Resolution
```yaml
# Frontend environment
env:
- name: REACT_APP_AUTH_API
  value: "https://api.portfolio.com/auth"  # Through ingress
- name: REACT_APP_USER_API  
  value: "https://api.portfolio.com/users" # Through ingress

# Auth service environment  
env:
- name: USER_SERVICE_URL
  value: "http://user-service:8083"        # Service discovery
- name: EMAIL_SERVICE_URL
  value: "http://email-service:8081"       # Service discovery
- name: DATABASE_URL
  value: "jdbc:mysql://mysql-service:3306/portfolio"
```

## 8. DNS in Kubernetes

### CoreDNS Configuration
```bash
# Check CoreDNS config
kubectl get configmap coredns -n kube-system -o yaml

# DNS records format:
<service-name>.<namespace>.svc.cluster.local
```

### DNS Resolution Examples
```bash
# From pod in portfolio namespace:
curl auth-service:8082                    # Short form
curl auth-service.portfolio:8082          # With namespace  
curl auth-service.portfolio.svc.cluster.local:8082  # FQDN

# Cross-namespace access:
curl mysql-service.database.svc.cluster.local:3306
```

### DNS Debugging
```bash
# Test DNS resolution
kubectl run dns-test --image=busybox --rm -it -- sh
# nslookup auth-service
# nslookup auth-service.portfolio.svc.cluster.local

# Check DNS config trong pod
kubectl exec -it <pod> -- cat /etc/resolv.conf
```

## 9. Troubleshooting Network Issues

### Common Network Problems

#### Service không accessible
```bash
# Check service exists
kubectl get services

# Check endpoints (backend pods)
kubectl get endpoints auth-service

# Check if pods have correct labels
kubectl get pods --show-labels

# Test service connectivity
kubectl run test --image=busybox --rm -it -- wget -qO- auth-service:8082
```

#### DNS Resolution Issues
```bash
# Check CoreDNS pods
kubectl get pods -n kube-system | grep coredns

# Test DNS từ pod
kubectl exec -it <pod> -- nslookup kubernetes.default

# Check pod DNS config
kubectl exec -it <pod> -- cat /etc/resolv.conf
```

#### Cross-node Communication Issues
```bash
# Check node connectivity
kubectl get nodes -o wide

# Check CNI plugin
kubectl get pods -n kube-system | grep -E "(flannel|calico|weave)"

# Test pod-to-pod across nodes
kubectl get pods -o wide  # Note which nodes
kubectl exec -it <pod-on-node1> -- ping <pod-ip-on-node2>
```

#### kube-proxy Issues
```bash
# Check kube-proxy pods
kubectl get pods -n kube-system | grep kube-proxy

# Check kube-proxy logs
kubectl logs -n kube-system kube-proxy-xxxxx

# Check iptables rules
sudo iptables -t nat -L | grep KUBE-SVC-<service-hash>
```

## 10. Performance và Best Practices

### Service Performance
- **Use ClusterIP** cho internal services
- **Avoid NodePort** in production except for debugging
- **LoadBalancer** cho external services cần high availability
- **Ingress** cho HTTP/HTTPS với path/host routing

### DNS Performance
- Use short service names trong same namespace
- Cache DNS lookups trong applications
- Monitor CoreDNS performance

### Network Policy Best Practices
- Start với deny-all policy
- Gradually open required connections
- Use namespace isolation
- Monitor network traffic patterns

## 11. Monitoring Network

### Network Metrics
```bash
# Monitor service endpoints
kubectl get endpoints -w

# Monitor ingress
kubectl get ingress -w

# Check service logs
kubectl logs -l app=auth-service -f
```

### Network Tools
```bash
# tcpdump trong pods
kubectl exec -it <pod> -- tcpdump -i eth0

# netstat để check connections
kubectl exec -it <pod> -- netstat -tulpn

# Network connectivity tests
kubectl exec -it <pod> -- telnet service-name port
```

Networking là foundation của Kubernetes - hiểu rõ concepts này sẽ giúp debug issues và design architecture tốt hơn.