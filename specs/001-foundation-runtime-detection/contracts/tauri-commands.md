# Tauri Commands API Contract

**Feature**: 001-foundation-runtime-detection  
**Date**: 2025-10-30  
**Protocol**: Tauri IPC (JSON-RPC over WebSocket/HTTP)

---

## Overview

This document defines the API contract between the React frontend and Rust backend using Tauri's command system. All commands use JSON serialization and are type-safe on both sides.

---

## Commands

### 1. detect_runtimes

Scan the system for Docker and Podman installations.

**Request:**
```typescript
invoke<DetectionResult>('detect_runtimes', {
  force: boolean  // Force re-detection, bypass cache
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn detect_runtimes(force: bool) -> Result<DetectionResult, String>
```

**Response:**
```json
{
  "runtimes": [
    {
      "id": "abc123",
      "type": "docker",
      "path": "/usr/local/bin/docker",
      "version": {
        "major": 24,
        "minor": 0,
        "patch": 7,
        "full": "24.0.7"
      },
      "status": "running",
      "lastChecked": "2025-10-30T10:30:00Z",
      "detectedAt": "2025-10-30T10:30:00Z"
    },
    {
      "id": "def456",
      "type": "podman",
      "path": "/usr/bin/podman",
      "version": {
        "major": 4,
        "minor": 8,
        "patch": 0,
        "full": "4.8.0"
      },
      "status": "stopped",
      "lastChecked": "2025-10-30T10:30:00Z",
      "detectedAt": "2025-10-30T10:30:00Z",
      "mode": "rootless"
    }
  ],
  "detectedAt": "2025-10-30T10:30:00Z",
  "duration": 345,
  "errors": []
}
```

**Error Response:**
```json
"Failed to detect runtimes: Permission denied"
```

**Behavior:**
- If `force = false`: Return cached results if available and not expired
- If `force = true`: Clear cache and perform full detection
- Detection timeout: 5 seconds per runtime
- Caches results for 60 seconds (configurable)

**Performance:**
- Cached: < 10ms
- First run: < 500ms
- With 2 runtimes: < 1000ms

---

### 2. check_runtime_status

Check the connection status of a specific runtime.

**Request:**
```typescript
invoke<StatusUpdate>('check_runtime_status', {
  runtimeId: string
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn check_runtime_status(runtime_id: String) -> Result<StatusUpdate, String>
```

**Response:**
```json
{
  "runtimeId": "abc123",
  "status": "running",
  "timestamp": "2025-10-30T10:31:00Z"
}
```

**Error Response:**
```json
{
  "runtimeId": "abc123",
  "status": "error",
  "timestamp": "2025-10-30T10:31:00Z",
  "error": "Connection timeout: Docker daemon not responding"
}
```

**Behavior:**
- Executes `docker info` or `podman info`
- 3-second timeout
- Does not use cache (always fresh check)

**Performance:**
- Success: < 200ms
- Timeout: 3 seconds

---

### 3. get_runtime_preferences

Get user preferences for runtime selection.

**Request:**
```typescript
invoke<RuntimePreferences>('get_runtime_preferences')
```

**Rust Signature:**
```rust
#[tauri::command]
async fn get_runtime_preferences() -> Result<RuntimePreferences, String>
```

**Response:**
```json
{
  "selectedRuntimeId": "abc123",
  "autoSelectRunning": true,
  "preferredType": "docker",
  "detectionCacheTTL": 60,
  "statusPollInterval": 5
}
```

**Behavior:**
- Reads from config file
- Returns defaults if config doesn't exist
- Creates config directory if needed

---

### 4. set_runtime_preferences

Update user preferences.

**Request:**
```typescript
invoke<void>('set_runtime_preferences', {
  preferences: RuntimePreferences
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn set_runtime_preferences(preferences: RuntimePreferences) -> Result<(), String>
```

**Request Body:**
```json
{
  "preferences": {
    "selectedRuntimeId": "def456",
    "autoSelectRunning": false,
    "preferredType": "podman",
    "detectionCacheTTL": 60,
    "statusPollInterval": 10
  }
}
```

**Response:**
```json
null
```

**Error Response:**
```json
"Failed to save preferences: Permission denied writing config file"
```

**Behavior:**
- Validates preferences before saving
- Creates config directory if needed
- Writes atomically to prevent corruption
- Triggers cache invalidation if cache TTL changed

---

### 5. select_runtime

Select a runtime as the active one.

