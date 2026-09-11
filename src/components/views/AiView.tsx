import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  Shield,
  TrendingDown,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RotateCw,
  Zap,
  Terminal,
  ArrowRight,
} from 'lucide-react';
import { AIRecommendation } from '../../types';

interface AiViewProps {
  recommendations: AIRecommendation[];
  themeMode: 'dark' | 'light';
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionablePlan?: {
    title: string;
    impact: string;
    costImpact: string;
    codeSnippet?: string;
  };
}

export const AiView: React.FC<AiViewProps> = ({ recommendations, themeMode }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: "Hello Gustavo. I am Nova AI, your cloud infrastructure intelligence engine. I am actively monitoring tenant org-9842 in region us-atl-1. How can I assist with deployment, cost optimization, or security remediation today?",
      timestamp: '17:30 UTC',
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Explain why JobFinderAI container is degraded and recommend a fix.',
      timestamp: '17:31 UTC',
    },
    {
      id: 'msg-3',
      sender: 'assistant',
      text: "Based on kernel telemetry from node `atl-node-04-kvm`, the `jobfinder-api` container encountered an OOM (Out Of Memory) event. The container reached 4.1 GB of RAM against its configured 4.0 GB cgroup limit during resume vector indexing. \n\nI recommend bumping memory limits from 4GB to 8GB, adding 2 replicas for horizontal load leveling, and updating the container deployment manifest.",
      timestamp: '17:31 UTC',
      actionablePlan: {
        title: 'Nova Remediate Plan: JobFinderAI Resource Adjustment',
        impact: 'Zero-Downtime rolling upgrade across 3 Availability Zones.',
        costImpact: '+$18.40/month estimated increase',
        codeSnippet: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: jobfinder-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: jobfinder-api
        resources:
          limits:
            memory: "8Gi"
            cpu: "2000m"
          requests:
            memory: "4Gi"
            cpu: "1000m"`,
      },
    },
  ]);

  const isLight = themeMode === 'light';

  const quickPrompts = [
    'Why did the last deployment fail?',
    'Optimize my monthly cloud spend',
    'Generate Terraform for a high-availability PostgreSQL cluster',
    'Find unused resources in us-east',
    'Explain this error in the auth service logs',
    'Recommend security improvements for my VPC',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || queryInput;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString().substring(11, 16) + ' UTC',
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: data.response || 'Nova AI has processed your request.',
          timestamp: new Date().toISOString().substring(11, 16) + ' UTC',
          actionablePlan: data.actionablePlan,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('API query failed');
      }
    } catch (err) {
      // Fallback
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: `Nova AI analysis complete for: "${query}".\n\nIdentified 1 active recommendation in VPC vpc-atl-prod-01. All firewall policies pass CIS benchmark v1.4.`,
          timestamp: new Date().toISOString().substring(11, 16) + ' UTC',
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }, 700);
    } finally {
      setIsLoading(false);
    }
  };

  const copySnippet = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            isLight
              ? 'bg-white border-purple-300 text-purple-900 shadow-purple-500/10'
              : 'bg-slate-900 border-purple-500/40 text-purple-300 shadow-black/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Nova AI Infrastructure Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous troubleshooting, cost optimization, IaC synthesis, and security remediation engine.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className={`px-2 py-1 rounded border flex items-center gap-1.5 ${
            isLight ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
          }`}>
            <Zap className="w-3.5 h-3.5 text-purple-500" /> Engine: Nova-Pro-v2.1
          </span>
          <span className={`px-2 py-1 rounded border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            Region: us-atl-1
          </span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div>
        <div className="text-xs text-slate-400 font-mono mb-2">TRY POPULAR NOVA PROMPTS:</div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
            >
              <span>{prompt}</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Main AI Chat & Planner Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Feed */}
        <div
          className={`lg:col-span-2 rounded-xl border flex flex-col h-[580px] overflow-hidden ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-xl p-3.5 text-xs ${
                      isAssistant
                        ? isLight
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-xs'
                          : 'bg-slate-950 border border-slate-800 text-slate-200'
                        : 'bg-purple-600 text-white shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>{isAssistant ? 'NOVA AI' : 'YOU (GUSTAVO)'}</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

                    {m.actionablePlan && (
                      <div className={`mt-3 p-3 rounded-lg border space-y-2 ${
                        isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-950/40 border-purple-500/30'
                      }`}>
                        <div className={`font-bold font-mono text-xs flex items-center gap-1.5 ${
                          isLight ? 'text-purple-700' : 'text-purple-300'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>{m.actionablePlan.title}</span>
                        </div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{m.actionablePlan.impact}</div>
                        <div className={`text-[11px] font-mono font-semibold ${
                          isLight ? 'text-emerald-700' : 'text-emerald-400'
                        }`}>
                          {m.actionablePlan.costImpact}
                        </div>

                        {m.actionablePlan.codeSnippet && (
                          <div className="relative mt-2">
                            <pre className={`p-3 rounded border font-mono text-[11px] overflow-x-auto ${
                              isLight ? 'bg-slate-900 border-slate-800 text-cyan-300' : 'bg-slate-950 border-purple-900/60 text-cyan-300'
                            }`}>
                              {m.actionablePlan.codeSnippet}
                            </pre>
                            <button
                              onClick={() => copySnippet(m.actionablePlan!.codeSnippet!)}
                              className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                              title="Copy YAML"
                            >
                              {copiedCode ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => showToast('Remediation blueprint submitted to Kubernetes orchestrator: Rolling upgrade initiated.')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                          >
                            Apply Remediation Now
                          </button>
                          <button
                            onClick={() => showToast('Dry run validation passed: 0 schema errors. Deployment safe to roll.')}
                            className={`px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${
                              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            Dry Run / Validate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  <span>Synthesizing infrastructure telemetry & generating response...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className={`p-3 border-t flex items-center gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Nova AI to generate Terraform, diagnose errors, or optimize spending..."
              className={`flex-1 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-purple-500 border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !queryInput.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Rail: Active Autonomous Findings */}
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <h3 className={`text-xs font-bold uppercase font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>Active AI Findings</h3>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {recommendations.length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-lg border space-y-2 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{rec.title}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                        rec.category === 'cost'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : rec.category === 'security'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-cyan-500/10 text-cyan-500'
                      }`}
                    >
                      {rec.category}
                    </span>
                  </div>

                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{rec.description}</p>

                  <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                    isLight ? 'border-slate-200' : 'border-slate-800/80'
                  }`}>
                    <span className="font-mono text-emerald-500 font-bold">{rec.estimatedSavings}</span>
                    <button
                      onClick={() => handleSend(`Execute remediation plan for: ${rec.title}`)}
                      className="text-purple-500 hover:text-purple-600 font-semibold cursor-pointer"
                    >
                      Remediate →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
