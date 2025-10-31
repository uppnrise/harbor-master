/**
 * Runtime type definitions for HarborMaster
 * 
 * This module defines TypeScript interfaces and types used throughout the application
 * for runtime detection, status tracking, and event communication between frontend
 * and Tauri backend via IPC.
 * 
 * @module types/runtime
 */

/** Container runtime type: Docker or Podman */
export type RuntimeType = 'docker' | 'podman';

/** Current operational status of a runtime */
export type RuntimeStatus = 'running' | 'stopped' | 'error' | 'unknown';

/** Podman execution mode (security context) */
export type PodmanMode = 'rootful' | 'rootless';

/**
 * Semantic version information
 */
export interface Version {
  /** Major version number */
  major: number;
  /** Minor version number */
  minor: number;
  /** Patch version number */
  patch: number;
  /** Full version string (e.g., "24.0.7") */
  full: string;
}

/**
 * Detected container runtime with metadata
 */
export interface Runtime {
  /** Unique identifier for this runtime instance */
  id: string;
  /** Type of runtime (Docker or Podman) */
  type: RuntimeType;
  /** Filesystem path to the runtime executable */
  path: string;
  /** Parsed version information */
  version: Version;
  /** Current operational status */
  status: RuntimeStatus;
  /** ISO timestamp of last status check */
  lastChecked: string;
  /** ISO timestamp when runtime was first detected */
  detectedAt: string;
  /** Podman mode (rootful/rootless), only for Podman */
  mode?: PodmanMode;
  /** Whether running in WSL2 environment */
  isWsl?: boolean;
  /** Error message if status is 'error' */
  error?: string;
  /** True if version is below minimum requirements */
  versionWarning?: boolean;
}

/**
 * Result from runtime detection operation
 */
export interface DetectionResult {
  /** Array of detected runtimes */
  runtimes: Runtime[];
  /** Timestamp when detection completed */
  detectedAt: Date;
  /** Total detection time in milliseconds */
  duration: number;
  /** Any errors encountered during detection */
  errors: DetectionError[];
}

/**
 * Error encountered during runtime detection
 */
export interface DetectionError {
  /** Type of runtime that failed */
  runtime: RuntimeType;
  /** Path where detection was attempted */
  path: string;
  /** Error message describing the failure */
  error: string;
}

/**
 * Status update for a specific runtime
 */
export interface StatusUpdate {
  /** Runtime identifier */
  runtimeId: string;
  /** New status */
  status: RuntimeStatus;
  /** Update timestamp */
  timestamp: Date;
  /** Optional error message */
  error?: string;
}

/**
 * User preferences for runtime management
 */
export interface RuntimePreferences {
  /** ID of last selected runtime */
  selectedRuntimeId?: string;
  /** Whether to auto-select running runtimes */
  autoSelectRunning: boolean;
  /** Preferred runtime type for auto-selection */
  preferredType?: RuntimeType;
  /** Cache TTL in seconds for detection results */
  detectionCacheTTL: number;
  /** Status polling interval in seconds */
  statusPollInterval: number;
}

/**
 * Tauri event payload for runtime status updates
 */
export interface RuntimeStatusUpdateEvent {
  /** Runtime that was updated */
  runtimeId: string;
  /** New status */
  status: RuntimeStatus;
  /** Update timestamp */
  timestamp: Date;
  /** Optional error message */
  error?: string;
}

/**
 * Tauri event payload when user selects a runtime
 */
export interface RuntimeSelectedEvent {
  /** Selected runtime ID */
  runtimeId: string;
  /** Full runtime object */
  runtime: Runtime;
}

/**
 * Tauri event payload when detection starts
 */
export interface DetectionStartedEvent {
  /** Whether cache was bypassed */
  force: boolean;
  /** Start timestamp */
  timestamp: Date;
}

/**
 * Tauri event payload when detection completes
 */
export interface DetectionCompletedEvent {
  /** Detection results */
  result: DetectionResult;
}

