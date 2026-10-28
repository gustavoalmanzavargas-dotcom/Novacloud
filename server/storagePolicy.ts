import fs from 'node:fs';
import path from 'node:path';

export const STORAGE_POLICY = Object.freeze({
  hardwareDiscovery: 'read-only',
  detectedDeviceOwnership: 'unknown',
  rawDeviceProvisioning: false,
  poolCreation: false,
  volumeBackend: 'nova-managed-qcow2-files',
});

// Discovery is not assignment. Even an unmounted device may belong to another system.
export function discoveryOnly<T extends { children?: any[] }>(devices: T[]): any[] {
  return devices.map(device => ({
    ...device,
    assignment: 'unassigned',
    ownership: 'unknown',
    provisioningAllowed: false,
    children: discoveryOnly(device.children || []),
  }));
}

export function assertManagedDisk(directory: string, candidate: string, allowMissing = false) {
  const root = path.resolve(directory);
  const target = path.resolve(candidate);
  const filename = path.basename(target);
  if (path.dirname(target) !== root || !/^(volume-)?[a-f0-9-]{36}\.qcow2$/.test(filename)) {
    throw new Error('Disk is outside Nova-managed storage; operation refused');
  }
  if (fs.lstatSync(root).isSymbolicLink()) throw new Error('Nova disk directory cannot be a symbolic link');
  try {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('Nova disk must be a regular file, not a device or symbolic link');
  } catch (error: any) {
    if (!allowMissing || error.code !== 'ENOENT') throw error;
  }
  return target;
}
