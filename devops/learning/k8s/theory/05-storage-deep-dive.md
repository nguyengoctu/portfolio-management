# Kubernetes Storage Deep Dive - Chi tiết từng concept

## 1. Storage Fundamentals

### Tại sao Storage phức tạp trong K8s?

**Docker Compose đơn giản:**
```yaml
volumes:
  mysql_data:      # Docker tạo volume trên host
  minio_data:      # Data persist khi container restart
```

**Kubernetes challenges:**
- **Multi-node**: Pods có thể move between nodes
- **Pod lifecycle**: Pods ephemeral, data cần persist
- **Shared storage**: Multiple pods cần access same data
- **Performance**: Different storage types (SSD, HDD, Network)

### Storage Layer Architecture
```
Application Pod
    ↓
Volume Mount (/var/lib/mysql)
    ↓  
Persistent Volume Claim (PVC)
    ↓
Persistent Volume (PV)  
    ↓
Storage Class
    ↓
Physical Storage (AWS EBS, GCP PD, Local disk)
```

## 2. Volume Types - Từ đơn giản đến phức tạp

### emptyDir - Temporary Storage
```yaml
# Shared storage between containers trong same pod
apiVersion: v1
kind: Pod
metadata:
  name: auth-service-with-cache
spec:
  containers:
  - name: auth-service
    image: auth-service:latest
    volumeMounts:
    - name: cache-storage
      mountPath: /app/cache
  - name: cache-cleaner
    image: busybox
    volumeMounts:
    - name: cache-storage
      mountPath: /cache
  volumes:
  - name: cache-storage
    emptyDir: {}          # Ephemeral, deleted when pod dies
```

**Use cases:**
- Temporary files
- Cache data
- Shared data between containers trong same pod

### hostPath - Node Local Storage
```yaml
# Mount path from node filesystem
apiVersion: v1
kind: Pod
metadata:
  name: mysql-with-hostpath
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    volumeMounts:
    - name: mysql-data
      mountPath: /var/lib/mysql
  volumes:
  - name: mysql-data
    hostPath:
      path: /data/mysql     # Path trên node
      type: DirectoryOrCreate
```

**Problems with hostPath:**
- Pod bị schedule to different node → lose data
- Security risk: access to node filesystem
- No portability between clusters

### configMap và secret Volumes
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-config
spec:
  containers:
  - name: app
    volumeMounts:
    - name: app-config
      mountPath: /app/config
    - name: db-credentials  
      mountPath: /app/secrets
  volumes:
  - name: app-config
    configMap:
      name: app-config
  - name: db-credentials
    secret:
      secretName: mysql-secret
```

## 3. Persistent Volumes (PV) - The Storage Pool

### PV Concepts
**Persistent Volume** = Admin-provisioned storage trong cluster

```yaml
# Example: Local storage PV
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce      # Single pod có thể read/write
  persistentVolumeReclaimPolicy: Retain
  storageClassName: local-storage
  local:
    path: /data/mysql    # Local path trên node
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - worker-node-1  # Bind to specific node
```

### Access Modes Chi tiết

#### ReadWriteOnce (RWO)
- **Meaning**: 1 pod có thể read/write
- **Use case**: Database storage (MySQL, PostgreSQL)
- **Limitation**: Không share được between pods

#### ReadOnlyMany (ROX)
- **Meaning**: Multiple pods có thể read, none có thể write
- **Use case**: Static content, configuration files
- **Example**: Shared asset storage

#### ReadWriteMany (RWX)
- **Meaning**: Multiple pods có thể read/write simultaneously
- **Use case**: Shared file systems, content management
- **Limitation**: Expensive, not all storage support

```bash
# Check access modes supported by storage class
kubectl get storageclass -o yaml
```

### PV Lifecycle States

#### Available
```bash
# PV created but not bound to PVC yet
kubectl get pv
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM
mysql-pv 20Gi       RWO            Retain           Available
```

#### Bound  
```bash
# PV bound to a PVC
NAME     CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM
mysql-pv 20Gi       RWO            Retain           Bound    portfolio/mysql-pvc
```

#### Released
```bash
# PVC deleted but PV not available for reuse yet
```

#### Failed
```bash
# PV has failed automatic reclamation
```

## 4. Persistent Volume Claims (PVC) - Storage Requests

### PVC là gì?
**PVC** = User request for storage (similar to pod requesting CPU/memory)

```yaml
# PVC for MySQL database
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: portfolio
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: fast-ssd    # Optional: specific storage type
  selector:                     # Optional: specific PV selection
    matchLabels:
      type: database-storage
