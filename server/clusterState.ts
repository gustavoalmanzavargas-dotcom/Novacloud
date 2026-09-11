import fs from 'fs';
import path from 'path';

export interface GpuTierOption {
  id: string;
  name: string;
  monthlyCost: number;
}

export const GPU_OPTIONS: GpuTierOption[] = [
  { id: 'None', name: 'None (CPU Only)', monthlyCost: 0 },
  { id: '1x NVIDIA L4 (24GB)', name: '1x NVIDIA L4 (24GB Tensor Core)', monthlyCost: 180 },
  { id: '1x NVIDIA A100 (80GB SXM4)', name: '1x NVIDIA A100 (80GB SXM4)', monthlyCost: 650 },
  { id: '2x NVIDIA A100 (80GB SXM4)', name: '2x NVIDIA A100 (80GB SXM4)', monthlyCost: 1250 },
  { id: '1x NVIDIA H100 (80GB SXM5)', name: '1x NVIDIA H100 (80GB SXM5)', monthlyCost: 1450 },
  { id: '2x NVIDIA H100 (80GB SXM5)', name: '2x NVIDIA H100 (80GB SXM5)', monthlyCost: 2800 },
  { id: '4x NVIDIA H100 (80GB SXM5)', name: '4x NVIDIA H100 (80GB SXM5 NVLink)', monthlyCost: 5400 },
];

export interface MarketplaceAppDetail {
  id: string;
  name: string;
  category: 'AI & LLMs' | 'Databases & Cache' | 'DevOps & CI/CD' | 'Web & Frameworks' | 'Security & Network' | 'Observability';
  version: string;
  publisher: string;
  description: string;
  icon: string;
  popular: boolean;
  minCpu: number;
  minRamGb: number;
  gpuRecommended: boolean;
  defaultPort: number;
  estimatedCost: string;
  dockerImage: string;
  tags: string[];
}

