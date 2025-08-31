# Kubectl Practice Exercises

## Basic Commands Practice

### Exercise 1: Cluster Information
```bash
# Your tasks (find the commands):
# 1. Show cluster information
# 2. List all nodes in cluster  
# 3. Get detailed information about first node
# 4. Show current kubectl context
# 5. List all available contexts

# Hints:
# - Use kubectl cluster-info
# - Use kubectl get nodes
# - Use kubectl describe node <name>
# - Use kubectl config current-context
# - Use kubectl config get-contexts
```

### Exercise 2: Namespace Operations
```bash
# Tasks:
# 1. List all namespaces
# 2. Create namespace 'practice'
# 3. Set practice as default namespace for current context
# 4. List all pods in kube-system namespace
# 5. Delete namespace 'practice'

# Hints:
# - kubectl get namespaces
# - kubectl create namespace <name>
# - kubectl config set-context --current --namespace=<name>
# - kubectl get pods -n <namespace>
# - kubectl delete namespace <name>
```

## Pod Operations

### Exercise 3: Pod Lifecycle
```bash
# Tasks:
# 1. Create pod 'test-pod' với image nginx:1.20
# 2. List all pods với labels
# 3. Get pod details in YAML format
# 4. Check pod logs
# 5. Execute interactive shell trong pod
# 6. Delete the pod

# Hints for commands you need to find:
# - kubectl run <name> --image=<image>
# - kubectl get pods --show-labels
# - kubectl get pod <name> -o yaml
# - kubectl logs <pod-name>
# - kubectl exec -it <pod-name> -- /bin/bash
# - kubectl delete pod <name>
```

### Exercise 4: Pod Debugging
```bash
# Scenario: You have a pod that won't start
# Tasks:
# 1. Create pod với broken image: kubectl run broken --image=nginx:nonexistent
# 2. Check pod status
# 3. Get detailed pod information
# 4. Check cluster events  
# 5. Fix the image và verify pod runs

# Commands to discover:
# - kubectl get pod <name>
# - kubectl describe pod <name>
# - kubectl get events --sort-by=.metadata.creationTimestamp
# - kubectl edit pod <name> (hoặc delete và recreate)
```

## Working with Manifests

### Exercise 5: YAML Manipulation  
```bash
# Tasks:
# 1. Generate pod YAML without creating: nginx pod named 'yaml-pod'
# 2. Save YAML to file pod.yaml
# 3. Edit file to add label 'env: test'
# 4. Apply the manifest
# 5. Update image to nginx:1.21 using kubectl patch

# Hints:
# - kubectl run <name> --image=<image> --dry-run=client -o yaml
# - kubectl run ... --dry-run=client -o yaml > pod.yaml
# - Edit file manually
# - kubectl apply -f pod.yaml
# - kubectl patch pod <name> -p '{"spec":{"containers":[{"name":"nginx","image":"nginx:1.21"}]}}'
```

### Exercise 6: Labels và Selectors
```bash
# Tasks:
# 1. Create 3 pods with different labels:
#    - pod1: app=web, env=dev
#    - pod2: app=web, env=prod  
#    - pod3: app=db, env=dev
# 2. List pods với label app=web
# 3. List pods trong dev environment
# 4. Add label version=1.0 to pod1
# 5. Remove label env từ pod3

# Commands to find:
# - kubectl run <name> --image=nginx --labels="app=web,env=dev"
# - kubectl get pods -l app=web
# - kubectl get pods -l env=dev
# - kubectl label pod <name> version=1.0
# - kubectl label pod <name> env-
```

## Deployments và Scaling

### Exercise 7: Deployment Management
```bash
# Tasks:
# 1. Create deployment 'web-app' với nginx:1.20, 3 replicas
# 2. Check deployment status
# 3. List replicasets created
# 4. Scale deployment to 5 replicas
# 5. Update image to nginx:1.21
# 6. Check rollout status
# 7. Rollback to previous version

# Find these commands:
# - kubectl create deployment <name> --image=<image> --replicas=3
# - kubectl get deployments
# - kubectl get replicasets
# - kubectl scale deployment <name> --replicas=5
# - kubectl set image deployment/<name> <container>=<image>
# - kubectl rollout status deployment/<name>
# - kubectl rollout undo deployment/<name>
```

### Exercise 8: Service Creation
```bash
# Tasks (given deployment from previous exercise):
# 1. Expose deployment as ClusterIP service on port 80
# 2. Create NodePort service for external access
# 3. Test service connectivity từ inside cluster
# 4. Port forward service to local machine
# 5. Get service endpoints

# Commands to discover:
# - kubectl expose deployment <name> --port=80 --type=ClusterIP
# - kubectl expose deployment <name> --port=80 --type=NodePort --name=<name-nodeport>
# - kubectl run test --image=busybox --rm -it -- wget -qO- http://<service>
# - kubectl port-forward service/<name> 8080:80
# - kubectl get endpoints <service-name>
```

