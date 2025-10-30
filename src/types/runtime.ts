// Runtime type definitions for HarborMaster
// Shared between frontend and backend via Tauri IPC

export type RuntimeType = 'docker' | 'podman';
export type RuntimeStatus = 'running' | 'stopped' | 'error' | 'unknown';
export type PodmanMode = 'rootful' | 'rootless';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  full: string; // e.g., "24.0.7"
}

export interface Runtime {
  id: string;
  type: RuntimeType;
  path: string;
  version: Version;
  status: RuntimeStatus;
  lastChecked: string;
  detectedAt: string;
  mode?: PodmanMode;
  isWsl?: boolean;
  error?: string;
  versionWarning?: boolean; // true if version is below minimum requirements
}

export interface DetectionResult {
  runtimes: Runtime[];
  detectedAt: Date;
  duration: number; // milliseconds
  errors: DetectionError[];
}

export interface DetectionError {
  runtime: RuntimeType;
  path: string;
  error: string;
}

export interface StatusUpdate {
  runtimeId: string;
  status: RuntimeStatus;
  timestamp: Date;
  error?: string;
}

export interface RuntimePreferences {
  selectedRuntimeId?: string;
  autoSelectRunning: boolean;
  preferredType?: RuntimeType;
  detectionCacheTTL: number; // seconds
  statusPollInterval: number; // seconds
}

// Event payloads for Tauri events
export interface RuntimeStatusUpdateEvent {
  runtimeId: string;
  status: RuntimeStatus;
  timestamp: Date;
  error?: string;
}

export interface RuntimeSelectedEvent {
  runtimeId: string;
  runtime: Runtime;
}

export interface DetectionStartedEvent {
  force: boolean;
  timestamp: Date;
}

export interface DetectionCompletedEvent {
  result: DetectionResult;
}