```

### PVC Binding Process
1. **User creates PVC** với specific requirements
2. **Kubernetes finds matching PV** (capacity, access mode, storage class)
3. **Bind PVC to PV** - exclusive relationship
4. **Pod uses PVC** through volumeMounts

```bash
# Check PVC binding status
kubectl get pvc mysql-pvc
NAME        STATUS   VOLUME    CAPACITY   ACCESS MODES   STORAGECLASS
mysql-pvc   Bound    mysql-pv  20Gi       RWO            local-storage

# Check which pod using PVC
kubectl get pods -o wide | grep mysql
```

## 5. Storage Classes - Dynamic Provisioning

### Static vs Dynamic Provisioning

#### Static Provisioning (Manual)
```bash
# Admin manually creates PVs
kubectl apply -f mysql-pv.yaml
kubectl apply -f minio-pv.yaml

# Users create PVCs → bind to existing PVs
kubectl apply -f mysql-pvc.yaml
```

#### Dynamic Provisioning (Automatic)
```yaml
# Admin creates StorageClass
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs    # Cloud provider specific
parameters:
  type: gp3                           # EBS volume type  
  fsType: ext4
  encrypted: "true"
allowVolumeExpansion: true
reclaimPolicy: Delete
```

**User chỉ cần tạo PVC:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: fast-ssd    # Reference to StorageClass
```

**Kubernetes automatically:**
1. Create AWS EBS volume (20GB, GP3, encrypted)
2. Create PV object pointing to EBS volume
3. Bind PVC to PV

### StorageClass Parameters Examples

#### AWS EBS
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"         # IOPS for GP3
  throughput: "125"    # MB/s throughput
  encrypted: "true"
  fsType: ext4
```

#### Local Path (for testing)
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
provisioner: rancher.io/local-path
parameters:
  hostPath: /data/local-path-provisioner
reclaimPolicy: Delete
```

## 6. StatefulSets với Persistent Storage

### Tại sao StatefulSets for Databases?

**Deployment problems với databases:**
- Pods có random names (mysql-deployment-abc123)
- No stable network identity
- No ordered startup/shutdown
- No persistent storage per replica

**StatefulSet solutions:**
- **Stable hostnames**: mysql-0, mysql-1, mysql-2
- **Ordered deployment**: mysql-0 starts first, then mysql-1
- **Persistent storage per pod**: Each pod có riêng PVC

### MySQL StatefulSet Example
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: portfolio
spec:
  serviceName: mysql-headless    # Required for stable network identity
  replicas: 1                    # Start với single instance
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: root-password
        - name: MYSQL_DATABASE
          value: "portfolio"
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: username
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
        livenessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - mysql
            - -h
            - localhost
            - -u
            - root
            - -p${MYSQL_ROOT_PASSWORD}
            - -e
            - "SELECT 1"
          initialDelaySeconds: 5
          periodSeconds: 2
  volumeClaimTemplates:           # Tự động tạo PVC cho mỗi pod
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
      storageClassName: fast-ssd   # Use dynamic provisioning
```

### Headless Service for StatefulSet
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
  namespace: portfolio
spec:
  clusterIP: None              # Headless service
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

**Headless Service provides:**
- **Stable DNS names**: mysql-0.mysql-headless.portfolio.svc.cluster.local
- **Direct pod access**: No load balancing, direct connection to specific pod

### MinIO StatefulSet for Object Storage
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: minio
  namespace: portfolio
spec:
  serviceName: minio-headless
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        command:
        - /bin/bash
        - -c
        args:
        - minio server /data --console-address :9001
        env:
        - name: MINIO_ROOT_USER
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: root-user
        - name: MINIO_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: minio-secret
              key: root-password
        ports:
        - containerPort: 9000
          name: api
        - containerPort: 9001
          name: console
        volumeMounts:
        - name: minio-data
          mountPath: /data
        livenessProbe:
          httpGet:
            path: /minio/health/live
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /minio/health/ready
            port: 9000
          initialDelaySeconds: 10
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: minio-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 50Gi
      storageClassName: fast-ssd
```

