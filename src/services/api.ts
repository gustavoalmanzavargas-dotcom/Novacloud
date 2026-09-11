import { ClientTenantInstance, MasterClusterSummary, VlanNetworkMapping } from '../types';

export interface MarketplaceAppResponse {
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

export interface GpuTierOption {
  id: string;
  name: string;
  monthlyCost: number;
}

export const api = {
  // Cluster
  async getClusterSummary(): Promise<MasterClusterSummary> {
    const res = await fetch('/api/cluster/summary');
    if (!res.ok) throw new Error('Failed to fetch cluster summary');
    return res.json();
  },

  // Clients / Tenants
  async getClientTenants(): Promise<ClientTenantInstance[]> {
    const res = await fetch('/api/clients');
    if (!res.ok) throw new Error('Failed to fetch client instances');
    return res.json();
  },

  async getClientTenant(id: string): Promise<ClientTenantInstance> {
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch client details');
    return res.json();
  },

  async deployClientTenant(payload: {
    name: string;
    clientCompany: string;
    clientEmail: string;
    plan?: string;
    vCpu?: number;
    ramGb?: number;
    gpu?: string;
    storageGb?: number;
    bandwidthLimitMbps?: number;
  }): Promise<ClientTenantInstance> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deploy client instance');
    }
    return res.json();
  },

  async updateClientResources(
    id: string,
    updates: {
      vCpu?: number;
      ramGb?: number;
      gpu?: string;
      storageGb?: number;
      plan?: string;
    }
  ): Promise<ClientTenantInstance> {
    const res = await fetch(`/api/clients/${id}/resources`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update client resources');
    }
    return res.json();
  },

  async executeClientAction(
    id: string,
    action: 'restart' | 'stop' | 'start' | 'isolate'
  ): Promise<ClientTenantInstance> {
    const res = await fetch(`/api/clients/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute action');
    }
    return res.json();
  },

  async deleteClientTenant(id: string): Promise<void> {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete client');
    }
  },

  // Marketplace
  async getMarketplaceCatalog(): Promise<{ total: number; apps: MarketplaceAppResponse[]; gpuOptions: GpuTierOption[] }> {
    const res = await fetch('/api/marketplace/catalog');
    if (!res.ok) throw new Error('Failed to fetch marketplace catalog');
    return res.json();
  },

  async installMarketplaceApp(clientId: string, appId: string): Promise<{ success: boolean; message: string; client: ClientTenantInstance }> {
    const res = await fetch('/api/marketplace/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, appId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to install application');
    }
    return res.json();
  },

  // VLAN & Network Virtualization
  async getVlanMatrix(): Promise<{ totalVlans: number; vlanRange: string; fabric: string; matrix: VlanNetworkMapping[] }> {
    const res = await fetch('/api/vlan/matrix');
    if (!res.ok) throw new Error('Failed to fetch VLAN matrix');
    return res.json();
  },

  async verifyVlanIsolation(): Promise<{
    timestamp: string;
    testedVlans: number;
    crossTenantPacketsAttempted: number;
    crossTenantPacketsDropped: number;
    leakageDetected: boolean;
    status: string;
    mechanism: string;
  }> {
    const res = await fetch('/api/vlan/verify', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run isolation verification');
    return res.json();
  },
};
