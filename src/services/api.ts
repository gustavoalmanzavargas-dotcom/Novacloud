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

async function readJson<T>(res: Response, fallback: string): Promise<T> {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.ok ? fallback : `${fallback} (server returned non-JSON response)`);
  }
  if (!res.ok) throw new Error(body?.error || fallback);
  return body as T;
}

export const api = {
  // Cluster
  async getClusterSummary(): Promise<MasterClusterSummary> {
    const res = await fetch('/api/cluster/summary');
    return readJson<MasterClusterSummary>(res, 'Failed to fetch cluster summary');
  },

  // Clients / Tenants
  async getClientTenants(): Promise<ClientTenantInstance[]> {
    const res = await fetch('/api/clients');
    return readJson<ClientTenantInstance[]>(res, 'Failed to fetch client instances');
  },

  async getClientTenant(id: string): Promise<ClientTenantInstance> {
    const res = await fetch(`/api/clients/${id}`);
    return readJson<ClientTenantInstance>(res, 'Failed to fetch client details');
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
    return readJson<ClientTenantInstance>(res, 'Failed to deploy client instance');
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
    return readJson<ClientTenantInstance>(res, 'Failed to update client resources');
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
    return readJson<ClientTenantInstance>(res, 'Failed to execute action');
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
    return readJson<{ total: number; apps: MarketplaceAppResponse[]; gpuOptions: GpuTierOption[] }>(res, 'Failed to fetch marketplace catalog');
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
    return readJson<{ totalVlans: number; vlanRange: string; fabric: string; matrix: VlanNetworkMapping[] }>(res, 'Failed to fetch VLAN matrix');
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
    return readJson<any>(res, 'Failed to run isolation verification');
  },
};
