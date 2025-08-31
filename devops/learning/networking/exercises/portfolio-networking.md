# Exercise: Portfolio Network Architecture & Troubleshooting

## 🎯 Objective
Design, implement, và troubleshoot complete network architecture cho portfolio management system từ development đến production.

## 📋 Current Portfolio Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT SETUP                               │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Auth Service (Spring)                 │
│  Port: 3000          │  Port: 8082                             │
├──────────────────────┼─────────────────────────────────────────┤
│  User Service        │  Email Service                          │
│  Port: 8083         │  Port: 3002                             │
├─────────────────────────────────────────────────────────────────┤
│  MySQL Database + Flyway Migration                             │
│  Port: 3307                                                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🧪 Tasks

### Phase 1: Current Network Analysis

Analyze existing Docker Compose networking:

1. **Network Discovery:**
```bash
# Start portfolio services:
docker compose up -d

# Map current network architecture:
docker network ls
docker network inspect user-portfolio-management-master_portfolio-management-network

# Fill in network details:
Network name: ____
Subnet: ____
Gateway: ____
Driver: ____

# Document service IPs:
Service               Container IP      Host Port      Internal Port
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend              ____             ____           ____
Auth Service          ____             ____           ____  
User Service          ____             ____           ____
Email Service         ____             ____           ____
MySQL Database        ____             ____           ____
Flyway Migration      ____             N/A            ____
```

2. **Communication Matrix Testing:**
```bash
# Test inter-service communication:
# Frontend → Auth Service
curl -I http://localhost:3000
# Result: ____

# Frontend → User Service  
docker exec frontend curl -I http://user-service:8083
# Result: ____

# Auth Service → Database
docker exec auth-service mysql -h portfolio-db -u user -ppassword -e "SELECT 1"
# Result: ____

# User Service → Database
docker exec user-service mysql -h portfolio-db -u user -ppassword -e "SELECT 1"  
# Result: ____

# Auth Service → Email Service
docker exec auth-service curl -I http://email-service:8081
# Result: ____
```

### Phase 2: Network Security Analysis

Evaluate current security posture:

1. **Port Exposure Analysis:**
```bash
# Check exposed ports:
docker compose ps
nmap -p 1-65535 localhost

# Fill security analysis:
Service               Exposed to Host    Security Risk    Recommendation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend              ____              ____             ____
Auth Service          ____              ____             ____
User Service          ____              ____             ____
Email Service         ____              ____             ____
MySQL Database        ____              ____             ____
```

2. **Network Segmentation Design:**
```
Design improved network segmentation:

┌─────────────────────────────────────────────────────────────────┐
│                    IMPROVED ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│  PUBLIC NETWORK (DMZ)                                          │
│  ├── Load Balancer/Reverse Proxy                              │
│  └── Frontend (Static Files)                                   │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION NETWORK (Private)                                 │  
│  ├── Auth Service                                              │
│  ├── User Service                                              │
│  └── Email Service                                             │
├─────────────────────────────────────────────────────────────────┤
│  DATABASE NETWORK (Most Private)                               │
│  ├── MySQL Database                                            │
│  └── Migration Jobs                                            │
└─────────────────────────────────────────────────────────────────┘

Fill in your network design:
Network               CIDR Range        Purpose              Security Rules
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dmz-network           ____             ____                 ____
app-network           ____             ____                 ____  
db-network            ____             ____                 ____
```

### Phase 3: Load Balancer Implementation

Implement Nginx load balancer cho portfolio services:

1. **Create Nginx configuration:**
```nginx
# File: nginx/nginx.conf
upstream auth_service {
    server auth-service:8082 max_fails=3 fail_timeout=30s;
    # Add more auth instances for load balancing
}

upstream user_service {
    server user-service:8083 max_fails=3 fail_timeout=30s;
    # Add more user instances for load balancing  
}

upstream email_service {
    server email-service:8081 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name localhost;

    # Frontend static files
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Auth service API
    location /api/auth/ {
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Add health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }

    # User service API  
    location /api/user/ {
        proxy_pass http://user_service/;
        # Add similar proxy headers
    }

    # Email service API
    location /api/email/ {
        proxy_pass http://email_service/;
        # Add similar proxy headers
    }

    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

2. **Update Docker Compose với load balancer:**
```yaml
# Add to docker-compose.yml:
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl  # For HTTPS later
    depends_on:
      - frontend
      - auth-service
      - user-service
      - email-service
    networks:
      - portfolio-management-network

  # Scale services for load balancing
  auth-service-2:
    build: ./auth-service
    environment:
      # Same as auth-service
    networks:
      - portfolio-management-network
    # No exposed ports - only via load balancer
