# Network Lab 01: Basic Connectivity & OSI Debugging

## 🎯 Objective
Master cơ bản network connectivity và OSI layer debugging với portfolio services.

## 📋 Prerequisites
- Docker và Docker Compose installed
- Portfolio project services
- Basic Linux command knowledge

## 🧪 Tasks

### Task 1: OSI Layer Analysis - Portfolio Services

Deploy portfolio stack và analyze network layers:

1. **Start portfolio services:**
```bash
# Navigate to project root:
cd /home/ngoctu/projects/devops/user-portfolio-management-master

# Start services:
docker compose up -d

# Check services are running:
docker compose ps

# Fill in running services:
Service         Status      Port Mapping
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend        ____        ____
Auth-service    ____        ____
User-service    ____        ____
Email-service   ____        ____
MySQL           ____        ____
```

2. **Layer 7 (Application) Testing:**
```bash
# Test HTTP endpoints:
curl -I http://localhost:3000                    # Frontend
curl -I http://localhost:8082/actuator/health    # Auth service
curl -I http://localhost:8083/actuator/health    # User service
curl -I http://localhost:3002                    # Email service

# Results:
Frontend response: ____
Auth service response: ____
User service response: ____
Email service response: ____
```

3. **Layer 4 (Transport) Testing:**
```bash
# Test TCP connections:
telnet localhost 3000
telnet localhost 8082
telnet localhost 8083
telnet localhost 3002

# Test port scanning:
nmap -p 3000,8082,8083,3002,3307 localhost

# Which ports are open? ____
# Which ports are filtered/closed? ____
```

4. **Layer 3 (Network) Testing:**
```bash
# Test container IPs:
docker inspect auth-service | grep IPAddress
docker inspect user-service | grep IPAddress
docker inspect email-service | grep IPAddress

# Container IPs:
Auth service IP: ____
User service IP: ____  
Email service IP: ____

# Test direct IP connectivity:
curl -I http://<auth-ip>:8082/actuator/health
curl -I http://<user-ip>:8083/actuator/health
```

### Task 2: TCP vs UDP Understanding

Demonstrate difference between TCP và UDP:

1. **HTTP over TCP (Reliable):**
```bash
# Start packet capture:
sudo tcpdump -i lo port 8082 -w tcp-capture.pcap &

# Make HTTP request:
curl -v http://localhost:8082/actuator/health

# Stop packet capture:
sudo pkill tcpdump

# Analyze capture (if wireshark available):
# Look for: SYN, SYN-ACK, ACK, HTTP request/response, FIN
```

2. **DNS over UDP (Fast):**
```bash
# Start packet capture for DNS:
sudo tcpdump -i any port 53 -w dns-capture.pcap &

# Make DNS query:
nslookup google.com
dig google.com

# Stop capture:
sudo pkill tcpdump

# What differences do you see between TCP và UDP traffic?
Answer: ____
```

### Task 3: Container Network Discovery

Explore Docker container networking:

1. **Docker network inspection:**
```bash
# List Docker networks:
docker network ls

# Inspect default bridge network:
docker network inspect bridge

# What's the bridge network subnet? ____
# What's the gateway IP? ____

# Check portfolio network:
docker network inspect user-portfolio-management-master_portfolio-management-network

# Portfolio network subnet: ____
```

2. **Container-to-container communication:**
```bash
# Get into auth-service container:
docker exec -it auth-service /bin/bash

# From inside auth container, test connectivity:
# (Install curl if not available: apt update && apt install curl -y)

# Test internal communication:
curl http://user-service:8083/actuator/health     # By service name
curl http://email-service:8081                     # By service name  
curl http://portfolio-db:3306                      # Database connection

# Results:
Auth -> User: ____
Auth -> Email: ____
Auth -> Database: ____
```

3. **DNS resolution trong containers:**
```bash
# Still trong auth-service container:
nslookup user-service
nslookup email-service
nslookup portfolio-db

# What IPs are resolved?
user-service IP: ____
email-service IP: ____
portfolio-db IP: ____

# Check /etc/hosts trong container:
cat /etc/hosts

# Check /etc/resolv.conf:
cat /etc/resolv.conf

# What DNS servers are configured? ____
```

### Task 4: Network Troubleshooting Scenarios

Practice common network debugging:

1. **Scenario A: Service Down**
```bash
# Stop user-service:
docker compose stop user-service

# Try to access from auth-service:
docker exec -it auth-service curl http://user-service:8083/actuator/health

# What error do you get? ____

# Debug the issue:
docker exec -it auth-service nslookup user-service
# DNS resolution works? ____

docker exec -it auth-service telnet user-service 8083
# Port connectivity? ____

# Restart service and test:
docker compose start user-service
docker exec -it auth-service curl http://user-service:8083/actuator/health
# Works now? ____
```