**Request:**
```typescript
invoke<void>('select_runtime', {
  runtimeId: string
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn select_runtime(runtime_id: String) -> Result<(), String>
```

**Request Body:**
```json
{
  "runtimeId": "def456"
}
```

**Response:**
```json
null
```

**Error Response:**
```json
"Runtime not found: def456"
```

**Behavior:**
- Validates runtime exists
- Updates `selectedRuntimeId` in preferences
- Saves preferences to disk
- Emits `runtime-selected` event

---

### 6. start_status_polling

Start background polling of runtime status.

**Request:**
```typescript
invoke<void>('start_status_polling', {
  runtimeId: string
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn start_status_polling(
    runtime_id: String,
    app_handle: tauri::AppHandle
) -> Result<(), String>
```

**Request Body:**
```json
{
  "runtimeId": "abc123"
}
```

**Response:**
```json
null
```

**Behavior:**
- Spawns async task that polls status every N seconds (from preferences)
- Emits `runtime-status-update` events on changes
- Stops when `stop_status_polling` called or runtime removed
- Auto-stops on window close

---

### 7. stop_status_polling

Stop background polling for a runtime.

**Request:**
```typescript
invoke<void>('stop_status_polling', {
  runtimeId: string
})
```

**Rust Signature:**
```rust
#[tauri::command]
async fn stop_status_polling(runtime_id: String) -> Result<(), String>
```

**Request Body:**
```json
{
  "runtimeId": "abc123"
}
```

**Response:**
```json
null
```

---

## Events

Events are emitted from backend to frontend using Tauri's event system.

### runtime-status-update

Emitted when a runtime's status changes during polling.

**Event Name:** `runtime-status-update`

**Payload:**
```json
{
  "runtimeId": "abc123",
  "status": "stopped",
  "timestamp": "2025-10-30T10:35:00Z",
  "error": null
}
```

**Frontend Listener:**
```typescript
import { listen } from '@tauri-apps/api/event';

listen<StatusUpdate>('runtime-status-update', (event) => {
  console.log('Status updated:', event.payload);
  // Update UI
});
```

---

### runtime-selected

Emitted when user selects a different runtime.

**Event Name:** `runtime-selected`

**Payload:**
```json
{
  "runtimeId": "def456",
  "runtime": {
    "id": "def456",
    "type": "podman",
    "path": "/usr/bin/podman",
    "version": {
      "major": 4,
      "minor": 8,
      "patch": 0,
      "full": "4.8.0"
    },
    "status": "running",
    "lastChecked": "2025-10-30T10:30:00Z",
    "detectedAt": "2025-10-30T10:30:00Z",
    "mode": "rootless"
  }
}
```

---

### detection-started

Emitted when runtime detection begins.

**Event Name:** `detection-started`

**Payload:**
```json
{
  "force": true,
  "timestamp": "2025-10-30T10:30:00Z"
}
```

---

### detection-completed

Emitted when runtime detection completes.

**Event Name:** `detection-completed`

**Payload:**
```json
{
  "result": {
    "runtimes": [...],
    "detectedAt": "2025-10-30T10:30:00Z",
    "duration": 345,
    "errors": []
  }
}
```

---

## Error Handling

All commands return `Result<T, String>` where errors are user-friendly messages.

### Error Categories

**Detection Errors:**
- `"No container runtimes found on this system"`
- `"Permission denied accessing {path}"`
- `"Timeout detecting runtimes"`

**Status Errors:**
- `"Runtime not found: {id}"`
- `"Connection timeout: {runtime} daemon not responding"`
- `"Permission denied executing {command}"`

**Preference Errors:**
- `"Failed to read config: {reason}"`
- `"Failed to save preferences: {reason}"`
- `"Invalid runtime ID: {id}"`

**Validation Errors:**
- `"Runtime version too old: {version} < {minimum}"`
- `"Invalid executable path: {path}"`
- `"Unsupported runtime type: {type}"`

---

## Type Definitions

### Complete TypeScript Types

```typescript
// frontend/src/types/runtime.ts

export interface Runtime {
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

export type RuntimeType = 'docker' | 'podman';
export type RuntimeStatus = 'running' | 'stopped' | 'error' | 'unknown';
export type PodmanMode = 'rootful' | 'rootless';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  full: string;
}

export interface DetectionResult {
  runtimes: Runtime[];
  detectedAt: Date;
  duration: number;
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
  detectionCacheTTL: number;
  statusPollInterval: number;
}

// Event payloads
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
```

