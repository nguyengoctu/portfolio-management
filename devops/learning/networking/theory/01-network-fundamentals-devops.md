# Network Fundamentals for DevOps

## 🎯 Mục tiêu học Network cho DevOps

**Bạn KHÔNG cần:**
- Bấm cáp mạng, cấu hình switch/router vật lý
- Học sâu về hardware networking
- Trở thành network engineer

**Bạn CẦN hiểu:**
- Cách applications communicate qua network
- Debug network issues trong containers/K8s
- Setup load balancers, reverse proxies
- DNS, firewalls, và security
- Performance optimization

---

## 1. OSI Model - Hiểu để Debug Network Issues

### 🏢 OSI Model như một Tòa Nhà 7 Tầng

```
┌─────────────────────────────────────┐
│ 7. Application  │ HTTP, DNS, SSH    │ ← DevOps quan tâm nhất
├─────────────────┼───────────────────┤
│ 6. Presentation │ SSL/TLS, JSON     │ ← Security, data format
├─────────────────┼───────────────────┤  
│ 5. Session      │ TCP Sessions      │ ← Connection management
├─────────────────┼───────────────────┤
│ 4. Transport    │ TCP, UDP          │ ← Port numbers, protocols
├─────────────────┼───────────────────┤
│ 3. Network      │ IP, Routing       │ ← IP addresses, subnets
├─────────────────┼───────────────────┤
│ 2. Data Link    │ Ethernet, WiFi    │ ← Ít quan tâm trong cloud
├─────────────────┼───────────────────┤
│ 1. Physical     │ Cables, Signals   │ ← AWS/GCP lo
└─────────────────────────────────────┘
```

### DevOps Debug Strategy theo OSI:

**Khi có network issue, debug từ trên xuống:**

```bash
# Layer 7 (Application): Service có chạy không?
curl -I http://auth-service:8082/health

# Layer 4 (Transport): Port có open không?  
telnet auth-service 8082
nmap -p 8082 auth-service

# Layer 3 (Network): IP có reach được không?
ping auth-service
traceroute auth-service

# Layer 2/1 (Physical): Interface up không?
ip link show
```

---

## 2. TCP/IP Stack - Cơ sở của Internet

### 🚚 TCP như Dịch Vụ Chuyển Hàng Đáng Tin Cậy

**TCP (Transmission Control Protocol):**
```
Client                           Server
  │                                │
  ├─── SYN (Muốn kết nối) ────────→│
  │←── SYN-ACK (OK, tôi sẵn sàng) ──┤
  ├─── ACK (Bắt đầu gửi data) ────→│
  │                                │
  ├─── Data packet 1 ─────────────→│
  │←── ACK (Đã nhận packet 1) ─────┤
  ├─── Data packet 2 ─────────────→│
  │←── ACK (Đã nhận packet 2) ─────┤
```

**Đặc điểm TCP:**
- **Reliable**: Đảm bảo data đến nơi (có retry)
- **Ordered**: Data đến đúng thứ tự
- **Connection-based**: Phải establish connection trước
- **Slower**: Overhead của reliability

**UDP (User Datagram Protocol):**
```
Client                Server
  │                     │
  ├── Data packet ─────→│  (Fire and forget)
  ├── Data packet ─────→│
  ├── Data packet ─────→│
```

**Đặc điểm UDP:**
- **Fast**: Không overhead
- **Unreliable**: Có thể mất packets
- **Connectionless**: Gửi luôn, không cần setup

### Khi nào dùng gì?

```
Protocol    Use Case                          Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TCP         Web services, APIs, databases     HTTP, HTTPS, SSH, MySQL
UDP         DNS lookups, video streaming      DNS, DHCP, video calls
```

---

## 3. IP Addressing & Subnets - Địa Chỉ Internet

### 🏠 IP Address như Địa Chỉ Nhà

**IPv4 Format:**
```
192.168.1.100
 │    │  │ │
 │    │  │ └── Host ID (máy cụ thể)
 │    │  └──── Subnet ID  
 │    └─────── Network ID
 └──────────── Class (192.168.x.x = private)
```

### Subnet Mask - Phân Chia Mạng

**CIDR Notation:**
```
192.168.1.0/24
            └── 24 bits đầu là network, 8 bits cuối là host

24 bits network = 255.255.255.0
Có thể có: 256 hosts (192.168.1.0 - 192.168.1.255)
```

**Common Subnets trong DevOps:**
```
Network              CIDR        Hosts    Use Case
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10.0.0.0/8          10.x.x.x    16M      Large cloud networks
172.16.0.0/12       172.16-31.x.x 1M     Docker default
192.168.0.0/16      192.168.x.x  65K     Home networks
```

### Private vs Public IPs