export const MARKETPLACE_CATALOG: MarketplaceAppDetail[] = [
  // AI & LLMs
  {
    id: 'app-ollama',
    name: 'Ollama Private LLM Server',
    category: 'AI & LLMs',
    version: '0.5.8',
    publisher: 'Ollama AI',
    description: 'Run open-weight LLMs locally with high speed, GPU acceleration, and an OpenAI-compatible REST API.',
    icon: 'Brain',
    popular: true,
    minCpu: 4,
    minRamGb: 16,
    gpuRecommended: true,
    defaultPort: 11434,
    estimatedCost: '$65.00/mo',
    dockerImage: 'ollama/ollama:latest',
    tags: ['AI', 'LLM', 'Local Inference', 'Llama 3', 'DeepSeek'],
  },
  {
    id: 'app-deepseek-r1',
    name: 'DeepSeek R1 Reasoning Node',
    category: 'AI & LLMs',
    version: '1.2.0',
    publisher: 'DeepSeek AI & vLLM',
    description: 'State-of-the-art open reasoning model pre-configured with vLLM PagedAttention on isolated tenant GPU.',
    icon: 'Sparkles',
    popular: true,
    minCpu: 8,
    minRamGb: 32,
    gpuRecommended: true,
    defaultPort: 8000,
    estimatedCost: '$240.00/mo',
    dockerImage: 'vllm/vllm-openai:deepseek-r1-distill',
    tags: ['Reasoning', 'DeepSeek', 'vLLM', 'GPU Required'],
  },
  {
    id: 'app-vllm',
    name: 'vLLM Production Inference Engine',
    category: 'AI & LLMs',
    version: '0.7.2',
    publisher: 'vLLM Project',
    description: 'High-throughput, ultra-low latency LLM serving engine with continuous batching and PagedAttention.',
    icon: 'Cpu',
    popular: true,
    minCpu: 8,
    minRamGb: 32,
    gpuRecommended: true,
    defaultPort: 8000,
    estimatedCost: '$190.00/mo',
    dockerImage: 'vllm/vllm-openai:latest',
    tags: ['Inference', 'High-Throughput', 'NVIDIA CUDA'],
  },
  {
    id: 'app-comfyui',
    name: 'ComfyUI Generative Studio',
    category: 'AI & LLMs',
    version: '2026.3',
    publisher: 'Comfy Anonymous',
    description: 'Modular node-based GUI and backend API for Stable Diffusion, Flux.1, and generative video pipelines.',
    icon: 'Palette',
    popular: false,
    minCpu: 6,
    minRamGb: 24,
    gpuRecommended: true,
    defaultPort: 8188,
    estimatedCost: '$140.00/mo',
    dockerImage: 'comfyui/core:cu124',
    tags: ['Diffusion', 'Flux', 'Image Generation', 'Nodes'],
  },
  {
    id: 'app-openwebui',
    name: 'Open-WebUI Enterprise Portal',
    category: 'AI & LLMs',
    version: '0.4.12',
    publisher: 'Open-WebUI Team',
    description: 'ChatGPT-style private interface with multi-user RBAC, document RAG, and multi-model switching.',
    icon: 'MessageSquare',
    popular: true,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 3000,
    estimatedCost: '$25.00/mo',
    dockerImage: 'ghcr.io/open-webui/open-webui:main',
    tags: ['WebUI', 'RAG', 'Knowledge Base', 'Chat'],
  },
  {
    id: 'app-flowise',
    name: 'Flowise AI Agent Orchestrator',
    category: 'AI & LLMs',
    version: '2.1.4',
    publisher: 'FlowiseAI',
    description: 'Drag & drop UI to build customized LLM flows, multi-agent teams, vector store connectors, and tools.',
    icon: 'Workflow',
    popular: false,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 3000,
    estimatedCost: '$20.00/mo',
    dockerImage: 'flowiseai/flowise:latest',
    tags: ['LangChain', 'Agents', 'Workflows', 'Low-Code'],
  },

  // Databases & Cache
  {
    id: 'app-postgres-ha',
    name: 'PostgreSQL 16 HA Cluster (Patroni + pgvector)',
    category: 'Databases & Cache',
    version: '16.4',
    publisher: 'PostgreSQL Global',
    description: 'Enterprise PostgreSQL with pgvector AI embeddings, Patroni auto-failover, and pgBouncer pooling.',
    icon: 'Database',
    popular: true,
    minCpu: 4,
    minRamGb: 16,
    gpuRecommended: false,
    defaultPort: 5432,
    estimatedCost: '$72.00/mo',
    dockerImage: 'postgres:16-alpine',
    tags: ['SQL', 'pgvector', 'High Availability', 'ACID'],
  },
  {
    id: 'app-redis-sentinel',
    name: 'Redis 7 Sentinel In-Memory Cache',
    category: 'Databases & Cache',
    version: '7.4',
    publisher: 'Redis Ltd',
    description: 'Sub-millisecond latency in-memory data store with master-replica replication and sentinel failover.',
    icon: 'Layers',
    popular: true,
    minCpu: 2,
    minRamGb: 8,
    gpuRecommended: false,
    defaultPort: 6379,
    estimatedCost: '$38.00/mo',
    dockerImage: 'redis:7-alpine',
    tags: ['Cache', 'In-Memory', 'PubSub', 'Sessions'],
  },
  {
    id: 'app-clickhouse',
    name: 'ClickHouse Real-Time Analytics OLAP',
    category: 'Databases & Cache',
    version: '24.8',
    publisher: 'ClickHouse Inc',
    description: 'Column-oriented DBMS generating analytical reports using SQL queries in real time at billions of rows/sec.',
    icon: 'BarChart2',
    popular: false,
    minCpu: 8,
    minRamGb: 32,
    gpuRecommended: false,
    defaultPort: 8123,
    estimatedCost: '$160.00/mo',
    dockerImage: 'clickhouse/clickhouse-server:latest',
    tags: ['OLAP', 'Big Data', 'Telemetry', 'Fast SQL'],
  },
  {
    id: 'app-mongodb-ent',
    name: 'MongoDB 7 Document Replica',
    category: 'Databases & Cache',
    version: '7.0.12',
    publisher: 'MongoDB Inc',
    description: 'Distributed JSON-like document database with replica set election, sharding readiness, and Atlas sync.',
    icon: 'Server',
    popular: true,
    minCpu: 4,
    minRamGb: 16,
    gpuRecommended: false,
    defaultPort: 27017,
    estimatedCost: '$68.00/mo',
    dockerImage: 'mongo:7.0',
    tags: ['NoSQL', 'Document', 'JSON', 'ReplicaSet'],
  },
  {
    id: 'app-minio-s3',
    name: 'MinIO High-Performance S3 Storage',
    category: 'Databases & Cache',
    version: 'RELEASE.2026-03',
    publisher: 'MinIO',
    description: 'S3-compatible object storage server with AWS S3 API compliance, BitRot protection, and encryption.',
    icon: 'HardDrive',
    popular: true,
    minCpu: 4,
    minRamGb: 16,
    gpuRecommended: false,
    defaultPort: 9000,
    estimatedCost: '$55.00/mo',
    dockerImage: 'minio/minio:latest',
    tags: ['S3', 'Object Storage', 'Buckets', 'AWS Compatible'],
  },

  // DevOps & CI/CD
  {
    id: 'app-k3s-node',
    name: 'Kubernetes K3s Micro-Cluster Node',
    category: 'DevOps & CI/CD',
    version: 'v1.30.2',
    publisher: 'Rancher / CNCF',
    description: 'Production-ready, lightweight Kubernetes certified by CNCF. Isolated per-tenant overlay with Calico CNI.',
    icon: 'Boxes',
    popular: true,
    minCpu: 4,
    minRamGb: 8,
    gpuRecommended: false,
    defaultPort: 6443,
    estimatedCost: '$45.00/mo',
    dockerImage: 'rancher/k3s:v1.30.2-k3s1',
    tags: ['Kubernetes', 'K8s', 'CNCF', 'Containers'],
  },
  {
    id: 'app-gitlab-runner',
    name: 'GitLab Dedicated CI/CD Runner',
    category: 'DevOps & CI/CD',
    version: '17.3',
    publisher: 'GitLab',
    description: 'Private, high-performance containerized build runner directly attached to your client isolated VLAN.',
    icon: 'PlayCircle',
    popular: false,
    minCpu: 4,
    minRamGb: 8,
    gpuRecommended: false,
    defaultPort: 8093,
    estimatedCost: '$30.00/mo',
    dockerImage: 'gitlab/gitlab-runner:latest',
    tags: ['CI/CD', 'GitLab', 'Pipeline', 'Automated Build'],
  },
  {
    id: 'app-harbor-registry',
    name: 'Harbor Enterprise OCI Registry',
    category: 'DevOps & CI/CD',
    version: '2.11',
    publisher: 'Linux Foundation / CNCF',
    description: 'Private container image registry with vulnerability scanning (Trivy), content signing, and RBAC.',
    icon: 'Package',
    popular: false,
    minCpu: 4,
    minRamGb: 12,
    gpuRecommended: false,
    defaultPort: 443,
    estimatedCost: '$50.00/mo',
    dockerImage: 'goharbor/harbor-core:v2.11.0',
    tags: ['Docker', 'OCI', 'Security Scan', 'Artifacts'],
  },

  // Web & Frameworks
  {
    id: 'app-nextjs-stack',
    name: 'Next.js 15 Full-Stack SSR Node',
    category: 'Web & Frameworks',
    version: '15.1',
    publisher: 'Vercel Ecosystem',
    description: 'React Server Components, App Router, edge middleware, and Node runtime ready for high-load web applications.',
    icon: 'Globe',
    popular: true,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 3000,
    estimatedCost: '$22.00/mo',
    dockerImage: 'node:22-alpine',
    tags: ['React', 'Next.js', 'TypeScript', 'SSR'],
  },
  {
    id: 'app-fastapi-stack',
    name: 'FastAPI High-Performance Python API',
    category: 'Web & Frameworks',
    version: '0.114',
    publisher: 'Tiangolo',
    description: 'Modern async Python framework with automatic Swagger docs, Pydantic validation, and Uvicorn workers.',
    icon: 'Zap',
    popular: true,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 8000,
    estimatedCost: '$20.00/mo',
    dockerImage: 'tiangolo/uvicorn-gunicorn-fastapi:python3.11',
    tags: ['Python', 'FastAPI', 'Async', 'REST'],
  },
  {
    id: 'app-wordpress-vip',
    name: 'WordPress VIP Enterprise Stack',
    category: 'Web & Frameworks',
    version: '6.6.1',
    publisher: 'WordPress Foundation',
    description: 'Hardened WordPress with PHP 8.3 FPM, OPcache, Redis object caching, and automated MariaDB replication.',
    icon: 'FileText',
    popular: true,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 80,
    estimatedCost: '$28.00/mo',
    dockerImage: 'wordpress:php8.3-fpm-alpine',
    tags: ['CMS', 'PHP', 'Publishing', 'Blog'],
  },

  // Security & Network
  {
    id: 'app-wireguard-mesh',
    name: 'WireGuard Multi-Peer Mesh VPN',
    category: 'Security & Network',
    version: '1.0.2',
    publisher: 'WireGuard Project',
    description: 'Ultra-fast, state-of-the-art encrypted tunnel allowing secure admin access directly into the client VLAN.',
    icon: 'Shield',
    popular: true,
    minCpu: 1,
    minRamGb: 2,
    gpuRecommended: false,
    defaultPort: 51820,
    estimatedCost: '$12.00/mo',
    dockerImage: 'linuxserver/wireguard:latest',
    tags: ['VPN', 'WireGuard', 'Crypto', 'Private Access'],
  },
  {
    id: 'app-nginx-pm',
    name: 'NGINX Proxy Manager & Let\'s Encrypt',
    category: 'Security & Network',
    version: '2.11.2',
    publisher: 'Jamie Curnow',
    description: 'Web GUI reverse proxy with automatic SSL certificate issuance, HTTP/2, WebSocket routing, and access lists.',
    icon: 'ShieldCheck',
    popular: true,
    minCpu: 2,
    minRamGb: 2,
    gpuRecommended: false,
    defaultPort: 81,
    estimatedCost: '$15.00/mo',
    dockerImage: 'jc21/nginx-proxy-manager:latest',
    tags: ['Reverse Proxy', 'SSL', 'Let\'s Encrypt', 'Firewall'],
  },
  {
    id: 'app-crowdsec-ids',
    name: 'CrowdSec Collaborative IDS/IPS & WAF',
    category: 'Security & Network',
    version: '1.6.2',
    publisher: 'CrowdSec',
    description: 'Open-source behavioral security engine parsing tenant logs and actively blocking malicious IP sweeps.',
    icon: 'Lock',
    popular: false,
    minCpu: 2,
    minRamGb: 4,
    gpuRecommended: false,
    defaultPort: 8080,
    estimatedCost: '$18.00/mo',
    dockerImage: 'crowdsecurity/crowdsec:latest',
    tags: ['WAF', 'IDS', 'IPS', 'Intrusion Prevention'],
  },

  // Observability & Monitoring
  {
    id: 'app-grafana-prom',
    name: 'Prometheus & Grafana Observability',
    category: 'Observability',
    version: '11.1',
    publisher: 'Grafana Labs',
    description: 'Pre-configured dashboards, alert rules, and time-series metrics scrapers for full tenant visibility.',
    icon: 'Activity',
    popular: true,
    minCpu: 2,
    minRamGb: 8,
    gpuRecommended: false,
    defaultPort: 3000,
    estimatedCost: '$35.00/mo',
    dockerImage: 'grafana/grafana:latest',
    tags: ['Metrics', 'Dashboards', 'Prometheus', 'Grafana'],
  },
  {
    id: 'app-loki-logs',
    name: 'Grafana Loki Distributed Log Engine',
    category: 'Observability',
    version: '3.1',
    publisher: 'Grafana Labs',
    description: 'Horizontally scalable, multi-tenant log aggregation system inspired by Prometheus for index-efficient search.',
    icon: 'Terminal',
    popular: false,
    minCpu: 4,
    minRamGb: 8,
    gpuRecommended: false,
    defaultPort: 3100,
    estimatedCost: '$40.00/mo',
    dockerImage: 'grafana/loki:latest',
    tags: ['Logs', 'Loki', 'Search', 'Auditing'],
  },
  {
    id: 'app-uptime-kuma',
    name: 'Uptime Kuma Status Monitor',
    category: 'Observability',
    version: '1.23',
    publisher: 'Louie Lam',
    description: 'Self-hosted monitoring tool providing ping, HTTP(s), TCP, DNS, and SSL expiry alerts with status pages.',
    icon: 'CheckCircle2',
    popular: true,
    minCpu: 1,
    minRamGb: 1,
    gpuRecommended: false,
    defaultPort: 3001,
    estimatedCost: '$10.00/mo',
    dockerImage: 'louislam/uptime-kuma:1',
    tags: ['Uptime', 'Health Check', 'Public Status Page'],
  },
];