## 7. Volume Snapshots và Backup

### VolumeSnapshot for Backup
```yaml
# Create snapshot of MySQL data
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: mysql-backup-20241201
  namespace: portfolio
spec:
  source:
    persistentVolumeClaimName: mysql-data-mysql-0
  volumeSnapshotClassName: csi-snapshotter
```

### Restore from Snapshot
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-restore-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  dataSource:
    name: mysql-backup-20241201    # Restore from snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
```

## 8. Storage Performance và Tuning

### IOPS và Throughput
```yaml
# High performance storage class
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: high-performance
provisioner: ebs.csi.aws.com
parameters:
  type: io2                    # Provisioned IOPS SSD
  iops: "10000"               # High IOPS
  throughput: "1000"          # High throughput
  fsType: xfs                 # Better performance than ext4
```

### Volume Expansion
```yaml
# Enable volume expansion
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: expandable-storage
allowVolumeExpansion: true     # Allow resizing
```

```bash
# Expand existing PVC
kubectl patch pvc mysql-pvc -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'

# Check expansion status
kubectl get pvc mysql-pvc -w
```

## 9. Troubleshooting Storage Issues

### PVC Stuck in Pending
```bash
# Check PVC status
kubectl describe pvc mysql-pvc

# Common causes:
# 1. No matching PV available
# 2. StorageClass not found
# 3. Insufficient resources
# 4. Node affinity not satisfied
```

### Pod Cannot Mount Volume
```bash
# Check pod events
kubectl describe pod mysql-0

# Check volume attachment
kubectl get volumeattachment

# Check node capacity
kubectl describe node <node-name>
```

### Performance Issues
```bash
# Check IOPS usage
kubectl exec -it mysql-0 -- iostat -x 1

# Check disk usage
kubectl exec -it mysql-0 -- df -h

# Check mount options
kubectl exec -it mysql-0 -- mount | grep mysql
```

### Data Corruption Issues
```bash
# Check filesystem
kubectl exec -it mysql-0 -- fsck /dev/sdb

# Check MySQL data integrity
kubectl exec -it mysql-0 -- mysqlcheck --all-databases
```

## 10. Portfolio Project Storage Architecture

### Current Docker Storage:
```yaml
volumes:
  mysql_data:          # Local docker volume
  minio_data:         # Local docker volume
```

### Target K8s Storage:
```yaml
# MySQL persistent storage
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-mysql-0      # Created by StatefulSet
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 20Gi
  storageClassName: fast-ssd

# MinIO persistent storage  
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-data-minio-0      # Created by StatefulSet
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 100Gi
  storageClassName: standard
```

### Migration Strategy:
1. **Export data** from Docker volumes
2. **Create K8s StatefulSets** với PVCs
3. **Import data** into K8s persistent volumes
4. **Test data integrity** và application connectivity
5. **Setup backup/snapshot** policies

## 11. Best Practices

### Storage Class Design
- **Different tiers**: fast-ssd, standard, backup
- **Appropriate sizing**: Don't over-provision
- **Backup policies**: Regular snapshots
- **Monitoring**: Storage usage, IOPS, latency

### Security
- **Encryption at rest**: Enable trong StorageClass
- **Access controls**: PVC permissions
- **Network policies**: Restrict access to storage pods

### Performance
- **Choose right storage type**: IOPS vs throughput requirements
- **Filesystem selection**: XFS cho database, EXT4 cho general use
- **Node placement**: SSD nodes cho database workloads

Storage là critical component - data loss không thể phục hồi, nên cần plan kỹ trước khi migrate!