## ConfigMaps và Secrets

### Exercise 9: Configuration Management
```bash
# Tasks:
# 1. Create ConfigMap từ literal values: DB_HOST=mysql, DB_PORT=3306
# 2. Create ConfigMap từ file (create test.properties first)
# 3. Create Secret với username=admin, password=secret123
# 4. Create pod sử dụng ConfigMap values as environment variables
# 5. Create pod mounting Secret as volume

# Hints:
# - kubectl create configmap <name> --from-literal=key=value
# - kubectl create configmap <name> --from-file=<file>
# - kubectl create secret generic <name> --from-literal=username=admin
# - Use env.valueFrom.configMapKeyRef trong pod spec
# - Use volumes và volumeMounts trong pod spec
```

## Advanced Operations

### Exercise 10: Resource Management
```bash
# Tasks:
# 1. Create pod với resource requests (100m CPU, 128Mi memory)
# 2. Create pod với resource limits (500m CPU, 256Mi memory)  
# 3. Check pod resource usage (if metrics-server available)
# 4. Create deployment với HPA (CPU threshold 50%)

# Research these commands:
# - Add resources section trong pod spec
# - kubectl top pods (if metrics available)
# - kubectl autoscale deployment <name> --cpu-percent=50 --min=1 --max=10
```

### Exercise 11: Troubleshooting Scenarios

#### Scenario A: Pod CrashLoopBackOff
```bash
# Create this broken pod và troubleshoot:
apiVersion: v1
kind: Pod
metadata:
  name: crashloop-pod
spec:
  containers:
  - name: app
    image: busybox
    command: ["/bin/sh"]
    args: ["-c", "exit 1"]

# Tasks:
# 1. Apply pod và observe status
# 2. Check logs
# 3. Check previous container logs
# 4. Fix the pod
```

#### Scenario B: Service Connectivity Issues  
```bash
# Create deployment và service với wrong selector:
# Deployment labels: app=web
# Service selector: app=webapp

# Tasks:  
# 1. Create deployment: kubectl create deployment test --image=nginx
# 2. Create service với wrong selector
# 3. Check why service has no endpoints
# 4. Fix service selector
# 5. Verify connectivity
```

## Performance & Monitoring

### Exercise 12: Monitoring Commands
```bash
# Tasks (research và try these):
# 1. Watch pods in real-time
# 2. Follow logs from multiple pods
# 3. Get resource usage for all pods
# 4. Check node resource allocation
# 5. Monitor deployment rollout progress

# Commands to find:
# - kubectl get pods -w
# - kubectl logs -f -l app=<label>  
# - kubectl top pods
# - kubectl describe nodes
# - kubectl rollout status deployment/<name> -w
```

## Challenge Exercises

### Exercise 13: Multi-Container Pod
Create pod với:
- Main container: nginx
- Sidecar container: busybox logging to shared volume  
- Shared volume giữa containers
- Test communication giữa containers

### Exercise 14: Blue-Green Deployment
1. Create "blue" deployment (nginx:1.20)
2. Create service pointing to blue
3. Create "green" deployment (nginx:1.21)  
4. Switch service từ blue to green
5. Rollback if needed

### Exercise 15: Cluster Maintenance  
1. Drain a node (if multi-node cluster)
2. Observe pod rescheduling
3. Uncordon the node
4. Practice safe node operations

## Answer Key Structure

Each exercise should có structure:
```bash
# Exercise X: Title
# Commands used:
kubectl command1
kubectl command2

# Explanation:
Why this command works...

# Expected output:
Expected result...

# Common errors:
What might go wrong...
```

## Completion Checklist

Basic Level:
- [ ] All cluster info commands
- [ ] Pod creation và management  
- [ ] Basic troubleshooting
- [ ] YAML manifest operations

Intermediate Level:
- [ ] Deployment management
- [ ] Service creation và testing
- [ ] ConfigMap/Secret usage
- [ ] Resource management

Advanced Level:  
- [ ] Complex troubleshooting scenarios
- [ ] Multi-container coordination
- [ ] Blue-green deployments
- [ ] Cluster maintenance operations

## Tips for Self-Learning

1. **Use `kubectl explain`**: `kubectl explain pod.spec.containers`
2. **Dry run everything**: `--dry-run=client -o yaml`
3. **Read error messages**: They usually contain solutions
4. **Practice regularly**: Set up daily kubectl practice
5. **Learn shortcuts**: Alias kubectl to k, use tab completion
6. **Join community**: Kubernetes Slack, forums, meetups

Remember: The goal is to discover commands yourself using kubectl help, documentation, và experimentation!