# Data Model: Foundation and Runtime Detection

**Feature**: 001-foundation-runtime-detection  
**Date**: 2025-10-30

---

## Overview

This document defines the data structures and relationships for runtime detection, storage, and management in HarborMaster. The model supports Docker and Podman runtime detection, version tracking, status monitoring, and user preferences.

---

## Entities

### 1. Runtime

Represents a detected container runtime (Docker or Podman).

**Fields:**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | `string` | Yes | Unique identifier (hash of type + path) | UUID v4 format |
| `type` | `RuntimeType` | Yes | Runtime type | `"docker"` or `"podman"` |
| `path` | `string` | Yes | Absolute path to executable | Valid file path, executable exists |
| `version` | `Version` | Yes | Semantic version | SemVer format (major.minor.patch) |
| `status` | `RuntimeStatus` | Yes | Current connection status | One of: `running`, `stopped`, `error`, `unknown` |
| `lastChecked` | `DateTime` | Yes | Last status check timestamp | ISO 8601 format |
| `detectedAt` | `DateTime` | Yes | When runtime was first detected | ISO 8601 format |
| `mode` | `PodmanMode?` | No | Podman mode (rootful/rootless) | Only for Podman |
| `isWSL` | `boolean?` | No | Is WSL2 Docker (Windows only) | Only for Docker on Windows |
| `error` | `string?` | No | Last error message | Max 500 chars |

**TypeScript Definition:**
```typescript
interface Runtime {
  id: string;
  type: RuntimeType;
  path: string;
  version: Version;
  status: RuntimeStatus;
  lastChecked: Date;
  detectedAt: Date;
  mode?: PodmanMode;
  isWSL?: boolean;
  error?: string;
}

type RuntimeType = 'docker' | 'podman';
type RuntimeStatus = 'running' | 'stopped' | 'error' | 'unknown';
type PodmanMode = 'rootful' | 'rootless';

interface Version {
  major: number;
  minor: number;
  patch: number;
  full: string;  // e.g., "24.0.7"
}
```