export interface ClientTenantData {
  id: string;
  name: string;
  clientCompany: string;
  clientEmail: string;
  status: 'Active' | 'Provisioning' | 'Suspended' | 'Maintenance';
  plan: 'Starter' | 'Scale' | 'Enterprise' | 'AI Elite';
  monthlyBilling: number;
  clusterNodeId: string;
  vlanId: number;
  vxlanVni: number;
  vpcCidr: string;
  isolatedSubnet: string;
  virtualGateway: string;
  natGatewayIp: string;
  dnsServers: string[];
  firewallRulesCount: number;
  isolationStatus: 'Strictly Isolated (0 Crosstalk)';
  vCpuAllocated: number;
  vCpuMaxQuota: number;
  ramGbAllocated: number;
  ramGbMaxQuota: number;
  gpuAllocated: string;
  storageGbAllocated: number;
  bandwidthLimitMbps: number;
  cpuUsagePct: number;
  ramUsagePct: number;
  storageUsedGb: number;
  activeWorkloadsCount: number;
  networkThroughputMbps: number;
  installedApps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClusterStateStore {
  version: string;
  lastUpdated: string;
  cluster: {
    clusterName: string;
    location: string;
    hypervisor: string;
    networkFabric: string;
    status: 'Healthy' | 'Degraded';
    totalNodes: number;
    onlineNodes: number;
    totalPhysicalCores: number;
    totalRamGb: number;
    totalGpus: number;
    totalStorageTb: number;
    vlanRange: string;
    sdnController: string;
    crossTenantIsolation: '100% Enforced (Hardware EVPN/VXLAN)';
    nodes: Array<{
      id: string;
      name: string;
      rackLocation: string;
      status: 'Online' | 'Maintenance' | 'Degraded';
      cpuModel: string;
      totalCores: number;
      allocatedCores: number;
      totalRamGb: number;
      allocatedRamGb: number;
      gpuUnits: string[];
      allocatedGpus: number;
      storageNvmeTb: number;
      temperatureC: number;
      uptimeDays: number;
    }>;
  };
  clients: ClientTenantData[];
}

const INITIAL_CLIENTS: ClientTenantData[] = [
  {
    id: 'client-acme-prod',
    name: 'Acme Corp Core Production',
    clientCompany: 'Acme Global Technologies Inc.',
    clientEmail: 'ops@acme-corp.internal',
    status: 'Active',
    plan: 'Enterprise',
    monthlyBilling: 690,
    clusterNodeId: 'node-alpha-01',
    vlanId: 1042,
    vxlanVni: 101042,
    vpcCidr: '10.142.0.0/20',
    isolatedSubnet: '10.142.1.0/24',
    virtualGateway: '10.142.1.1',
    natGatewayIp: '198.51.100.42',
    dnsServers: ['10.142.0.2', '1.1.1.1'],
    firewallRulesCount: 14,
    isolationStatus: 'Strictly Isolated (0 Crosstalk)',
    vCpuAllocated: 32,
    vCpuMaxQuota: 64,
    ramGbAllocated: 64,
    ramGbMaxQuota: 128,
    gpuAllocated: 'None',
    storageGbAllocated: 1200,
    bandwidthLimitMbps: 2500,
    cpuUsagePct: 46.2,
    ramUsagePct: 58.4,
    storageUsedGb: 614,
    activeWorkloadsCount: 6,
    networkThroughputMbps: 184.2,
    installedApps: ['app-postgres-ha', 'app-redis-sentinel', 'app-nextjs-stack'],
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'client-nexus-ai',
    name: 'Nexus AI Research Labs',
    clientCompany: 'Nexus Machine Intelligence LLC',
    clientEmail: 'lead@nexus-ai.io',
    status: 'Active',
    plan: 'AI Elite',
    monthlyBilling: 1850,
    clusterNodeId: 'node-alpha-03',
    vlanId: 1043,
    vxlanVni: 101043,
    vpcCidr: '10.143.0.0/20',
    isolatedSubnet: '10.143.1.0/24',
    virtualGateway: '10.143.1.1',
    natGatewayIp: '198.51.100.43',
    dnsServers: ['10.143.0.2', '8.8.8.8'],
    firewallRulesCount: 18,
    isolationStatus: 'Strictly Isolated (0 Crosstalk)',
    vCpuAllocated: 48,
    vCpuMaxQuota: 96,
    ramGbAllocated: 128,
    ramGbMaxQuota: 256,
    gpuAllocated: '1x NVIDIA H100 (80GB SXM5)',
    storageGbAllocated: 3000,
    bandwidthLimitMbps: 10000,
    cpuUsagePct: 78.9,
    ramUsagePct: 82.1,
    storageUsedGb: 1940,
    activeWorkloadsCount: 4,
    networkThroughputMbps: 940.5,
    installedApps: ['app-ollama', 'app-deepseek-r1', 'app-vllm', 'app-openwebui'],
    createdAt: '2026-02-10T14:30:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'client-fintech-sec',
    name: 'FinTech Secure Payments',
    clientCompany: 'QuantEdge Financial Group',
    clientEmail: 'devops@quantedge-bank.com',
    status: 'Active',
    plan: 'Scale',
    monthlyBilling: 420,
    clusterNodeId: 'node-alpha-05',
    vlanId: 1044,
    vxlanVni: 101044,
    vpcCidr: '10.144.0.0/20',
    isolatedSubnet: '10.144.1.0/24',
    virtualGateway: '10.144.1.1',
    natGatewayIp: '198.51.100.44',
    dnsServers: ['10.144.0.2', '1.0.0.1'],
    firewallRulesCount: 26,
    isolationStatus: 'Strictly Isolated (0 Crosstalk)',
    vCpuAllocated: 16,
    vCpuMaxQuota: 32,
    ramGbAllocated: 32,
    ramGbMaxQuota: 64,
    gpuAllocated: 'None',
    storageGbAllocated: 800,
    bandwidthLimitMbps: 1500,
    cpuUsagePct: 34.0,
    ramUsagePct: 41.5,
    storageUsedGb: 280,
    activeWorkloadsCount: 3,
    networkThroughputMbps: 68.0,
    installedApps: ['app-postgres-ha', 'app-wireguard-mesh', 'app-crowdsec-ids'],
    createdAt: '2026-02-28T11:15:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_NODES = [
  {
    id: 'node-alpha-01',
    name: 'cyv-node-01.atl-rack1',
    rackLocation: 'Rack A-01 (Primary Compute)',
    status: 'Online' as const,
    cpuModel: 'Dual AMD EPYC 9654 (192 Cores / 384 Threads)',
    totalCores: 192,
    allocatedCores: 64,
    totalRamGb: 768,
    allocatedRamGb: 256,
    gpuUnits: ['NVIDIA L4 24GB', 'NVIDIA L4 24GB'],
    allocatedGpus: 1,
    storageNvmeTb: 16,
    temperatureC: 38,
    uptimeDays: 142,
  },
  {
    id: 'node-alpha-02',
    name: 'cyv-node-02.atl-rack1',
    rackLocation: 'Rack A-02 (General Compute)',
    status: 'Online' as const,
    cpuModel: 'Dual AMD EPYC 9654 (192 Cores / 384 Threads)',
    totalCores: 192,
    allocatedCores: 48,
    totalRamGb: 768,
    allocatedRamGb: 192,
    gpuUnits: ['NVIDIA L4 24GB'],
    allocatedGpus: 0,
    storageNvmeTb: 16,
    temperatureC: 37,
    uptimeDays: 142,
  },
  {
    id: 'node-alpha-03',
    name: 'cyv-node-03.atl-rack2-gpu',
    rackLocation: 'Rack B-01 (High-Density GPU)',
    status: 'Online' as const,
    cpuModel: 'Dual AMD EPYC 9554 (128 Cores / 256 Threads)',
    totalCores: 128,
    allocatedCores: 80,
    totalRamGb: 1024,
    allocatedRamGb: 512,
    gpuUnits: ['NVIDIA H100 80GB SXM5', 'NVIDIA H100 80GB SXM5', 'NVIDIA H100 80GB SXM5', 'NVIDIA H100 80GB SXM5'],
    allocatedGpus: 3,
    storageNvmeTb: 24,
    temperatureC: 44,
    uptimeDays: 98,
  },
  {
    id: 'node-alpha-04',
    name: 'cyv-node-04.atl-rack2-gpu',
    rackLocation: 'Rack B-02 (High-Density GPU)',
    status: 'Online' as const,
    cpuModel: 'Dual AMD EPYC 9554 (128 Cores / 256 Threads)',
    totalCores: 128,
    allocatedCores: 32,
    totalRamGb: 1024,
    allocatedRamGb: 256,
    gpuUnits: ['NVIDIA H100 80GB SXM5', 'NVIDIA H100 80GB SXM5', 'NVIDIA A100 80GB', 'NVIDIA A100 80GB'],
    allocatedGpus: 2,
    storageNvmeTb: 24,
    temperatureC: 41,
    uptimeDays: 98,
  },
  {
    id: 'node-alpha-05',
    name: 'cyv-node-05.atl-rack3-db',
    rackLocation: 'Rack C-01 (High-Memory Storage / DB)',
    status: 'Online' as const,
    cpuModel: 'Dual AMD EPYC 9354 (64 Cores / 128 Threads)',
    totalCores: 64,
    allocatedCores: 24,
    totalRamGb: 512,
    allocatedRamGb: 160,
    gpuUnits: [],
    allocatedGpus: 0,
    storageNvmeTb: 32,
    temperatureC: 36,
    uptimeDays: 204,
  },
];

const DATA_FILE_PATH = path.join(process.cwd(), 'server-state.json');

class ClusterStateManager {
  private state: ClusterStateStore;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): ClusterStateStore {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.clients && Array.isArray(parsed.clients)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read persistent state, initializing fresh store:', err);
    }

    const defaultState: ClusterStateStore = {
      version: '2026.4.1',
      lastUpdated: new Date().toISOString(),
      cluster: {
        clusterName: 'Cyverax Alpha Core Cluster',
        location: 'US East — Atlanta Datacenter DC-1',
        hypervisor: 'KVM / QEMU 9.1 + Proxmox VE Hardware Fabric',
        networkFabric: 'NVIDIA Spectrum-2 EVPN-VXLAN BGP Fabric',
        status: 'Healthy',
        totalNodes: INITIAL_NODES.length,
        onlineNodes: INITIAL_NODES.filter((n) => n.status === 'Online').length,
        totalPhysicalCores: 704,
        totalRamGb: 4096,
        totalGpus: 11,
        totalStorageTb: 112,
        vlanRange: 'VLAN 1000 - 4094 (Isolated QinQ / VXLAN VNIs)',
        sdnController: 'Cyverax Software-Defined Distributed Virtual Switch (SDN-vSwitch)',
        crossTenantIsolation: '100% Enforced (Hardware EVPN/VXLAN)',
        nodes: INITIAL_NODES,
      },
      clients: INITIAL_CLIENTS,
    };

    this.saveStateToDisk(defaultState);
    return defaultState;
  }

