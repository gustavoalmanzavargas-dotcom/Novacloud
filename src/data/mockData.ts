import {
  AIRecommendation,
  ActivityEvent,
  ApplicationItem,
  DatabaseItem,
  LogEntry,
  MarketplaceApp,
  NetworkTopologyNode,
  NotificationItem,
  SecurityAlert,
  SecurityFinding,
  StorageItem,
  VMInstance,
} from '../types';

// A new Nova installation intentionally starts empty. Inventory is loaded from
// the API after an infrastructure provider is connected.
export const INITIAL_VMS: VMInstance[] = [];
export const INITIAL_APPLICATIONS: ApplicationItem[] = [];
export const INITIAL_DATABASES: DatabaseItem[] = [];
export const INITIAL_STORAGE: StorageItem[] = [];
export const TOPOLOGY_NODES: NetworkTopologyNode[] = [];
export const INITIAL_SECURITY_FINDINGS: SecurityFinding[] = [];
export const INITIAL_LOGS: LogEntry[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_ACTIVITY: ActivityEvent[] = [];
export const MARKETPLACE_CATALOG: MarketplaceApp[] = [];
export const MOCK_SECURITY_ALERTS: SecurityAlert[] = [];
export const MOCK_AI_RECOMMENDATIONS: AIRecommendation[] = [];
export const MOCK_VMS = INITIAL_VMS;
export const MOCK_APPLICATIONS = INITIAL_APPLICATIONS;
export const MOCK_DATABASES = INITIAL_DATABASES;
export const MOCK_STORAGE = INITIAL_STORAGE;
export const MOCK_NOTIFICATIONS = INITIAL_NOTIFICATIONS;
export const MOCK_ACTIVITY_LOG = INITIAL_ACTIVITY;
