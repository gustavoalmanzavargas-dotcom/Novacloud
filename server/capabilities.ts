export function featureMap(
  host: any,
  connected: boolean,
  aiConfigured: boolean,
) {
  const c = host?.capabilities || {};
  const feature = (available: boolean, reason: string) => ({
    available: Boolean(available),
    reason: available ? null : reason,
  });
  return {
    virtualMachines: feature(
      connected && c.qemu && c.qemuImg,
      "Connect a Nova Agent with QEMU and qemu-img installed.",
    ),
    kvm: feature(
      connected && c.kvm,
      "KVM acceleration is unavailable. QEMU software emulation remains available when QEMU is installed.",
    ),
    tapNetworking: feature(
      connected && c.tapNetworking,
      "TAP requires /dev/net/tun, an available bridge, and host network privileges.",
    ),
    containers: feature(
      connected && c.containers,
      c.containerDiagnostics?.reason ||
        "Native container permissions or dependencies are unavailable.",
    ),
    networks: feature(
      connected && c.bridgeCreation && c.nftables,
      "Network provisioning requires Linux bridge creation and nftables privileges.",
    ),
    volumes: feature(
      connected && c.qemuImg,
      "Connect a Nova Agent with qemu-img installed and an assigned disk directory.",
    ),
    applications: feature(
      connected && c.applications,
      "Git deployments require Git, npm, and systemd on the compute host.",
    ),
    databases: feature(true, ""),
    users: feature(true, ""),
    ai: feature(
      aiConfigured,
      "Set GEMINI_API_KEY on the controller to enable AI advice.",
    ),
    objectStorage: feature(
      false,
      "An S3 object-storage engine is not implemented in this release.",
    ),
    loadBalancers: feature(
      false,
      "The load-balancer engine is not implemented in this release.",
    ),
    autoscaling: feature(
      false,
      "The autoscaling scheduler is not implemented in this release.",
    ),
    kubernetes: feature(
      false,
      "Kubernetes cluster provisioning is not implemented in this release.",
    ),
    marketplace: feature(true, ""),
    billing: feature(true, ""),
  };
}