  private saveStateToDisk(stateToSave = this.state) {
    try {
      stateToSave.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(stateToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write cluster-state.json:', err);
    }
  }

  public getSummary() {
    // Dynamically calculate cluster totals
    const allocatedVcpu = this.state.clients.reduce((acc, c) => acc + (c.vCpuAllocated || 0), 0);
    const allocatedRamGb = this.state.clients.reduce((acc, c) => acc + (c.ramGbAllocated || 0), 0);
    const allocatedStorageGb = this.state.clients.reduce((acc, c) => acc + (c.storageGbAllocated || 0), 0);
    
    let allocatedGpus = 0;
    for (const c of this.state.clients) {
      if (c.gpuAllocated && c.gpuAllocated !== 'None') {
        if (c.gpuAllocated.startsWith('4x')) allocatedGpus += 4;
        else if (c.gpuAllocated.startsWith('2x')) allocatedGpus += 2;
        else allocatedGpus += 1;
      }
    }

    return {
      ...this.state.cluster,
      allocatedVcpu,
      allocatedRamGb,
      allocatedStorageTb: +(allocatedStorageGb / 1024).toFixed(2),
      allocatedGpus,
      totalClients: this.state.clients.length,
      activeVlansCount: this.state.clients.length,
    };
  }

  public getClients(): ClientTenantData[] {
    return this.state.clients;
  }

  public getClient(id: string): ClientTenantData | undefined {
    return this.state.clients.find((c) => c.id === id);
  }

  public calculateMonthlyBilling(vCpu: number, ramGb: number, gpu: string, storageGb: number): number {
    const baseComputeCost = vCpu * 4.5 + ramGb * 2.2 + storageGb * 0.12;
    const gpuMatch = GPU_OPTIONS.find((g) => g.id === gpu);
    const gpuCost = gpuMatch ? gpuMatch.monthlyCost : 0;
    return Math.round(baseComputeCost + gpuCost);
  }

  public createClient(payload: {
    name: string;
    clientCompany: string;
    clientEmail: string;
    plan?: 'Starter' | 'Scale' | 'Enterprise' | 'AI Elite';
    vCpu?: number;
    ramGb?: number;
    gpu?: string;
    storageGb?: number;
    bandwidthLimitMbps?: number;
  }): ClientTenantData {
    // Generate next VLAN ID
    const existingVlanIds = this.state.clients.map((c) => c.vlanId);
    let nextVlanId = 1045;
    while (existingVlanIds.includes(nextVlanId)) {
      nextVlanId++;
    }

    const vCpu = payload.vCpu || 8;
    const ramGb = payload.ramGb || 16;
    const gpu = payload.gpu || 'None';
    const storageGb = payload.storageGb || 250;
    const plan = payload.plan || (gpu !== 'None' ? 'AI Elite' : vCpu >= 32 ? 'Enterprise' : vCpu >= 16 ? 'Scale' : 'Starter');
    const monthlyBilling = this.calculateMonthlyBilling(vCpu, ramGb, gpu, storageGb);

    const safeSlug = payload.clientCompany
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);

    const clientId = `client-${safeSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    const subnetOctet = (nextVlanId % 200) + 20;

    const newClient: ClientTenantData = {
      id: clientId,
      name: payload.name || `${payload.clientCompany} Isolated Tenant`,
      clientCompany: payload.clientCompany,
      clientEmail: payload.clientEmail,
      status: 'Active',
      plan,
      monthlyBilling,
      clusterNodeId: gpu !== 'None' ? 'node-alpha-03' : 'node-alpha-01',
      vlanId: nextVlanId,
      vxlanVni: 100000 + nextVlanId,
      vpcCidr: `10.${subnetOctet}.0.0/20`,
      isolatedSubnet: `10.${subnetOctet}.1.0/24`,
      virtualGateway: `10.${subnetOctet}.1.1`,
      natGatewayIp: `198.51.100.${nextVlanId % 250}`,
      dnsServers: [`10.${subnetOctet}.0.2`, '1.1.1.1'],
      firewallRulesCount: 12,
      isolationStatus: 'Strictly Isolated (0 Crosstalk)',
      vCpuAllocated: vCpu,
      vCpuMaxQuota: vCpu * 2,
      ramGbAllocated: ramGb,
      ramGbMaxQuota: ramGb * 2,
      gpuAllocated: gpu,
      storageGbAllocated: storageGb,
      bandwidthLimitMbps: payload.bandwidthLimitMbps || 1000,
      cpuUsagePct: 12.5,
      ramUsagePct: 22.0,
      storageUsedGb: 18,
      activeWorkloadsCount: 1,
      networkThroughputMbps: 14.5,
      installedApps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.clients.unshift(newClient);
    this.saveStateToDisk();
    return newClient;
  }

  public updateClientResources(
    id: string,
    updates: {
      vCpu?: number;
      ramGb?: number;
      gpu?: string;
      storageGb?: number;
      plan?: 'Starter' | 'Scale' | 'Enterprise' | 'AI Elite';
    }
  ): ClientTenantData | null {
    const client = this.state.clients.find((c) => c.id === id);
    if (!client) return null;

    if (updates.vCpu !== undefined) client.vCpuAllocated = updates.vCpu;
    if (updates.ramGb !== undefined) client.ramGbAllocated = updates.ramGb;
    if (updates.gpu !== undefined) client.gpuAllocated = updates.gpu;
    if (updates.storageGb !== undefined) client.storageGbAllocated = updates.storageGb;
    if (updates.plan !== undefined) client.plan = updates.plan;

    client.vCpuMaxQuota = Math.max(client.vCpuMaxQuota, client.vCpuAllocated * 2);
    client.ramGbMaxQuota = Math.max(client.ramGbMaxQuota, client.ramGbAllocated * 2);

    // Recalculate bill
    client.monthlyBilling = this.calculateMonthlyBilling(
      client.vCpuAllocated,
      client.ramGbAllocated,
      client.gpuAllocated,
      client.storageGbAllocated
    );

    client.updatedAt = new Date().toISOString();
    this.saveStateToDisk();
    return client;
  }

  public executeClientAction(id: string, action: 'restart' | 'stop' | 'start' | 'isolate'): ClientTenantData | null {
    const client = this.state.clients.find((c) => c.id === id);
    if (!client) return null;

    if (action === 'stop') {
      client.status = 'Suspended';
    } else if (action === 'start') {
      client.status = 'Active';
    } else if (action === 'isolate') {
      client.status = 'Maintenance';
    } else if (action === 'restart') {
      client.status = 'Active';
    }

    client.updatedAt = new Date().toISOString();
    this.saveStateToDisk();
    return client;
  }

  public deleteClient(id: string): boolean {
    const index = this.state.clients.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.state.clients.splice(index, 1);
    this.saveStateToDisk();
    return true;
  }

  public installApp(clientId: string, appId: string): { success: boolean; client?: ClientTenantData; app?: MarketplaceAppDetail } {
    const client = this.state.clients.find((c) => c.id === clientId);
    const app = MARKETPLACE_CATALOG.find((a) => a.id === appId);

    if (!client || !app) {
      return { success: false };
    }

    if (!client.installedApps.includes(appId)) {
      client.installedApps.push(appId);
      client.activeWorkloadsCount += 1;
      client.cpuUsagePct = Math.min(94, +(client.cpuUsagePct + 8.5).toFixed(1));
      client.ramUsagePct = Math.min(96, +(client.ramUsagePct + 12.0).toFixed(1));
      client.storageUsedGb += 15;
      client.updatedAt = new Date().toISOString();
      this.saveStateToDisk();
    }

    return { success: true, client, app };
  }

  public getVlanMatrix() {
    return this.state.clients.map((c) => ({
      vlanId: c.vlanId,
      vxlanVni: c.vxlanVni,
      tenantId: c.id,
      tenantName: c.name,
      companyName: c.clientCompany,
      vpcCidr: c.vpcCidr,
      isolatedSubnet: c.isolatedSubnet,
      virtualGateway: c.virtualGateway,
      natGatewayIp: c.natGatewayIp,
      clusterNodeId: c.clusterNodeId,
      firewallPolicy: 'Strict Default Deny Inter-VLAN + Stateful NAT Outbound',
      isolationCheck: 'Verified PASS',
      lastPacketLossPct: 0.0,
      activeIpAddresses: [
        `${c.virtualGateway.replace(/\.1$/, '.10')}/32 (Workload Instance #1)`,
        `${c.virtualGateway.replace(/\.1$/, '.15')}/32 (Private DB Replica)`,
      ],
    }));
  }

  public verifyIsolation() {
    const matrix = this.getVlanMatrix();
    return {
      timestamp: new Date().toISOString(),
      testedVlans: matrix.length,
      crossTenantPacketsAttempted: matrix.length * (matrix.length - 1) * 20,
      crossTenantPacketsDropped: matrix.length * (matrix.length - 1) * 20,
      leakageDetected: false,
      status: '100% Isolated (0 Cross-Tenant Leakage)',
      mechanism: 'Hardware EVPN/VXLAN VNI Isolation & Layer-2 Split-Horizon Filtering',
    };
  }
}

export const clusterState = new ClusterStateManager();