2. **Scenario B: Port Mismatch**
```bash
# Try wrong port:
docker exec -it auth-service curl http://user-service:9999/actuator/health

# Error message: ____

# Use telnet to confirm port issue:
docker exec -it auth-service telnet user-service 9999
# What happens? ____

docker exec -it auth-service telnet user-service 8083  
# What about correct port? ____
```

3. **Scenario C: Network Isolation**
```bash
# Create isolated network:
docker network create isolated-network

# Run container trong isolated network:
docker run -d --name isolated-service --network isolated-network nginx

# Try to access từ auth-service:
docker exec -it auth-service curl http://isolated-service

# Error: ____
# Why can't auth-service reach isolated-service?
Answer: ____

# Connect auth-service to isolated network:
docker network connect isolated-network auth-service

# Try again:
docker exec -it auth-service curl http://isolated-service

# Works now? ____
```

### Task 5: Performance Testing

Test network performance between services:

1. **Latency testing:**
```bash
# Test ping between containers:
docker exec -it auth-service ping -c 10 user-service

# Average latency: ____ms

# Test ping to external service:
docker exec -it auth-service ping -c 10 google.com

# External latency: ____ms
# Why is external latency higher? ____
```

2. **Throughput testing (if iperf available):**
```bash
# Install iperf trong containers (or use existing if available):
docker exec -it auth-service apt update && apt install iperf3 -y
docker exec -it user-service apt update && apt install iperf3 -y

# Start iperf server trong user-service:
docker exec -d user-service iperf3 -s

# Test throughput từ auth-service:
docker exec -it auth-service iperf3 -c user-service -t 10

# Throughput results: ____
```

### Task 6: Security Testing

Test basic network security:

1. **Port accessibility testing:**
```bash
# From outside Docker host:
nmap -p 1-65535 localhost

# Which ports are accessible từ outside?
Open ports: ____

# From inside container network:
docker exec -it auth-service nmap -p 1-10000 user-service

# Which ports are accessible internally?
Internal ports: ____
```

2. **Service exposure analysis:**
```bash
# Check what services are exposed:
docker compose ps

# Which services expose ports to host?
Exposed services: ____

# Why is database port 3307 exposed but application ports vary?
Answer: ____
```

### Task 7: Network Monitoring

Set up basic network monitoring:

1. **Connection monitoring:**
```bash
# Monitor active connections trong auth-service:
docker exec -it auth-service netstat -tulpn

# What connections are active?
Active connections: ____

# Monitor connections continuously:
docker exec -it auth-service watch -n 1 'netstat -tulpn'
# (Run this trong background while making requests)
```

2. **Traffic monitoring:**
```bash
# Monitor network traffic:
docker exec -it auth-service apt update && apt install iftop -y
docker exec -it auth-service iftop -i eth0

# What traffic do you see?
Traffic patterns: ____
```

### Task 8: Network Configuration

Understand và modify network settings:

1. **Container network configuration:**
```bash
# Check container network settings:
docker exec -it auth-service ip addr show
docker exec -it auth-service ip route show

# Container IP: ____
# Default gateway: ____
# Network interface: ____
```

2. **Host network vs Bridge network:**
```bash
# Run container với host networking:
docker run -d --name host-test --network host nginx

# Check what ports are now accessible:
netstat -tulpn | grep :80

# Is nginx accessible on port 80? ____

# Clean up:
docker stop host-test && docker rm host-test
```

## 🎯 Success Criteria

- [ ] Successfully analyzed all OSI layers for portfolio services
- [ ] Understood TCP vs UDP differences với examples
- [ ] Explored container networking và DNS resolution
- [ ] Debugged common network connectivity issues
- [ ] Tested network performance between services
- [ ] Analyzed network security exposure
- [ ] Set up basic network monitoring

## 📝 Network Discovery Summary

Fill in your network discovery results:

```
Component           IP Address      Port      Protocol    Accessible From
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend            ____           ____      ____        ____
Auth-service        ____           ____      ____        ____
User-service        ____           ____      ____        ____
Email-service       ____           ____      ____        ____
Database            ____           ____      ____        ____
```

## 📝 Key Insights

1. **Container communication:**
   - Containers communicate via: ____
   - DNS resolution provided by: ____
   - Network isolation achieved through: ____

2. **Common issues encountered:**
   - Service down symptoms: ____
   - Port mismatch symptoms: ____
   - Network isolation symptoms: ____

3. **Performance characteristics:**
   - Internal latency: ____ms
   - External latency: ____ms
   - Throughput: ____

## 🚀 Next Lab
Proceed to **Lab 02: DNS & Service Discovery** (`networking/labs/lab02-dns-service-discovery.md`)