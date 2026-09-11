import React, { useState } from 'react';
import {
  X,
  Cpu,
  Boxes,
  Database,
  HardDrive,
  Network,
  Sparkles,
  Shield,
  AppWindow,
  ShoppingBag,
  ArrowRight,
  Server,
  Layers,
  Globe,
  Radio,
  Lock,
} from 'lucide-react';
import { ActiveView } from '../types';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ActiveView) => void;
  onLaunchDeploymentWorkflow?: () => void;
  themeMode?: 'dark' | 'light';
}

type ResourceCategory =
  | 'All'
  | 'Compute'
  | 'Applications'
  | 'Containers'
  | 'Databases'
  | 'Storage'
  | 'Networking'
  | 'AI'
  | 'Security'
  | 'Marketplace';

interface LauncherItem {
  id: string;
  name: string;
  category: Exclude<ResourceCategory, 'All'>;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  view: ActiveView;
  badge?: string;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLaunchDeploymentWorkflow,
  themeMode = 'dark',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('All');
  const [searchFilter, setSearchFilter] = useState('');
  const isLight = themeMode === 'light';

  if (!isOpen) return null;

  const items: LauncherItem[] = [
    {
      id: 'res-vm',
      name: 'Virtual Machine',
      category: 'Compute',
      description: 'High-performance cloud virtual machine with dedicated vCPU and fast NVMe storage.',
      icon: Cpu,
      view: 'compute',
      badge: 'Popular',
    },
    {
      id: 'res-container',
      name: 'Container Service',
      category: 'Containers',
      description: 'Run microservices and Docker workloads without managing underlying VM infrastructure.',
      icon: Boxes,
      view: 'applications',
    },
    {
      id: 'res-k8s',
      name: 'Kubernetes Cluster',
      category: 'Containers',
      description: 'Production multi-zone Kubernetes (K8s) control plane with automated scaling.',
      icon: Layers,
      view: 'applications',
      badge: 'Enterprise',
    },
    {
      id: 'res-app',
      name: 'Application (Guided Deploy)',
      category: 'Applications',
      description: 'Deploy web applications (Cyverax Portal, JobFinderAI) from Git repository or Docker image.',
      icon: AppWindow,
      view: 'applications',
      badge: '6-Step Flow',
    },
    {
      id: 'res-pg',
      name: 'PostgreSQL Database',
      category: 'Databases',
      description: 'Fully managed PostgreSQL with automated failover, PITR backups, and pgvector extension.',
      icon: Database,
      view: 'databases',
      badge: 'v16.3',
    },
    {
      id: 'res-redis',
      name: 'Redis Cache Cluster',
      category: 'Databases',
      description: 'Ultra-low latency in-memory data store for caching, session stores, and pub/sub queues.',
      icon: Database,
      view: 'databases',
    },
    {
      id: 'res-storage-obj',
      name: 'Object Storage Bucket',
      category: 'Storage',
      description: 'S3-compatible scalable cloud storage for assets, backups, logs, and unstructured data.',
      icon: HardDrive,
      view: 'storage',
    },
    {
      id: 'res-storage-blk',
      name: 'Block Storage Volume',
      category: 'Storage',
      description: 'High-IOPS persistent NVMe SSD drive that attaches to any Cyverax virtual machine.',
      icon: HardDrive,
      view: 'storage',
    },
    {
      id: 'res-vpc',
      name: 'Virtual Network (VPC)',
      category: 'Networking',
      description: 'Isolated private cloud software-defined network with customizable CIDR and routing.',
      icon: Network,
      view: 'networking',
    },
    {
      id: 'res-alb',
      name: 'Application Load Balancer',
      category: 'Networking',
      description: 'High-availability L7 load balancer with automated SSL and health check probing.',
      icon: Globe,
      view: 'networking',
    },
    {
      id: 'res-vpn',
      name: 'Site-to-Site VPN Gateway',
      category: 'Networking',
      description: 'Secure IPsec tunnel connecting your on-premise datacenter to your Cyverax VPC.',
      icon: Lock,
      view: 'networking',
    },
    {
      id: 'res-ai',
      name: 'Nova AI Automation Service',
      category: 'AI',
      description: 'Autonomous cloud assistant that executes infrastructure blueprints and remediations.',
      icon: Sparkles,
      view: 'ai',
      badge: 'Nova AI',
    },
    {
      id: 'res-firewall',
      name: 'Security Shield & Firewall Rule',
      category: 'Security',
      description: 'Stateful packet inspection and Web Application Firewall (WAF) filtering.',
      icon: Shield,
      view: 'security',
    },
    {
      id: 'res-market',
      name: 'Marketplace One-Click Template',
      category: 'Marketplace',
      description: 'Deploy pre-packaged open source & commercial software stacks in minutes.',
      icon: ShoppingBag,
      view: 'marketplace',
    },
  ];

  const categories: ResourceCategory[] = [
    'All',
    'Compute',
    'Applications',
    'Containers',
    'Databases',
    'Storage',
    'Networking',
    'AI',
    'Security',
    'Marketplace',
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      !searchFilter ||
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelect = (item: LauncherItem) => {
    onClose();
    if (item.id === 'res-app' && onLaunchDeploymentWorkflow) {
      onLaunchDeploymentWorkflow();
    } else {
      onNavigate(item.view);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-opacity ${
          isLight ? 'bg-slate-900/40 backdrop-blur-xs' : 'bg-slate-950/80 backdrop-blur-xs'
        }`}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        id="create-resource-launcher-dialog"
        className={`relative w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 border ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            : 'bg-slate-900 border-slate-700 text-white shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/80'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-600 flex items-center justify-center text-xs font-bold font-mono">
                +
              </div>
              <h2 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Create Resource
              </h2>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Select an infrastructure component or application service to provision in Cyverax Nova.
            </p>
          </div>

          <button
            id="close-create-resource-modal-btn"
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div
          className={`px-6 py-2.5 border-b flex flex-wrap items-center gap-1.5 overflow-x-auto ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? isLight
                    ? 'bg-cyan-50 text-cyan-700 font-semibold border border-cyan-300'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`group p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  isLight
                    ? 'border-slate-200 hover:border-cyan-500 bg-white hover:bg-cyan-50/20 shadow-xs'
                    : 'border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded transition-colors ${
                          isLight
                            ? 'bg-slate-100 group-hover:bg-cyan-100 text-slate-700 group-hover:text-cyan-700'
                            : 'bg-slate-800 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold transition-colors ${
                            isLight
                              ? 'text-slate-900 group-hover:text-cyan-700'
                              : 'text-white group-hover:text-cyan-300'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className={`text-[10px] font-mono uppercase ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.category}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded border ${
                          isLight
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs line-clamp-2 mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>

                <div
                  className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-medium ${
                    isLight
                      ? 'border-slate-100 text-cyan-600'
                      : 'border-slate-800/60 text-cyan-400'
                  }`}
                >
                  <span>Configure & Launch</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isLight
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : 'border-slate-800 bg-slate-950/80 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Target Region:</span>
            <span className={`font-semibold font-mono ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              US East — Atlanta (us-atl-1)
            </span>
          </div>
          <button
            onClick={onClose}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
