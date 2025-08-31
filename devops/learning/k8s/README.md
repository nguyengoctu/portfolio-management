# Kubernetes Learning Path

## 📁 Cấu trúc thư mục

```
k8s/
├── theory/                 # Lý thuyết và concepts
│   └── 01-k8s-fundamentals.md
├── labs/                   # Labs thực hành từng bước
│   ├── lab01-setup-environment.md
│   ├── lab02-pods-basics.md
│   └── lab03-deployments-services.md
├── exercises/              # Bài tập thực hành
│   ├── portfolio-k8s-migration.md
│   └── kubectl-practice.md
└── manifests/             # YAML manifests (tự tạo trong quá trình học)
```

## 🎯 Learning Path

### Phase 1: Foundation (1-2 tuần)
1. **Đọc lý thuyết**: `theory/01-k8s-fundamentals.md`
2. **Setup môi trường**: `labs/lab01-setup-environment.md`
3. **Thực hành cơ bản**: `labs/lab02-pods-basics.md`
4. **Practice kubectl**: `exercises/kubectl-practice.md`

### Phase 2: Core Concepts (2-3 tuần)  
1. **Deployments & Services**: `labs/lab03-deployments-services.md`
2. **ConfigMaps & Secrets**: Lab 4 (tự research)
3. **Persistent Volumes**: Lab 5 (tự research)
4. **Ingress & Networking**: Lab 6 (tự research)

### Phase 3: Real Project (3-4 tuần)
1. **Portfolio Migration**: `exercises/portfolio-k8s-migration.md`
2. **Monitoring setup**: Prometheus + Grafana
3. **CI/CD integration**: Jenkins/GitHub Actions với K8s
4. **Production best practices**

## 🚀 Quick Start

1. **Setup local cluster**:
   ```bash
   # Chọn 1 trong 3:
   minikube start              # Easiest
   kind create cluster         # Lightweight  
   # Hoặc Docker Desktop K8s   # GUI friendly
   ```

2. **Verify setup**:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

3. **Bắt đầu với Lab 1**:
   ```bash
   cd k8s/labs/
   # Follow lab01-setup-environment.md
   ```

## 📚 Learning Strategy

### 🎓 Self-Learning Approach
- **70% Thực hành** - Làm labs và exercises
- **20% Lý thuyết** - Đọc concepts và best practices  
- **10% Community** - Tham gia forums, Slack, meetups

### 🔧 Hands-on First
1. Làm lab trước, đọc lý thuyết sau
2. Break things và fix them
3. Practice kubectl commands daily
4. Build real projects

### 🤝 Progressive Learning
- Start simple (pods) → Complex (microservices)
- Local development → Production deployment
- Basic commands → Advanced automation

## 🎯 Success Metrics

### Beginner Level (2-4 tuần):
- [ ] Setup local K8s cluster
- [ ] Create và manage pods, deployments
- [ ] Understand services và networking
- [ ] Use ConfigMaps và secrets
- [ ] Debug basic issues

### Intermediate Level (1-2 tháng):
- [ ] Migrate existing app to K8s
- [ ] Setup monitoring và logging
- [ ] Implement health checks
- [ ] Configure ingress và load balancing
- [ ] Handle persistent data

### Advanced Level (2-3 tháng):  
- [ ] Production-ready deployments
- [ ] Security best practices
- [ ] Auto-scaling và resource management
- [ ] CI/CD integration
- [ ] Multi-cluster management

## 🛠️ Tools & Environment

### Required Tools:
- **kubectl** - Kubernetes CLI
- **Docker** - Container runtime
- **minikube/kind** - Local cluster
- **VS Code** - YAML editing với K8s extensions

### Recommended Extensions:
- Kubernetes (Microsoft)
- YAML (Red Hat)  
- GitLens
- Docker

### Useful Aliases:
```bash
alias k='kubectl'
alias kgp='kubectl get pods'  
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'
```

## 📖 Additional Resources

### Documentation:
- [Official Kubernetes Docs](https://kubernetes.io/docs/)
- [Kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)

### Practice Platforms:
- [Katacoda K8s Scenarios](https://katacoda.com/courses/kubernetes)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)
- [KodeKloud](https://kodekloud.com/courses/kubernetes-for-the-absolute-beginner/)

### Community:
- [Kubernetes Slack](https://slack.k8s.io/)
- [r/kubernetes](https://reddit.com/r/kubernetes)
- Local meetups và conferences

## ⚠️ Common Pitfalls

1. **Trying to learn everything at once** - Focus on fundamentals first
2. **Not practicing enough** - Theory without practice is useless
3. **Ignoring YAML syntax** - YAML indentation matters!
4. **Not understanding networking** - Services, DNS, ingress concepts
5. **Skipping security** - RBAC, secrets, network policies

## 💡 Pro Tips

1. **Use dry-run**: `kubectl create ... --dry-run=client -o yaml`
2. **Explain everything**: `kubectl explain pod.spec.containers`
3. **Watch resources**: `kubectl get pods -w`
4. **Debug systematically**: describe → logs → exec → events
5. **Version control manifests**: Always use Git cho YAML files

## 🎯 Next Steps After K8s Basics

1. **Helm** - Package manager for K8s
2. **Operators** - Custom controllers
3. **Service Mesh** - Istio/Linkerd  
4. **GitOps** - ArgoCD/Flux
5. **Multi-cluster** - Federation, cluster API

---

**Remember**: Kubernetes is complex, but with consistent practice và hands-on experience, you'll master it step by step. Focus on building real applications rather than just studying theory!

**Start now**: `cd labs/ && open lab01-setup-environment.md`