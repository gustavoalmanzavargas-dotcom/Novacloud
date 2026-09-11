import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Code2,
  Copy,
  Check,
  Play,
  Key,
  ExternalLink,
  BookOpen,
  Layers,
  Send,
} from 'lucide-react';

interface DevToolsViewProps {
  themeMode?: 'dark' | 'light';
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
}

export const DevToolsView: React.FC<DevToolsViewProps> = ({
  themeMode = 'dark',
  activeSubTab,
  onTabChange,
}) => {
  const isLight = themeMode === 'light';
  const [activeTab, setActiveTab] = useState<'cli' | 'api' | 'terraform'>(
    (activeSubTab as 'cli' | 'api' | 'terraform') || 'cli'
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'DELETE'>('GET');
  const [selectedEndpoint, setSelectedEndpoint] = useState('/v2/cluster/status');

  useEffect(() => {
    if (activeSubTab && (activeSubTab === 'cli' || activeSubTab === 'api' || activeSubTab === 'terraform')) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'cli' | 'api' | 'terraform') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRunApiTest = () => {
    setTestingApi(true);
    setApiResponse(null);
    setTimeout(() => {
      setApiResponse(
        JSON.stringify(
          {
            status: 200,
            region: 'us-atl-1',
            tenant: 'org-9842',
            health: 'ALL_OPERATIONAL',
            vms_running: 8,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
      setTestingApi(false);
    }, 600);
  };

  const cliSnippet = `# 1. Install Cyverax Nova CLI
curl -fsSL https://get.cyverax.cloud/install.sh | bash

# 2. Authenticate session
cyverax auth login --tenant org-9842

# 3. List active workloads
cyverax compute vms list --region us-atl-1`;

  const terraformSnippet = `terraform {
  required_providers {
    cyverax = {
      source  = "cyverax/cloud"
      version = "~> 2.4.0"
    }
  }
}

provider "cyverax" {
  api_token = var.cyverax_token
  region    = "us-atl-1"
}

resource "cyverax_instance" "worker" {
  name     = "api-worker-tf"
  vcpu     = 4
  memory   = 16
  os_image = "ubuntu-24.04-lts"
}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div
        className={`p-6 rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800 shadow-lg'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-500 uppercase">
                DEVELOPER ECOSYSTEM & AUTOMATION
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">V2.4 REST & CLI</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Developer Tools & Infrastructure as Code
            </h1>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Access the Cyverax Nova CLI, official Terraform provider specifications, REST APIs, and automated deployment pipelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://docs.cyverax.cloud"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
              <span>Full API Reference</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* DevTools Submenu Tab Bar */}
      <div
        className={`flex items-center gap-1 border-b pb-px overflow-x-auto ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <button
          id="tab-dev-cli"
          type="button"
          onClick={() => handleTabSwitch('cli')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'cli'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>CLI Tooling</span>
        </button>

        <button
          id="tab-dev-terraform"
          type="button"
          onClick={() => handleTabSwitch('terraform')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'terraform'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Terraform Provider</span>
        </button>

        <button
          id="tab-dev-api"
          type="button"
          onClick={() => handleTabSwitch('api')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'api'
              ? isLight
                ? 'border-cyan-600 text-cyan-700 bg-cyan-50/50'
                : 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : isLight
              ? 'border-transparent text-slate-500 hover:text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>REST API & Playground</span>
        </button>
      </div>

      {activeTab === 'cli' && (
        <div className="space-y-6">
          {/* CLI Section */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-500" />
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Cyverax Nova CLI Quickstart
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(cliSnippet, 'cli')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-600 hover:underline cursor-pointer"
                >
                  {copiedSection === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'cli' ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>
              <p className={`text-xs mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Control tenant resources directly from your local shell, CI/CD runners, and Docker containers.
              </p>
              <pre className="p-4 rounded-lg bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                {cliSnippet}
              </pre>
            </div>
          </div>

          {/* Useful CLI commands */}
          <div
            className={`p-5 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className={`text-sm font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Common CLI Commands Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { cmd: 'cyverax compute vms create --flavor cpu-std-4', desc: 'Provision a new virtual server' },
                { cmd: 'cyverax network vpc peers list', desc: 'Inspect regional VPC interconnects' },
                { cmd: 'cyverax apps deploy -f cyverax.yaml', desc: 'Trigger rolling microservice release' },
                { cmd: 'cyverax telemetry metrics tail --live', desc: 'Stream cluster telemetry stdout' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-300 mb-1">{item.desc}</p>
                  <code className="text-[11px] font-mono text-cyan-400 block bg-black/30 p-1.5 rounded select-all">
                    {item.cmd}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'terraform' && (
        <div className="space-y-6">
          {/* Terraform Section */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-500" />
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Official Terraform & OpenTofu Provider
                  </h3>
                </div>
                <button
                  onClick={() => handleCopy(terraformSnippet, 'tf')}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-600 hover:underline cursor-pointer"
                >
                  {copiedSection === 'tf' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tf' ? 'Copied' : 'Copy HCL'}</span>
                </button>
              </div>
              <p className={`text-xs mb-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Declaratively provision compute nodes, subnets, firewalls, and database clusters.
              </p>
              <pre className="p-4 rounded-lg bg-slate-950 text-purple-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                {terraformSnippet}
              </pre>
            </div>
          </div>

          {/* Official SDKs Banner */}
          <div
            className={`p-5 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <h3 className={`text-sm font-bold mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Available Client SDK Libraries
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Node.js / TypeScript', pkg: 'npm i @cyverax/sdk', ver: 'v2.4.1' },
                { name: 'Python Async SDK', pkg: 'pip install cyverax', ver: 'v2.4.0' },
                { name: 'Go Cloud Client', pkg: 'go get github.com/cyverax/go-sdk', ver: 'v2.3.9' },
              ].map((sdk, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-300">{sdk.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{sdk.ver}</span>
                  </div>
                  <code className="text-[11px] font-mono text-emerald-400 truncate">{sdk.pkg}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        /* REST API Explorer */
        <div
          className={`p-5 rounded-xl border space-y-4 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Interactive REST Endpoint Playground
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Send live authorized requests directly against the Cyverax Cloud control-plane API.
              </p>
            </div>

            <button
              onClick={handleRunApiTest}
              disabled={testingApi}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingApi ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as any)}
              className={`px-3 py-2 text-xs font-mono font-bold rounded-lg border focus:outline-hidden ${
                selectedMethod === 'GET'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : selectedMethod === 'POST'
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="DELETE">DELETE</option>
            </select>

            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className={`flex-1 px-3 py-2 text-xs font-mono rounded-lg border focus:outline-hidden ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-cyan-300'
              }`}
            >
              <option value="/v2/cluster/status">https://api.cyverax.cloud/v2/cluster/status</option>
              <option value="/v2/compute/vms">https://api.cyverax.cloud/v2/compute/vms</option>
              <option value="/v2/security/alerts">https://api.cyverax.cloud/v2/security/alerts</option>
              <option value="/v2/workloads/deploy">https://api.cyverax.cloud/v2/workloads/deploy</option>
            </select>
          </div>

          {apiResponse ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Response Body: Status 200 OK</span>
                <span className="text-emerald-400">Latency: 28ms</span>
              </div>
              <pre className={`p-4 rounded-lg font-mono text-xs overflow-x-auto border ${
                isLight ? 'bg-slate-900 text-emerald-400 border-slate-800' : 'bg-slate-950 text-emerald-400 border-slate-800'
              }`}>
                {apiResponse}
              </pre>
            </div>
          ) : (
            <div className={`py-8 text-center text-xs font-mono rounded-lg border border-dashed ${
              isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              Click "Send Request" above to execute and preview the JSON payload.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