```

3. **Test load balancing:**
```bash
# Update Docker Compose và restart:
docker compose up -d

# Test load balancer:
curl -I http://localhost/api/auth/health
curl -I http://localhost/api/user/health  
curl -I http://localhost/api/email/health

# Results:
Auth via LB: ____
User via LB: ____
Email via LB: ____

# Test load distribution với multiple auth instances:
for i in {1..10}; do
  curl -s http://localhost/api/auth/health | grep -o "auth-service.*"
done

# Load distribution results: ____
```

### Phase 4: HTTPS/TLS Implementation

Implement SSL termination tại load balancer:

1. **Generate SSL certificates:**
```bash
# Create self-signed certificate for development:
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/portfolio.key \
  -out nginx/ssl/portfolio.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=portfolio.local"

# Certificate details:
openssl x509 -in nginx/ssl/portfolio.crt -text -noout | head -20

# Valid from: ____
# Valid until: ____
```

2. **Configure HTTPS trong Nginx:**
```nginx
# Add to nginx.conf:
server {
    listen 443 ssl http2;
    server_name portfolio.local;

    ssl_certificate /etc/nginx/ssl/portfolio.crt;
    ssl_certificate_key /etc/nginx/ssl/portfolio.key;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS header
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Same location blocks as HTTP server...
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name portfolio.local;
    return 301 https://$server_name$request_uri;
}
```

3. **Test HTTPS setup:**
```bash
# Add to /etc/hosts:
echo "127.0.0.1 portfolio.local" >> /etc/hosts

# Test HTTPS connection:
curl -k -I https://portfolio.local/api/auth/health

# HTTPS result: ____

# Test SSL certificate:
openssl s_client -connect portfolio.local:443 -servername portfolio.local

# SSL handshake successful? ____
```

### Phase 5: Network Monitoring Setup

Implement comprehensive network monitoring:

1. **Prometheus metrics collection:**
```yaml
# File: monitoring/docker-compose-monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - portfolio-management-network

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    networks:
      - portfolio-management-network

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter
    ports:
      - "9113:9113"
    command:
      - '-nginx.scrape-uri=http://nginx-lb/nginx_status'
    networks:
      - portfolio-management-network
```

2. **Configure metrics endpoints:**
```bash
# Add nginx status page:
# Add to nginx.conf:
location /nginx_status {
    stub_status on;
    access_log off;
    allow 172.16.0.0/12;  # Docker networks
    deny all;
}

# Start monitoring stack:
docker compose -f monitoring/docker-compose-monitoring.yml up -d

# Check Prometheus targets:
curl http://localhost:9090/targets

# Are all targets healthy? ____
```

3. **Network performance testing:**
```bash
# Install iperf trong services for bandwidth testing:
docker exec auth-service apt update && apt install iperf3 -y
docker exec user-service apt update && apt install iperf3 -y

# Test inter-service bandwidth:
docker exec -d user-service iperf3 -s
docker exec auth-service iperf3 -c user-service -t 30

# Bandwidth results:
Internal bandwidth: ____Mbps
Latency: ____ms
Packet loss: ____%
```

### Phase 6: Kubernetes Migration Planning

Plan network architecture for K8s migration:

1. **K8s networking design:**
```yaml
# File: k8s-network-plan.yaml
# Network Policies for segmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-policy
  namespace: portfolio
spec:
  podSelector:
    matchLabels:
      tier: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 8082
    - protocol: TCP  
      port: 8083

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: portfolio
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
  - from:
    - podSelector:
        matchLabels:
          tier: backend
  egress:
  - to:
    - podSelector:
        matchLabels:
          tier: database
    ports:
    - protocol: TCP
      port: 3306
