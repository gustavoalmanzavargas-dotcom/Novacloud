export type ResourceType =
  | 'vm'
  | 'container'
  | 'database'
  | 'storage'
  | 'network'
  | 'app'
  | 'security'
  | 'ai';

export type ResourceStatus =
  | 'Running'
  | 'Stopped'
  | 'Deploying'
  | 'Warning'
  | 'Failed'
  | 'Healthy'
  | 'Degraded';

export type Environment = 'Production' | 'Development' | 'Testing';

export type Region =
  | 'US East — Atlanta'
  | 'US West — Oregon'
  | 'EU Central — Frankfurt'
  | 'AP South — Tokyo';

export interface VMInstance {
  id: string;
  name: string;
  status: 'Running' | 'Stopped' | 'Deploying' | 'Warning' | 'Failed';
  os: string;
  vcpu: number;
  memoryGb: number;
  storageGb: number;
  privateIp: string;
  publicIp: string;
  region: Region;
  environment: Environment;
  vpc: string;
  subnet: string;
  securityPolicy: string;
  hostname: string;
  created: string;
  uptime: string;
  cpuUsagePct: number;
  memUsagePct: number;
  diskIops: number;
  networkInMb: number;
  networkOutMb: number;
  tags: Record<string, string>;
  attachedDisks: { name: string; sizeGb: number; type: string; mount: string }[];
  snapshots: { id: string; name: string; sizeGb: number; created: string }[];
}

export interface ApplicationItem {
  id: string;
  name: string;
  environment?: Environment;
  version?: string;
  status: 'Running' | 'Deploying' | 'Warning' | 'Failed' | 'Degraded';
  domain?: string;
  url?: string;
  infrastructure?: string;
  lastDeployment?: string;
  lastDeploy?: string;
  health?: 'Healthy' | 'Degraded' | 'Failed';
  replicas?: { current: number; desired: number } | number;
  cpuUsagePct?: number;
  memUsageMb?: number;
  gitBranch?: string;
  branch?: string;
  commitHash?: string;
  port?: number;
  type?: string;
}

export interface DatabaseItem {
  id: string;
  name: string;
  engine: 'PostgreSQL' | 'MySQL' | 'Redis' | 'MongoDB' | 'MariaDB' | 'SQL Server';
  version?: string;
  status: 'Running' | 'Stopped' | 'Warning' | 'Deploying' | 'Online';
  cpuUsagePct?: number;
  storageUsedGb: number;
  storageTotalGb: number;
  connections: number;
  maxConnections?: number;
  replication?: 'Synchronous Multi-AZ' | 'Single Node' | 'Read Replica Primary' | 'Cluster (3 Nodes)';
  backups?: string;
  endpoint: string;
  port?: number;
  environment?: Environment;
  region?: Region;
}

export interface StorageItem {
  id: string;
  name: string;
  type: 'Object Storage' | 'Block Storage' | 'File Storage (NFS)' | 'Snapshot' | 'Backup Repository';
  capacityGb: number;
  usedGb: number;
  region?: Region;
  encryption?: 'AES-256 (Cyverax Managed)' | 'Customer Managed KMS' | 'Hardware Encrypted';
  status?: 'Healthy' | 'Degraded' | 'Archiving';
  attachedResource?: string;
  created?: string;
  objectsCount?: number;
}

export interface NetworkTopologyNode {
  id: string;
  label: string;
  type: 'internet' | 'firewall' | 'loadbalancer' | 'vpc' | 'subnet' | 'vm' | 'database' | 'storage';
  ip?: string;
  cidr?: string;
  status: 'Healthy' | 'Warning' | 'Degraded';
  details: string;
  parentId?: string;
  connections: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  resource: string;
  application: string;
  environment: Environment;
  region: Region;
  message: string;
  traceId?: string;
  payload?: Record<string, any>;
}

export interface SecurityFinding {
  id: string;
  title: string;
  category: 'Access' | 'Network' | 'Vulnerability' | 'Compliance' | 'Certificate';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  resource: string;
  recommendation: string;
  detected: string;
  status: 'Open' | 'Remediated' | 'In Review';
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  user: string;
  resource: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  ip: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  category: 'Infrastructure' | 'Deployment' | 'Security' | 'Billing' | 'System';
}

export interface MarketplaceApp {
  id: string;
  name: string;
  logo: string;
  description: string;
  version: string;
  publisher: string;
  category: 'AI' | 'Databases' | 'Development' | 'Security' | 'Monitoring' | 'DevOps' | 'Business Apps' | 'Infrastructure';
  estimatedCost: string;
  popular?: boolean;
}

export interface AIExecutionPlan {
  action: string;
  specifications: Record<string, any>;
  estimatedMonthlyCost: string;
  items: string[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  category: 'cost' | 'security' | 'architecture' | 'performance';
  description: string;
  estimatedSavings?: string;
  remediationAction?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource: string;
  description: string;
  status: 'Open' | 'Remediated';
  remediationAction: string;
}

export type ActiveView =
  | 'home'
  | 'compute'
  | 'vm-detail'
  | 'containers'
  | 'storage'
  | 'networking'
  | 'databases'
  | 'applications'
  | 'ai'
  | 'security'
  | 'iam'
  | 'monitoring'
  | 'logs'
  | 'backups'
  | 'dev-tools'
  | 'marketplace'
  | 'billing'
  | 'activity'
  | 'settings';