---

## Command Registration

### Rust (src-tauri/src/main.rs)

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_runtimes,
            check_runtime_status,
            get_runtime_preferences,
            set_runtime_preferences,
            select_runtime,
            start_status_polling,
            stop_status_polling,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Usage Examples

### Detect Runtimes on App Start

```typescript
// src/App.tsx
import { invoke } from '@tauri-apps/api/core';
import { useRuntimeStore } from './stores/runtimeStore';

function App() {
  const { setRuntimes, setDetecting } = useRuntimeStore();
  
  useEffect(() => {
    async function detectOnStart() {
      setDetecting(true);
      try {
        const result = await invoke<DetectionResult>('detect_runtimes', {
          force: false
        });
        setRuntimes(result.runtimes);
      } catch (error) {
        console.error('Detection failed:', error);
      } finally {
        setDetecting(false);
      }
    }
    
    detectOnStart();
  }, []);
  
  // ...
}
```

### Listen for Status Updates

```typescript
// src/hooks/useRuntimeStatus.ts
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useRuntimeStore } from '../stores/runtimeStore';

export function useRuntimeStatus() {
  const { updateRuntimeStatus } = useRuntimeStore();
  
  useEffect(() => {
    const unlisten = listen<StatusUpdate>('runtime-status-update', (event) => {
      updateRuntimeStatus(event.payload.runtimeId, event.payload.status);
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, [updateRuntimeStatus]);
}
```

### Select Runtime

```typescript
// src/components/RuntimeSelector.tsx
import { invoke } from '@tauri-apps/api/core';

async function handleSelectRuntime(runtimeId: string) {
  try {
    await invoke('select_runtime', { runtimeId });
    // UI updates via runtime-selected event
  } catch (error) {
    toast.error(`Failed to select runtime: ${error}`);
  }
}
```

---

## Performance Requirements

| Operation | Target | Maximum |
|-----------|--------|---------|
| `detect_runtimes` (cached) | < 10ms | 50ms |
| `detect_runtimes` (fresh) | < 500ms | 2s |
| `check_runtime_status` | < 200ms | 3s |
| `get_runtime_preferences` | < 10ms | 50ms |
| `set_runtime_preferences` | < 50ms | 200ms |
| `select_runtime` | < 20ms | 100ms |
| Event emission latency | < 50ms | 200ms |

---

## Security Considerations

1. **Command Injection**: All command execution uses structured APIs, no shell interpolation
2. **Path Validation**: All file paths validated and sanitized before access
3. **Permission Checks**: Executable permission verified before running
4. **Timeout Protection**: All external commands have timeouts (3s max)
5. **Error Sanitization**: Stack traces and system paths removed from error messages
6. **Input Validation**: All user input validated against expected types/formats

---

## Testing

### Mock Commands (for Frontend Testing)

```typescript
// src/__mocks__/tauri.ts
export const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke
}));

// In tests
mockInvoke.mockResolvedValueOnce({
  runtimes: [mockDockerRuntime],
  detectedAt: new Date(),
  duration: 123,
  errors: []
});
```

### Rust Command Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_detect_runtimes_success() {
        let result = detect_runtimes(false).await;
        assert!(result.is_ok());
        let detection = result.unwrap();
        assert!(!detection.runtimes.is_empty());
    }
    
    #[tokio::test]
    async fn test_check_runtime_status_timeout() {
        // Mock timeout scenario
        let result = check_runtime_status("invalid-id".to_string()).await;
        assert!(result.is_err());
    }
}
```

---

## Versioning

**API Version**: 1.0

Future breaking changes will increment the major version and require migration logic.

**Deprecation Strategy:**
- Old commands marked `#[deprecated]` for 2 releases
- New commands added with `_v2` suffix
- Migration guide provided in changelog

---

## Summary

This API contract defines **7 commands** and **4 events** for runtime detection and management:

**Commands:**
- `detect_runtimes` - Scan for Docker/Podman
- `check_runtime_status` - Check daemon connectivity
- `get_runtime_preferences` - Load user preferences
- `set_runtime_preferences` - Save user preferences
- `select_runtime` - Set active runtime
- `start_status_polling` - Begin background monitoring
- `stop_status_polling` - Stop background monitoring

**Events:**
- `runtime-status-update` - Status changed
- `runtime-selected` - Active runtime changed
- `detection-started` - Detection began
- `detection-completed` - Detection finished

All contracts are type-safe, performant, and follow Tauri best practices.