```

2. **Service mesh consideration:**
```
Evaluate service mesh benefits:

Feature                Without Service Mesh    With Service Mesh (Istio)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Traffic Management     ____                   ____
Security (mTLS)        ____                   ____  
Observability          ____                   ____
Load Balancing         ____                   ____
Circuit Breaking       ____                   ____
Complexity             ____                   ____

Recommendation for portfolio project: ____
Reasoning: ____
```

### Phase 7: Production Network Hardening

Implement production security measures:

1. **Firewall configuration:**
```bash
# If using iptables for additional security:
# Allow only necessary ports
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 10.0.0.0/8 -j ACCEPT  # SSH from internal only

# Block direct access to application ports
iptables -A INPUT -p tcp --dport 8082 -j DROP
iptables -A INPUT -p tcp --dport 8083 -j DROP
iptables -A INPUT -p tcp --dport 3002 -j DROP
iptables -A INPUT -p tcp --dport 3307 -j DROP

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Test firewall rules:
nmap -p 1-10000 localhost

# Which ports are accessible after hardening? ____
```

2. **Rate limiting implementation:**
```nginx
# Add to nginx.conf:
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    
    server {
        # Apply rate limiting
        location /api/auth/ {
            limit_req zone=auth burst=20 nodelay;
            # ... rest of config
        }
        
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            # ... rest of config  
        }
    }
}
```

3. **Test rate limiting:**
```bash
# Test rate limiting với rapid requests:
for i in {1..50}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/auth/health
done

# How many requests succeed vs rate limited?
Success: ____
Rate limited (429): ____
```

### Phase 8: Disaster Recovery Testing

Test network resilience và recovery procedures:

1. **Service failure scenarios:**
```bash
# Scenario A: Auth service failure
docker compose stop auth-service

# Test system behavior:
curl -I http://localhost/api/auth/health
# Result: ____

# Does load balancer handle gracefully? ____

# Scenario B: Database connection loss
docker compose stop portfolio-db

# Test application behavior:
curl -I http://localhost/api/user/health
# Result: ____

# How long until timeout? ____

# Restart services:
docker compose start auth-service portfolio-db
```

2. **Load balancer failure:**
```bash
# Stop nginx load balancer:
docker compose stop nginx-lb

# Can services still be accessed directly?
curl -I http://localhost:3000  # Direct frontend access
# Result: ____

# Recovery time measurement:
time docker compose start nginx-lb
# Recovery time: ____
```

## 🎯 Success Criteria

- [ ] Analyzed current network architecture completely
- [ ] Implemented secure network segmentation
- [ ] Setup load balancing với health checks
- [ ] Configured HTTPS/TLS termination
- [ ] Implemented network monitoring và metrics
- [ ] Planned Kubernetes network migration
- [ ] Applied production security hardening
- [ ] Tested disaster recovery scenarios

## 📝 Network Architecture Summary

Document your final network design:

```
Layer                 Component           Configuration        Security
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Load Balancer        ____               ____                 ____
Application Layer    ____               ____                 ____
Database Layer       ____               ____                 ____
Network Policies     ____               ____                 ____
SSL/TLS             ____               ____                 ____
```

## 📝 Performance Benchmarks

Record your performance results:

```
Metric                Before LB          With LB             Improvement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response Time         ____ms            ____ms              ____%
Throughput           ____rps           ____rps             ____%
Concurrent Users     ____              ____                ____%
SSL Handshake        N/A               ____ms              New
```

## 📝 Security Assessment

```
Security Control        Status      Risk Level      Mitigation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Port Exposure          ____        ____           ____
Network Segmentation   ____        ____           ____
SSL/TLS                ____        ____           ____
Rate Limiting          ____        ____           ____
Firewall Rules         ____        ____           ____
```

## 📝 Lessons Learned

1. **Network design insights:**
   ____

2. **Load balancing lessons:**
   ____

3. **Security considerations:**
   ____

4. **Production readiness:**
   ____

## 🚀 Next Steps

Recommended improvements for production:
1. ____
2. ____
3. ____