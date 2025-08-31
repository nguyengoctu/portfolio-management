# Network Learning Path for DevOps

## 🎯 Mục tiêu

Học network fundamentals cần thiết cho DevOps - **KHÔNG phải để bấm cáp mạng**, mà để:
- Debug network issues trong containers/K8s
- Setup load balancers, reverse proxies  
- Hiểu DNS, firewalls, security
- Optimize network performance
- Troubleshoot production issues

## 📁 Cấu trúc học tập

```
networking/
├── theory/
│   └── 01-network-fundamentals-devops.md    # Lý thuyết từ OSI đến K8s networking
├── labs/
│   ├── lab01-basic-connectivity.md          # OSI debugging, TCP/UDP, container networking
│   └── lab02-dns-service-discovery.md       # DNS trong Docker/K8s, troubleshooting
├── exercises/
│   └── portfolio-networking.md              # Full project: network architecture & hardening
└── tools/                                   # Network tools và utilities
```

## 🛣️ Learning Roadmap

### Phase 1: Network Fundamentals (Week 1)
**Goal**: Hiểu cách network hoạt động và debug cơ bản

1. **[Theory: Network Fundamentals](theory/01-network-fundamentals-devops.md)**
   - OSI Model cho DevOps debugging
   - TCP/IP stack essentials  
   - IP addressing và subnets
   - DNS resolution process

2. **[Lab 01: Basic Connectivity](labs/lab01-basic-connectivity.md)**
   - OSI layer debugging với portfolio services
   - TCP vs UDP testing
   - Container networking exploration
   - Performance testing

**Success Metrics:**
- [ ] Debug network issues theo OSI layers
- [ ] Hiểu TCP vs UDP use cases
- [ ] Test connectivity giữa containers
- [ ] Measure network performance

### Phase 2: Service Discovery & DNS (Week 2)  
**Goal**: Master DNS và service discovery patterns

1. **[Lab 02: DNS & Service Discovery](labs/lab02-dns-service-discovery.md)**
   - Docker DNS deep dive
   - Kubernetes DNS patterns
   - External DNS integration
   - DNS troubleshooting

**Success Metrics:**
- [ ] Configure DNS trong Docker/K8s
- [ ] Implement service discovery patterns
- [ ] Troubleshoot DNS issues
- [ ] Optimize DNS performance

### Phase 3: Production Architecture (Week 3-4)
**Goal**: Design và implement production-ready network

1. **[Exercise: Portfolio Networking](exercises/portfolio-networking.md)**
   - Complete network architecture design
   - Load balancer implementation
   - HTTPS/TLS setup
   - Security hardening
   - Monitoring và alerting
   - Disaster recovery testing

**Success Metrics:**
- [ ] Design secure network architecture
- [ ] Implement load balancing với health checks
- [ ] Configure SSL termination
- [ ] Apply network security best practices
- [ ] Setup network monitoring
- [ ] Test disaster recovery scenarios

## 🎯 DevOps Network Skills Map

### Level 1: Beginner (After Phase 1)
```
✅ Understand OSI model for troubleshooting
✅ Debug basic connectivity issues  
✅ Configure container networking
✅ Use network troubleshooting tools (ping, telnet, curl)
```

### Level 2: Intermediate (After Phase 2)
```  
✅ Master DNS resolution và service discovery
✅ Configure load balancers và reverse proxies
✅ Implement basic network security
✅ Monitor network performance
```

### Level 3: Advanced (After Phase 3)
```
✅ Design production network architectures
✅ Implement network segmentation và security
✅ Setup SSL/TLS termination  
✅ Configure network policies trong K8s
✅ Handle network disasters và recovery
```

## 🛠️ Essential Network Tools

### Debug Commands
```bash
# Connectivity testing
ping <target>
telnet <host> <port>
curl -I <url>

# DNS testing  
nslookup <domain>
dig <domain>
host <domain>

# Network analysis
netstat -tulpn
ss -tulpn  
nmap -p <ports> <target>

# Performance testing
iperf3 -c <server>
mtr <target>
traceroute <target>
```

### Container/K8s Tools
```bash
# Docker networking
docker network ls
docker network inspect <network>
docker exec <container> <command>

# Kubernetes networking
kubectl get services
kubectl get endpoints  
kubectl describe pod <pod>
kubectl exec -it <pod> -- <command>
```

### Monitoring Tools
```bash
# Traffic monitoring
tcpdump -i <interface> <filter>
wireshark (GUI)
iftop -i <interface>

# Performance monitoring  
iostat, vmstat, sar
prometheus + grafana (metrics)
```

## 🔧 Practical Focus Areas

### 1. **Container Networking**
- Docker bridge vs host networking
- Inter-container communication  
- Network isolation và security
- Custom Docker networks

### 2. **Kubernetes Networking**
- Pod-to-pod communication
- Services (ClusterIP, NodePort, LoadBalancer)
- Ingress controllers
- Network policies

### 3. **Load Balancing**  
- Layer 4 vs Layer 7 load balancing
- Health checks và failover
- Session affinity
- SSL termination

### 4. **Security**
- Network segmentation
- Firewalls và security groups
- SSL/TLS configuration
- Rate limiting

### 5. **Monitoring**
- Network metrics collection
- Performance monitoring
- Alerting setup
- Troubleshooting workflows

## ⚠️ Common Pitfalls

1. **Over-engineering**: Start simple, add complexity gradually
2. **Ignoring security**: Security should be built-in, not bolted-on
3. **Poor monitoring**: You can't fix what you can't see
4. **No documentation**: Network diagrams và runbooks are essential
5. **Skipping testing**: Test failure scenarios before they happen

## 🎓 Learning Strategy

### 70% Hands-on Practice
- Work với real services (portfolio project)
- Break things và fix them
- Practice troubleshooting scenarios

### 20% Theory Study  
- Understand underlying concepts
- Learn best practices
- Study real-world architectures

### 10% Community Learning
- Join DevOps communities
- Read case studies
- Learn from others' mistakes

## 📊 Success Metrics

Track your progress với these metrics:

### Technical Skills
- [ ] Can debug network issues systematically
- [ ] Understand security implications of network decisions
- [ ] Can design scalable network architectures  
- [ ] Comfortable với production troubleshooting

### Practical Application
- [ ] Successfully deploy portfolio project với proper networking
- [ ] Implement monitoring và alerting
- [ ] Handle disaster recovery scenarios
- [ ] Apply security best practices

### Knowledge Transfer
- [ ] Can explain network concepts to team members
- [ ] Document network architectures clearly
- [ ] Create troubleshooting runbooks
- [ ] Mentor others on network topics

## 🚀 Quick Start

1. **Read theory** (1-2 hours): `theory/01-network-fundamentals-devops.md`
2. **Start Lab 01** (2-3 hours): Basic connectivity với portfolio services  
3. **Practice daily** (30 minutes): Use network commands trong daily work
4. **Complete exercises** (1 week): Full portfolio network implementation

## 💡 Pro Tips

1. **Start với basics**: Master ping, curl, telnet before advanced tools
2. **Document everything**: Network diagrams save hours of debugging
3. **Test regularly**: Automated network tests catch issues early
4. **Monitor continuously**: Network issues are easier to prevent than fix
5. **Learn from failures**: Every network outage is a learning opportunity

---

**Remember**: Network knowledge builds over time. Focus on understanding concepts deeply rather than memorizing commands. The goal is to become confident troubleshooting network issues trong production environments!

**Ready to start?** Begin với `theory/01-network-fundamentals-devops.md`