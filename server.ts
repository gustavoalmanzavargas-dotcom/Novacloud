import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "Cyverax Nova Enterprise Cloud Console",
    version: "2026.4.1",
    timestamp: new Date().toISOString(),
  });
});

// Lazy initialize Gemini client if key is present
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// API: Nova AI Assistant Endpoint
app.post("/api/ai/query", async (req, res) => {
  const { prompt, context } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const ai = getAIClient();

  if (ai) {
    try {
      const systemInstruction = `You are Nova AI, an enterprise-grade cloud infrastructure and automation assistant for Cyverax Nova.
You assist cloud architects, DevOps engineers, and administrators with infrastructure provisioning, health diagnostics, security remediation, and cost optimization.
Always provide precise, technical, actionable recommendations.
When asked to deploy, provision, troubleshoot, or configure resources, provide:
1. A concise technical explanation of the action or diagnostic.
2. A structured execution plan including steps, affected resources, and monthly cost estimate if applicable.
Keep responses enterprise-grade, clean, and direct.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nCurrent Infrastructure Context: ${JSON.stringify(
                  context || {
                    region: "US East — Atlanta (us-atl-1)",
                    environment: "Production",
                    runningVMs: 8,
                    containers: 12,
                    databases: 3,
                  }
                )}\n\nUser Request: ${prompt}`,
              },
            ],
          },
        ],
      });

      const responseText = response.text || "Nova AI finished processing your request.";
      return res.json({
        source: "gemini",
        response: responseText,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Gemini API error in Nova AI:", err?.message || err);
      // Fallback gracefully to intelligent deterministic cloud response
    }
  }

  // Built-in intelligent cloud platform intelligence fallback
  const lower = prompt.toLowerCase();
  let analysis = "";
  let plan: any = null;

  if (lower.includes("deploy ubuntu") || lower.includes("cpu") && lower.includes("ram")) {
    analysis = "Nova AI has analyzed the provisioning request against your active VPC (vpc-atl-prod-01) and security policies.";
    plan = {
      action: "Provision Virtual Machine",
      specifications: {
        name: "nova-compute-worker-03",
        os: "Ubuntu 24.04 LTS (Noble Numbat)",
        vCPU: 4,
        memory: "16 GB DDR5 ECC",
        storage: "120 GB NVMe Gen4",
        vpc: "vpc-atl-prod-01 (10.15.0.0/16)",
        subnet: "subnet-priv-01 (10.15.2.0/24)",
        securityGroup: "sg-internal-workers",
        region: "US East — Atlanta (us-atl-1)",
      },
      estimatedMonthlyCost: "$94.20",
      items: [
        "Allocate 4 vCPU & 16 GB ECC RAM on Atlanta Cluster 02",
        "Provision 120 GB High-IOPS NVMe boot volume",
        "Assign private IP 10.15.2.148 in subnet-priv-01",
        "Attach security policy 'sg-internal-workers' (Port 22 restricted to Bastion)",
        "Inject cloud-init bootstrap and Cyverax Telemetry Agent",
      ],
    };
  } else if (lower.includes("jobfinder-api") || lower.includes("unhealthy")) {
    analysis = "Nova AI investigated container telemetry for 'jobfinder-api' (Pod ID: k8s-jobfinder-88df-px2): Memory limit threshold reached (94.2% usage). Container encountered 2 OOM (Out Of Memory) restarts in the last 45 minutes during batch indexing.";
    plan = {
      action: "Container Self-Healing & Scaling Plan",
      specifications: {
        application: "JobFinderAI (jobfinder-api)",
        currentLimits: "2 vCPU / 2048 MB RAM",
        proposedLimits: "2 vCPU / 4096 MB RAM",
        hpa: "Autoscale 2 -> 4 replicas",
      },
      estimatedMonthlyCost: "+$18.40",
      items: [
        "Increase container memory limit from 2Gi to 4Gi to prevent OOM termination",
        "Roll out rolling update across 3 worker replicas without downtime",
        "Enable Prometheus memory alert threshold at 80% to preempt spikes",
        "Verify health probe /api/v1/health responds with 200 OK (<45ms)",
      ],
    };
  } else if (lower.includes("backup policy") || lower.includes("backup")) {
    analysis = "Nova AI prepared an enterprise immutable snapshot policy for production virtual machines, compliant with SOC2 and ISO27001 retention schedules.";
    plan = {
      action: "Configure Automated Snapshot Policy",
      specifications: {
        target: "All Production VMs (Tag: env=production)",
        frequency: "Every 6 hours + Daily cumulative rollup",
        retention: "30 days local + 90 days cold archive",
        geoRedundancy: "Cross-region replication to US West (Oregon)",
      },
      estimatedMonthlyCost: "$32.50",
      items: [
        "Create Nova Backup Rule 'pol-prod-vm-gold'",
        "Enable zero-downtime VSS/LVM snapshot quiescing",
        "Configure cross-region replication to us-west-oregon vault",
        "Assign KMS encryption key 'cyverax-kms-prod-vault'",
      ],
    };
  } else if (lower.includes("block this ip") || lower.includes("firewall")) {
    analysis = "Nova AI generated an emergency Edge Firewall ingress drop rule across all regional gateways.";
    plan = {
      action: "Edge Firewall Ingress Block",
      specifications: {
        ruleName: "emergency-drop-suspicious-ip",
        targetGateways: "All Edge Firewalls (Atlanta, Oregon, Frankfurt)",
        protocol: "ALL Protocols (TCP, UDP, ICMP)",
        action: "REJECT / DROP SILENTLY",
      },
      estimatedMonthlyCost: "$0.00 (Included)",
      items: [
        "Push immediate drop rule to Cloudflare & Cyverax BGP edge router",
        "Terminate any active TCP sessions matching IP",
        "Log security telemetry event to Cyverax Security Center",
      ],
    };
  } else {
    analysis = `Nova AI processed: "${prompt}". Validated against Cyverax Nova resource graph, policy engine, and IAM permissions.`;
    plan = {
      action: "Infrastructure Recommendation",
      specifications: {
        region: "US East — Atlanta",
        environment: "Production",
        status: "Validated",
      },
      estimatedMonthlyCost: "$42.00",
      items: [
        "Audit existing active workloads and utilization thresholds",
        "Apply recommended configuration tuning and monitoring hooks",
        "Verify security compliance against Cyverax Nova baseline",
      ],
    };
  }

  res.json({
    source: "nova-engine",
    response: analysis,
    plan,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cyverax Nova Console server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