**Rust Definition:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Runtime {
    pub id: String,
    #[serde(rename = "type")]
    pub runtime_type: RuntimeType,
    pub path: PathBuf,
    pub version: Version,
    pub status: RuntimeStatus,
    pub last_checked: DateTime<Utc>,
    pub detected_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<PodmanMode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_wsl: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeType {
    Docker,
    Podman,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeStatus {
    Running,
    Stopped,
    Error,
    Unknown,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PodmanMode {
    Rootful,
    Rootless,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub full: String,
}
```

**Invariants:**
- `version.major >= 20 && version.minor >= 10` for Docker (minimum 20.10.0)
- `version.major >= 3` for Podman (minimum 3.0.0)
- `path` must be executable and exist on filesystem
- `mode` is `Some` only when `type == Podman`
- `isWSL` is `Some` only when `type == Docker && platform == Windows`

---

### 2. DetectionResult

Result of a runtime detection scan.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runtimes` | `Runtime[]` | Yes | Array of detected runtimes |
| `detectedAt` | `DateTime` | Yes | When detection completed |
| `duration` | `number` | Yes | Detection duration in milliseconds |
| `errors` | `DetectionError[]` | Yes | Non-fatal errors during detection |

**TypeScript Definition:**
```typescript
interface DetectionResult {
  runtimes: Runtime[];
  detectedAt: Date;
  duration: number;
  errors: DetectionError[];
}

interface DetectionError {
  runtime: RuntimeType;
  path: string;
  error: string;
}
```

**Rust Definition:**
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionResult {
    pub runtimes: Vec<Runtime>,
    pub detected_at: DateTime<Utc>,
    pub duration: u64,  // milliseconds
    pub errors: Vec<DetectionError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionError {
    pub runtime: RuntimeType,
    pub path: String,
    pub error: String,
}
```

---

### 3. RuntimePreferences

User preferences for runtime selection and behavior.

**Fields:**

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
| `selectedRuntimeId` | `string?` | No | ID of currently selected runtime | `null` (auto-select) |
| `autoSelectRunning` | `boolean` | Yes | Auto-select first running runtime | `true` |
| `preferredType` | `RuntimeType?` | No | Preferred runtime type when multiple available | `"docker"` |
| `detectionCache TTL` | `number` | Yes | Cache TTL in seconds | `60` |
| `statusPollInterval` | `number` | Yes | Status check interval in seconds | `5` |

**TypeScript Definition:**
```typescript
interface RuntimePreferences {
  selectedRuntimeId?: string;
  autoSelectRunning: boolean;
  preferredType?: RuntimeType;
  detectionCacheTTL: number;
  statusPollInterval: number;
}
```

**Rust Definition:**
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct RuntimePreferences {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_runtime_id: Option<String>,
    pub auto_select_running: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preferred_type: Option<RuntimeType>,
    pub detection_cache_ttl: u64,
    pub status_poll_interval: u64,
}

impl Default for RuntimePreferences {
    fn default() -> Self {
        Self {
            selected_runtime_id: None,
            auto_select_running: true,
            preferred_type: Some(RuntimeType::Docker),
            detection_cache_ttl: 60,
            status_poll_interval: 5,
        }
    }
}
```

**Storage:** Persisted in application config file (see Storage section below)

---

### 4. StatusUpdate

Real-time status update event for a runtime.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runtimeId` | `string` | Yes | ID of runtime being updated |
| `status` | `RuntimeStatus` | Yes | New status |
| `timestamp` | `DateTime` | Yes | When status was checked |
| `error` | `string?` | No | Error message if status is `error` |

**TypeScript Definition:**
```typescript
interface StatusUpdate {
  runtimeId: string;
  status: RuntimeStatus;
  timestamp: Date;
  error?: string;
}
```

**Rust Definition:**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusUpdate {
    pub runtime_id: String,
    pub status: RuntimeStatus,
    pub timestamp: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
```

---

## State Transitions

### Runtime Status State Machine

```
┌─────────┐
│ Unknown │ (Initial state)
└────┬────┘
     │
     ├──────── Detection success ────────┐
     │                                   ▼
     │                             ┌─────────┐
     │                             │ Running │
     │                             └────┬────┘
     │                                  │
     │                                  ├── Daemon stops ──┐
     │                                  │                  ▼
     ├──────── Detection finds stopped ─┼───────────► ┌─────────┐
     │                                  │             │ Stopped │
     │                                  │             └────┬────┘
     │                                  │                  │
     │                                  │                  ├── Daemon starts ──┐
     │                                  │                  │                   │
     │                                  ▼                  ▼                   │
     └──────── Connection error ───►┌───────┐◄────────────┴───────────────────┘
                                    │ Error │
                                    └───────┘
```

**Transitions:**
- `Unknown → Running`: Detection succeeds, daemon responsive
- `Unknown → Stopped`: Detection succeeds, daemon not running
- `Unknown → Error`: Detection fails (permission denied, not found, etc.)
- `Running → Stopped`: Daemon stops responding
- `Running → Error`: Connection error
- `Stopped → Running`: Daemon starts
- `Stopped → Error`: Connection error
- `Error → Running`: Connection restored, daemon responsive
- `Error → Stopped`: Connection restored, daemon not running

---

## Relationships

```
┌─────────────────┐
│ DetectionResult │
└────────┬────────┘
         │ 1
         │
         │ contains
         │
         ▼ 0..*
    ┌─────────┐
    │ Runtime │◄───────┐
    └────┬────┘        │
         │             │ selected
         │ generates   │
         │ 0..*        │ 0..1
         ▼             │
┌──────────────┐       │
│ StatusUpdate │       │
└──────────────┘       │
                       │
              ┌────────┴────────┐
              │ RuntimePrefs    │
              └─────────────────┘
```

**Relationships:**
1. **DetectionResult contains Runtime** (1:N)
   - One detection can find multiple runtimes
   
2. **Runtime generates StatusUpdate** (1:N)
   - Each runtime emits status updates over time
   
3. **RuntimePreferences selects Runtime** (N:1)
   - User preferences reference one active runtime

---

## Validation Rules

### Runtime Validation

```typescript
function validateRuntime(runtime: Runtime): ValidationResult {
  const errors: string[] = [];
  
  // Version validation
  if (runtime.type === 'docker') {
    if (runtime.version.major < 20 || 
        (runtime.version.major === 20 && runtime.version.minor < 10)) {
      errors.push('Docker version must be >= 20.10.0');
    }
  }
  
  if (runtime.type === 'podman') {
    if (runtime.version.major < 3) {
      errors.push('Podman version must be >= 3.0.0');
    }
  }
  
  // Mode validation
  if (runtime.mode !== undefined && runtime.type !== 'podman') {
    errors.push('Mode field only valid for Podman runtimes');
  }
  
  // WSL validation
  if (runtime.isWSL !== undefined && runtime.type !== 'docker') {
    errors.push('isWSL field only valid for Docker runtimes');
  }
  
  // Path validation
  if (!runtime.path || runtime.path.trim() === '') {
    errors.push('Runtime path is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Storage

### Application Config File

**Location:**
- **Windows**: `%APPDATA%\harbormaster\config.json`
- **macOS**: `~/Library/Application Support/com.harbormaster.app/config.json`
- **Linux**: `~/.config/harbormaster/config.json`

**Format:**
```json
{
  "version": "1.0",
  "preferences": {
    "selectedRuntimeId": "abc123",
    "autoSelectRunning": true,
    "preferredType": "docker",
    "detectionCacheTTL": 60,
    "statusPollInterval": 5
  },
  "lastDetection": "2025-10-30T10:30:00Z"
}
```

**Access:**
```rust
use tauri::api::path::app_config_dir;

let config_dir = app_config_dir(&config).unwrap();
let config_path = config_dir.join("config.json");
```

---

### Runtime Cache (In-Memory)

**Structure:**
```rust
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

pub struct RuntimeCache {
    // Detected runtimes by ID
    runtimes: Arc<RwLock<HashMap<String, Runtime>>>,
    
    // Cache metadata
    cached_at: Arc<RwLock<Option<Instant>>>,
    
    // Status updates
    statuses: Arc<RwLock<HashMap<String, StatusUpdate>>>,
}
```

**Expiration:**
- Detection cache: 60 seconds (configurable via preferences)
- Status cache: 5 seconds (configurable via preferences)

---

## Indexes

### Primary Keys
- `Runtime.id`: Unique identifier (hash of type + path)
- `RuntimePreferences.selectedRuntimeId`: References `Runtime.id`

### Computed Fields
- `Runtime.id`: Generated as `SHA256(type + path)`
- `Runtime.version.full`: Derived from `major.minor.patch`

---

## Migration & Versioning

### Config Schema Version: 1.0

Future schema changes will use semantic versioning:
- **Major**: Breaking changes (requires migration)
- **Minor**: Backward-compatible additions
- **Patch**: Bug fixes, no schema changes

**Migration Strategy:**
```rust
fn migrate_config(config: serde_json::Value, from_version: &str) -> Result<RuntimePreferences> {
    match from_version {
        "1.0" => {
            // Current version, no migration needed
            serde_json::from_value(config)
        }
        // Future versions would be handled here
        _ => Err(Error::UnsupportedConfigVersion(from_version.into()))
    }
}
```

---

## Summary

This data model supports:
- ✅ Multi-runtime detection (Docker + Podman)
- ✅ Platform-specific features (WSL2, rootless Podman)
- ✅ Version validation (minimum requirements)
- ✅ Real-time status monitoring
- ✅ User preferences with persistence
- ✅ Efficient caching with TTL
- ✅ Type safety (TypeScript + Rust)
- ✅ Future extensibility (versioned schema)

**Next**: Define API contracts (Tauri commands) for frontend-backend communication.