```
Type        Range                    Use
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Private     10.0.0.0/8              Internal networks
Private     172.16.0.0/12           Docker containers  
Private     192.168.0.0/16          Local networks
Public      Everything else         Internet-facing
```

**DevOps Reality Check:**
```bash
# Container networks trong Docker:
docker network ls
# bridge    172.17.0.0/16
# custom    172.18.0.0/16

# Kubernetes pod networks:
kubectl get pods -o wide
# Pod IPs: 10.244.x.x/16 (thường)

# AWS VPC networks:  
# VPC: 10.0.0.0/16
# Public subnet: 10.0.1.0/24
# Private subnet: 10.0.2.0/24
```

---

## 4. DNS - Hệ Thống Tên Miền

### 🗂️ DNS như Danh Bạ Điện Thoại của Internet

**DNS Resolution Process:**
```
1. Browser: "auth-service.portfolio.svc.cluster.local là IP gì?"
2. Local DNS cache: "Không biết, hỏi DNS server"
3. DNS Server: "Đó là 10.244.1.15"
4. Browser: "OK, connect tới 10.244.1.15"
```

### DNS Record Types quan trọng cho DevOps:

```
Type    Purpose                     Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A       Domain → IPv4               example.com → 1.2.3.4
AAAA    Domain → IPv6               example.com → 2001:db8::1
CNAME   Alias                       www.example.com → example.com
MX      Mail server                 example.com → mail.example.com
TXT     Text data                   SPF, DKIM, domain verification
SRV     Service discovery           _http._tcp.example.com
```

### DNS trong Container Environments:

**Docker DNS:**
```bash
# Container tự động resolve tên containers khác
docker run --name web nginx
docker run --name api node
# Trong api container: curl http://web → works!
```

**Kubernetes DNS:**
```bash
# Service DNS pattern:
service-name.namespace.svc.cluster.local

# Examples:
auth-service.default.svc.cluster.local
mysql.database.svc.cluster.local
```

### DNS Troubleshooting:

```bash
# Test DNS resolution:
nslookup auth-service
dig auth-service
host auth-service

# Check DNS servers being used:
cat /etc/resolv.conf

# Test specific DNS server:
nslookup auth-service 8.8.8.8
```

---

## 5. Load Balancing - Phân Tán Traffic

### ⚖️ Load Balancer như Nhân Viên Điều Hướng

**Load Balancing Algorithms:**

1. **Round Robin** - Lần lượt từng server:
```
Request 1 → Server A
Request 2 → Server B  
Request 3 → Server C
Request 4 → Server A (lặp lại)
```

2. **Least Connections** - Server ít connection nhất:
```
Server A: 5 connections
Server B: 3 connections ← Chọn server này
Server C: 7 connections
```

3. **IP Hash** - Dựa trên client IP:
```
hash(client_ip) % num_servers
Client 192.168.1.100 → luôn đi Server A
Client 192.168.1.101 → luôn đi Server B
```

### Load Balancer Types:

**Layer 4 (Transport Layer) Load Balancer:**
```
- Chỉ nhìn IP address và port
- Nhanh, hiệu suất cao
- Không hiểu HTTP content
- Example: AWS NLB, HAProxy TCP mode
```

**Layer 7 (Application Layer) Load Balancer:**
```
- Hiểu HTTP headers, URLs, cookies
- Có thể route dựa trên path:
  /api/auth/* → Auth service
  /api/user/* → User service  
- Example: Nginx, AWS ALB, Traefik
```

### Health Checks trong Load Balancing:

```yaml
# Nginx upstream config
upstream auth_service {
    server 10.244.1.15:8082 max_fails=3 fail_timeout=30s;
    server 10.244.1.16:8082 max_fails=3 fail_timeout=30s;
    server 10.244.1.17:8082 max_fails=3 fail_timeout=30s;
}

server {
    location /api/auth/ {
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. HTTP/HTTPS - Web Protocol Fundamentals

### 📨 HTTP Request/Response Cycle

**HTTP Request Structure:**
```
GET /api/auth/login HTTP/1.1
Host: auth-service:8082
Content-Type: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9
User-Agent: curl/7.68.0
Accept: */*

{
  "username": "admin",
  "password": "password123"
}
```

**HTTP Response Structure:**
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 156
Set-Cookie: session_id=abc123; Path=/; HttpOnly
Cache-Control: no-cache

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9",
  "expires_in": 3600,
  "user_id": 123
}
```

### HTTP Status Codes cho DevOps:

```
Code    Meaning                 DevOps Action
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
200     OK                      All good
301     Moved Permanently       Update URLs/redirects
400     Bad Request            Check API payload  
401     Unauthorized           Check authentication
403     Forbidden              Check permissions
404     Not Found              Check routes/endpoints
429     Too Many Requests      Check rate limiting
500     Internal Server Error   Check application logs
502     Bad Gateway            Check upstream services
503     Service Unavailable    Check service health
504     Gateway Timeout        Check network/timeouts
```

### HTTPS/TLS - Security Layer

**TLS Handshake Process:**
```
Client                          Server
  │                               │
  ├─── Client Hello ─────────────→│ (Supported ciphers)
  │←── Server Hello ─────────────┤ (Selected cipher, Certificate)
  ├─── Certificate Verify ──────→│ (Check cert validity)  
  ├─── Key Exchange ────────────→│ (Encrypted session key)
  │←── Finished ─────────────────┤ (Ready for encrypted data)
  ├─── Encrypted HTTP Request ──→│
  │←── Encrypted HTTP Response ──┤
```

**TLS Certificate Chain:**
```
Root CA (VeriSign, Let's Encrypt)
    │
Intermediate CA  
    │
Your Certificate (*.example.com)
```

### Common HTTPS Issues trong DevOps:

```bash
# Certificate expiration check:
openssl x509 -in cert.pem -text -noout | grep "Not After"

# Test TLS connection:
openssl s_client -connect example.com:443

# Check certificate chain:
curl -I https://example.com
```

---

## 7. Firewalls & Security Groups

### 🛡️ Network Security Layers

**Firewall Types:**
1. **Network Firewall**: Filter traffic giữa networks
2. **Host Firewall**: Filter traffic đến/từ specific server
3. **Application Firewall**: Filter based on application logic

### Iptables - Linux Firewall:

**Basic iptables concepts:**
```bash
# Allow incoming HTTP traffic:
iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow incoming HTTPS traffic:
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow SSH from specific IP:
iptables -A INPUT -p tcp -s 192.168.1.100 --dport 22 -j ACCEPT

# Block all other incoming traffic:
iptables -A INPUT -j DROP

# Allow outgoing traffic:
iptables -A OUTPUT -j ACCEPT
```

### Cloud Security Groups:

**AWS Security Group Example:**
```
Type        Protocol    Port Range    Source
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP        TCP         80            0.0.0.0/0
HTTPS       TCP         443           0.0.0.0/0  
SSH         TCP         22            10.0.0.0/16
MySQL       TCP         3306          10.0.1.0/24
Custom      TCP         8082          sg-auth-lb
```

---

## 8. Network Performance & Monitoring

### 📊 Network Metrics quan trọng:

```
Metric              Good        Warning     Critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Latency             < 50ms      50-200ms    > 200ms
Throughput          > 100Mbps   10-100Mbps  < 10Mbps  
Packet Loss         < 0.1%      0.1-1%      > 1%
Connection Errors   < 1%        1-5%        > 5%
```

### Network Troubleshooting Tools:

```bash
# Basic connectivity:
ping google.com
telnet google.com 80

# Route tracing:
traceroute google.com
mtr google.com

# Port scanning:
nmap -p 22,80,443 target-server

# Bandwidth testing:
iperf3 -c target-server

# DNS testing:
dig @8.8.8.8 example.com
nslookup example.com

# Network statistics:
netstat -tulpn
ss -tulpn

# Traffic monitoring:
tcpdump -i eth0 port 80
wireshark (GUI)
```

---

## 9. Container Networking

### 🐳 Docker Networking Models:

**Bridge Network (Default):**
```
Host (192.168.1.100)
├── docker0 bridge (172.17.0.1)
│   ├── Container A (172.17.0.2)
│   ├── Container B (172.17.0.3)
│   └── Container C (172.17.0.4)
```

**Host Network:**
```bash
docker run --network host nginx
# Container sử dụng direct host network stack
# No network isolation
```

**Custom Networks:**
```bash
# Create custom network:
docker network create --driver bridge portfolio-network

# Connect containers:
docker run --network portfolio-network --name auth auth-service
docker run --network portfolio-network --name user user-service

# Containers có thể communicate bằng name:
# auth container: curl http://user:8083
```

### Docker Network Commands:

```bash
# List networks:
docker network ls

# Inspect network:
docker network inspect bridge

# Create network:
docker network create my-network

# Connect running container:
docker network connect my-network container-name

# Check container networks:
docker inspect container-name | grep NetworkMode
```

---

## 10. Kubernetes Networking

### ☸️ K8s Network Model:

```
┌─────────────────────────────────────────────────────────┐
│                    Cluster Network                      │
├─────────────────────────────────────────────────────────┤
│  Node 1                    │  Node 2                    │
│  ├── Pod A (10.244.1.2)    │  ├── Pod C (10.244.2.2)   │
│  ├── Pod B (10.244.1.3)    │  └── Pod D (10.244.2.3)   │
│  └── kube-proxy            │     kube-proxy             │
├─────────────────────────────────────────────────────────┤
│            Service Network (ClusterIP: 10.96.x.x)       │
│  auth-service: 10.96.1.100 → Pod A, Pod B              │
│  user-service: 10.96.1.101 → Pod C, Pod D              │
└─────────────────────────────────────────────────────────┘
```

**K8s Networking Rules:**
1. All pods có thể communicate với all pods (no NAT)
2. Agents trên node có thể communicate với all pods trên node đó
3. Pods trong host network có thể communicate với all nodes

### Service Types và Network:

```yaml
# ClusterIP - Internal only
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  type: ClusterIP
  selector:
    app: auth
  ports:
  - port: 80
    targetPort: 8082

# NodePort - External access via node IP
apiVersion: v1
kind: Service  
metadata:
  name: auth-nodeport
spec:
  type: NodePort
  selector:
    app: auth
  ports:
  - port: 80
    targetPort: 8082
    nodePort: 30080  # Access via <node-ip>:30080

# LoadBalancer - Cloud load balancer
apiVersion: v1
kind: Service
metadata:
  name: auth-lb
spec:
  type: LoadBalancer
  selector:
    app: auth
  ports:
  - port: 80
    targetPort: 8082
```

---

## 11. DevOps Network Troubleshooting Workflow

### 🔍 Systematic Network Debugging:

**Step 1: Define the Problem**
```
- What is not working?
- When did it start?
- What changed recently?
- Is it affecting all users or specific ones?
```

**Step 2: Layer-by-layer Testing**
```bash
# Layer 1-2: Physical/Data Link
ip link show                    # Interface up?
ethtool eth0                   # Link speed, duplex

# Layer 3: Network  
ping 8.8.8.8                   # Internet connectivity
ping internal-server           # Internal connectivity  
ip route show                  # Routing table

# Layer 4: Transport
telnet server 80              # Port accessibility
nmap -p 80,443 server         # Port scanning

# Layer 7: Application
curl -I http://server/health   # HTTP response
```

**Step 3: Check Logs**
```bash
# System logs:
journalctl -u nginx
tail -f /var/log/nginx/error.log

# Container logs:
docker logs container-name
kubectl logs pod-name

# Network interface logs:
dmesg | grep eth0
```

**Step 4: Performance Analysis**
```bash
# Bandwidth:
iperf3 -c target-server

# Latency:
ping -c 100 server | tail -1

# Packet capture:
tcpdump -i eth0 -w capture.pcap
# Analyze with Wireshark
```

---

## 12. Production Network Best Practices

### ✅ Network Security Checklist:

1. **Principle of Least Privilege**
```bash
# Only open necessary ports:
# Web servers: 80, 443
# SSH: 22 (from bastion only)  
# Databases: 3306/5432 (from app servers only)
```

2. **Network Segmentation**
```
DMZ Network (Public)
├── Load Balancers
└── Web Servers

Application Network (Private)  
├── API Servers
└── Application Servers

Database Network (Most Private)
├── Primary Databases  
└── Cache Servers
```

3. **Monitoring & Alerting**
```bash
# Monitor these metrics:
- Connection counts
- Error rates  
- Response times
- Bandwidth usage
- Failed authentication attempts
```

4. **Documentation**
```
- Network diagrams
- Port mappings
- Firewall rules
- DNS records
- IP address assignments
```

---

## 🧪 **HANDS-ON EXERCISES**

Ready to practice? Mỗi phần lý thuyết trên có corresponding exercises:

**[Network Lab 01: Basic Connectivity](../labs/lab01-basic-connectivity.md)**
- OSI layer debugging
- TCP vs UDP testing
- Basic network commands

**[Network Lab 02: DNS & Service Discovery](../labs/lab02-dns-service-discovery.md)**
- DNS resolution testing
- Container name resolution
- K8s service discovery

**[Network Lab 03: Load Balancing](../labs/lab03-load-balancing.md)**
- Nginx load balancer setup
- Health check configuration
- Traffic distribution testing

**[Network Exercise: Portfolio Networking](../exercises/portfolio-networking.md)**
- Network troubleshooting cho portfolio services
- Performance optimization
- Security hardening

---

## 🎯 Learning Roadmap

### Week 1: Fundamentals
- [ ] OSI Model concepts
- [ ] TCP/IP basics  
- [ ] DNS resolution
- [ ] Basic troubleshooting commands

### Week 2: Container Networking
- [ ] Docker networking
- [ ] Bridge vs Host networking
- [ ] Container communication

### Week 3: Kubernetes Networking  
- [ ] Pod networking
- [ ] Services và Ingress
- [ ] Network policies

### Week 4: Production Skills
- [ ] Load balancing
- [ ] Security groups/firewalls
- [ ] Performance monitoring
- [ ] Troubleshooting workflows

**Remember**: Network knowledge builds up over time. Start with basics, practice với real scenarios, and gradually build complexity!