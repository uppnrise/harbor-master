# Research: Foundation and Runtime Detection

**Feature**: 001-foundation-runtime-detection  
**Date**: 2025-10-30  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

---

## 1. Tauri 2.0 Architecture & Setup

### Decision: Use Tauri 2.0 with React + TypeScript

**Rationale:**
- **Bundle Size**: 10x smaller than Electron (~3MB vs ~150MB for Hello World)
- **Performance**: Native Rust backend provides better performance for system operations
- **Security**: Rust's memory safety prevents entire classes of vulnerabilities
- **Resource Efficiency**: Lower memory footprint (50-100MB vs 200-300MB for Electron)
- **Constitution Alignment**: Meets performance requirements (< 2s startup, < 150MB idle memory)

**Alternatives Considered:**
- **Electron**: More mature ecosystem, larger community, but heavier resource usage
- **Native (Qt/wxWidgets)**: Best performance, but steeper learning curve and harder to maintain cross-platform UI
- **Flutter Desktop**: Good performance, but less mature for desktop, limited Rust integration

**Implementation Details:**
- Tauri CLI: `cargo install create-tauri-app --locked`
- Project structure: `/src` (frontend) + `/src-tauri` (backend)
- IPC via `@tauri-apps/api/core` invoke mechanism
- Window management via `@tauri-apps/api/window`

---

## 2. Runtime Detection Strategy

### Decision: Multi-layered detection with PATH + common locations + caching

**Rationale:**
- **PATH Search First**: Most reliable for properly installed runtimes
- **Common Locations Fallback**: Handles non-standard installations
- **Platform-Specific Logic**: WSL2 detection on Windows, rootless Podman on Linux
- **Caching**: Reduces system calls, meets < 10ms cached requirement

**Best Practices:**

#### 2.1 Executable Discovery (Rust)
```rust
// Use 'which' crate for PATH search
use which::which;

match which("docker") {
    Ok(path) => Some(path),
    Err(_) => check_common_locations("docker")
}
```

**Alternatives Considered:**
- Manual PATH parsing: More control but error-prone
- File system scanning: Too slow for 500ms requirement
- Registry keys (Windows): Brittle across Docker versions

#### 2.2 Common Installation Locations

**Windows:**
```rust
const DOCKER_PATHS_WINDOWS: &[&str] = &[
    r"C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    r"C:\Program Files\Docker\resources\bin\docker.exe",
];

const PODMAN_PATHS_WINDOWS: &[&str] = &[
    r"C:\Program Files\RedHat\Podman\podman.exe",
    r"C:\ProgramData\chocolatey\bin\podman.exe",
];
```

**macOS:**
```rust
const DOCKER_PATHS_MACOS: &[&str] = &[
    "/usr/local/bin/docker",
    "/opt/homebrew/bin/docker",
    "/Applications/Docker.app/Contents/Resources/bin/docker",
];

const PODMAN_PATHS_MACOS: &[&str] = &[
    "/usr/local/bin/podman",
    "/opt/homebrew/bin/podman",
    "/opt/podman/bin/podman",
];
```

**Linux:**
```rust
const DOCKER_PATHS_LINUX: &[&str] = &[
    "/usr/bin/docker",
    "/usr/local/bin/docker",
    "/snap/bin/docker",
];

const PODMAN_PATHS_LINUX: &[&str] = &[
    "/usr/bin/podman",
    "/usr/local/bin/podman",
];
```

#### 2.3 WSL2 Detection (Windows Only)

**Strategy**: Check for `wsl.exe` and query Docker socket in WSL2 distros

```rust
use std::process::Command;

fn detect_wsl2_docker() -> Option<RuntimeInfo> {
    // Check if WSL2 is available
    if !Command::new("wsl.exe").arg("--list").output().is_ok() {
        return None;
    }
    
    // Check for Docker in default WSL2 distro
    let output = Command::new("wsl.exe")
        .args(&["docker", "--version"])
        .output()
        .ok()?;
        
    if output.status.success() {
        // Parse version and return
    }
    None
}
```

**Rationale**: WSL2 Docker is common on Windows 10/11 Home editions

#### 2.4 Rootless Podman Detection (Linux)

**Strategy**: Check Podman info for rootless mode

```rust
let output = Command::new(&podman_path)
    .args(&["info", "--format={{.Host.Security.Rootless}}"])
    .output()?;
    
let is_rootless = String::from_utf8_lossy(&output.stdout)
    .trim() == "true";
```

---

## 3. Version Parsing Strategy

### Decision: Regex-based parsing with semver validation

**Version String Examples:**
- Docker: `Docker version 24.0.7, build afdd53b`
- Podman: `podman version 4.8.0`

**Implementation:**
```rust
use regex::Regex;
use semver::Version;

fn parse_docker_version(output: &str) -> Option<Version> {
    let re = Regex::new(r"Docker version (\d+\.\d+\.\d+)").unwrap();
    re.captures(output)
        .and_then(|cap| cap.get(1))
        .and_then(|m| Version::parse(m.as_str()).ok())
}

fn parse_podman_version(output: &str) -> Option<Version> {
    let re = Regex::new(r"podman version (\d+\.\d+\.\d+)").unwrap();
    re.captures(output)
        .and_then(|cap| cap.get(1))
        .and_then(|m| Version::parse(m.as_str()).ok())
}
```

**Minimum Versions:**
- Docker: 20.10.0
- Podman: 3.0.0

**Rationale**: semver crate provides robust version comparison, handles pre-release versions

---

## 4. Status Checking Strategy

### Decision: Daemon connectivity via `info` command with timeout

**Implementation:**
```rust
use std::time::Duration;
use tokio::time::timeout;

async fn check_docker_status(path: &Path) -> RuntimeStatus {
    let result = timeout(
        Duration::from_secs(3),
        tokio::process::Command::new(path)
            .arg("info")
            .output()
    ).await;
    
    match result {
        Ok(Ok(output)) if output.status.success() => RuntimeStatus::Running,
        Ok(Ok(_)) => RuntimeStatus::Error("Docker daemon not responding".into()),
        Ok(Err(_)) => RuntimeStatus::Stopped,
        Err(_) => RuntimeStatus::Error("Timeout checking status".into()),
    }
}
```

**Rationale:**
- `docker info` / `podman info` requires daemon connection
- 3-second timeout prevents UI freeze
- Distinguishes between stopped daemon vs connection error

**Alternatives Considered:**
- Socket connection check: Faster but requires platform-specific socket paths
- `ps` process check: Unreliable, daemon may be running but not responsive

---

## 5. Caching Strategy

### Decision: TTL-based caching with lazy invalidation

**Implementation:**
```rust
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

struct RuntimeCache {
    runtimes: Arc<RwLock<Option<(Vec<Runtime>, Instant)>>>,
    ttl: Duration,
}

impl RuntimeCache {
    fn get_or_detect(&self) -> Vec<Runtime> {
        let cache = self.runtimes.read().unwrap();
        
        if let Some((runtimes, cached_at)) = cache.as_ref() {
            if cached_at.elapsed() < self.ttl {
                return runtimes.clone();
            }
        }
        drop(cache);
        
        // Cache expired, re-detect
        let detected = detect_runtimes();
        let mut cache = self.runtimes.write().unwrap();
        *cache = Some((detected.clone(), Instant::now()));
        detected
    }
}
```

**Cache Configuration:**
- Detection results: 60 seconds TTL
- Version information: Cached with detection
- Status: 5 seconds TTL (separate cache)

**Rationale**: Balances freshness with performance requirements (< 10ms cached)

---

## 6. Background Status Polling

### Decision: Tokio async tasks with channel-based updates

**Implementation:**
```rust
use tokio::sync::mpsc;
use tokio::time::{interval, Duration};

async fn poll_runtime_status(
    runtime: Runtime,
    tx: mpsc::Sender<StatusUpdate>
) {
    let mut ticker = interval(Duration::from_secs(5));
    
    loop {
        ticker.tick().await;
        let status = check_runtime_status(&runtime).await;
        tx.send(StatusUpdate { runtime: runtime.clone(), status }).await.ok();
    }
}
```

**Frontend Integration:**
```typescript
import { listen } from '@tauri-apps/api/event';

listen<StatusUpdate>('runtime-status', (event) => {
  updateRuntimeStatus(event.payload);
});
```

**Rationale:**
- Non-blocking: Doesn't freeze UI
- Event-driven: Frontend updates reactively
- Efficient: Only polls when app is active

---

## 7. State Management (Zustand)

### Decision: Zustand with TypeScript for runtime state

**Store Structure:**
```typescript
interface RuntimeState {
  // Detected runtimes
  runtimes: Runtime[];
  isDetecting: boolean;
  detectionError: string | null;
  
  // Selected runtime
  selectedRuntime: Runtime | null;
  
  // Status
  statuses: Map<string, RuntimeStatus>;
  
  // Actions
  detectRuntimes: () => Promise<void>;
  selectRuntime: (runtime: Runtime) => void;
  updateStatus: (runtimeId: string, status: RuntimeStatus) => void;
  refreshDetection: () => Promise<void>;
}
```

**Rationale:**
- **Simple**: Less boilerplate than Redux
- **TypeScript**: Full type safety
- **DevTools**: Supports Redux DevTools
- **Performance**: Granular subscriptions prevent unnecessary re-renders
- **Constitution Alignment**: Meets simplicity principle

**Alternatives Considered:**
- Redux Toolkit: More verbose, overkill for this complexity
- React Context: No devtools, performance issues with frequent updates
- Jotai/Recoil: Less mature, smaller ecosystem

---

## 8. UI Component Architecture

### Decision: Functional components with hooks + Tailwind CSS

**Component Structure:**
```typescript
// src/components/RuntimeSelector.tsx
interface RuntimeSelectorProps {
  runtimes: Runtime[];
  selected: Runtime | null;
  onSelect: (runtime: Runtime) => void;
}

// src/components/StatusIndicator.tsx  
interface StatusIndicatorProps {
  status: 'running' | 'stopped' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

// src/components/WelcomeScreen.tsx
interface WelcomeScreenProps {
  isDetecting: boolean;
  error: string | null;
}
```

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        harbor: {
          blue: '#1e40af',
          dark: '#0f172a',
        }
      },
      spacing: {
        // 4px grid: 4, 8, 16, 24, 32...
      }
    }
  }
}
```

**Rationale**:
- Functional components: Modern React best practice
- Hooks: Cleaner than class components
- Tailwind: Rapid development, consistent design system
- Constitution Alignment: 4px/8px/16px/24px spacing grid

---

## 9. Error Handling Strategy

### Decision: Result-based error handling in Rust + typed errors in TypeScript

**Rust Backend:**
```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum RuntimeError {
    #[error("Runtime not found: {0}")]
    NotFound(String),
    
    #[error("Permission denied accessing {0}")]
    PermissionDenied(String),
    
    #[error("Timeout checking runtime status")]
    Timeout,
    
    #[error("Failed to parse version: {0}")]
    VersionParse(String),
}

type Result<T> = std::result::Result<T, RuntimeError>;
```

**TypeScript Frontend:**
```typescript
interface RuntimeError {
  type: 'not_found' | 'permission_denied' | 'timeout' | 'version_parse';
  message: string;
  details?: string;
}
```

**User-Facing Messages:**
```typescript
const ERROR_MESSAGES = {
  not_found: 'No container runtimes detected. Please install Docker or Podman.',
  permission_denied: 'Permission denied. Please check file permissions.',
  timeout: 'Connection timeout. Is the Docker daemon running?',
  version_parse: 'Unable to determine runtime version.',
};
```

**Rationale**: Clear error types enable specific user guidance (Constitution principle 3)

---

## 10. Testing Strategy

### Decision: Vitest (unit) + Playwright (E2E) + Rust tests

**Rust Tests:**
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parse_docker_version() {
        let output = "Docker version 24.0.7, build afdd53b";
        let version = parse_docker_version(output).unwrap();
        assert_eq!(version.major, 24);
        assert_eq!(version.minor, 0);
        assert_eq!(version.patch, 7);
    }
    
    #[tokio::test]
    async fn test_detect_docker_in_path() {
        // Integration test - requires Docker installed
        if let Some(docker) = detect_docker().await {
            assert!(docker.version.major >= 20);
        }
    }
}
```

**Frontend Tests:**
```typescript
// __tests__/RuntimeSelector.test.tsx
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RuntimeSelector } from '../components/RuntimeSelector';

describe('RuntimeSelector', () => {
  it('displays all detected runtimes', () => {
    const runtimes = [
      { type: 'docker', version: '24.0.7', status: 'running' },
      { type: 'podman', version: '4.8.0', status: 'stopped' },
    ];
    
    const { getByText } = render(
      <RuntimeSelector runtimes={runtimes} selected={null} onSelect={() => {}} />
    );
    
    expect(getByText(/Docker 24.0.7/)).toBeInTheDocument();
    expect(getByText(/Podman 4.8.0/)).toBeInTheDocument();
  });
});
```

**E2E Tests:**
```typescript
// e2e/runtime-detection.spec.ts
import { test, expect } from '@playwright/test';

test('app detects and displays Docker', async ({ page }) => {
  await page.goto('/');
  
  // Wait for detection to complete
  await expect(page.locator('text=Docker')).toBeVisible({ timeout: 3000 });
  
  // Check version is displayed
  await expect(page.locator('text=/Docker \\d+\\.\\d+\\.\\d+/')).toBeVisible();
  
  // Check status indicator
  await expect(page.locator('[data-testid="status-indicator"]')).toHaveClass(/running/);
});
```

**Coverage Target**: 85% for runtime detection module (exceeds constitution requirement of 80%)

---

## 11. Performance Optimization

### Decision: Lazy loading + virtual scrolling + code splitting

**Code Splitting:**
```typescript
// Lazy load heavy components
const ContainerList = lazy(() => import('./components/ContainerList'));
const RuntimeSettings = lazy(() => import('./components/RuntimeSettings'));
```

**Virtual Scrolling** (for future container lists):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Only render visible items
const virtualizer = useVirtualizer({
  count: containers.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

**Debouncing:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedRefresh = useDebouncedCallback(
  () => detectRuntimes(),
  300 // 300ms debounce
);
```

**Rationale**: Meets performance requirements (< 2s startup, 60 FPS, < 150MB memory)

---

## 12. Platform-Specific Considerations

### Windows
- **WSL2 Detection**: Check `wsl.exe --list` and query Docker in WSL distros
- **Path Separators**: Use Rust's `std::path` for cross-platform paths
- **Executable Extension**: `.exe` required for executables

### macOS
- **Homebrew Paths**: Check both `/usr/local` (Intel) and `/opt/homebrew` (Apple Silicon)
- **Docker Desktop**: Look in `/Applications/Docker.app/Contents/Resources/bin/`
- **Permission**: Check executable permission with `is_executable()`

### Linux
- **Snap/Flatpak**: Check `/snap/bin` and `/var/lib/flatpak/`
- **Rootless Podman**: Common on modern distributions, detect via `podman info`
- **Socket Paths**: `/var/run/docker.sock` (Docker), `$XDG_RUNTIME_DIR/podman/podman.sock` (Podman)

---

## 13. Dependencies

### Rust (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2.0", features = ["protocol-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
which = "6.0"  # Find executables in PATH
regex = "1.10"
semver = "1.0"
thiserror = "1.0"
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "playwright": "^1.40.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 14. Open Questions & Risks

### Questions Resolved
- ✅ How to detect WSL2 Docker? → Check wsl.exe and query Docker in WSL
- ✅ Cache invalidation strategy? → 60s TTL for detection, 5s for status
- ✅ How to handle multiple Docker installations? → User selects from dropdown
- ✅ Version compatibility? → Minimum: Docker 20.10, Podman 3.0

### Remaining Risks
- **Platform Testing**: Need real hardware for each OS (Windows/macOS/Linux)
  - Mitigation: Use CI/CD with GitHub Actions (windows-latest, macos-latest, ubuntu-latest)
  
- **WSL2 Complexity**: WSL2 Docker detection may be flaky
  - Mitigation: Comprehensive error handling, fallback to manual configuration
  
- **Performance on Slow Systems**: Detection may exceed 500ms on older hardware
  - Mitigation: Show loading indicator, cache aggressively

---

## Summary

All technical unknowns have been resolved. The architecture uses:
- **Tauri 2.0** for native performance
- **Rust** for system operations (detection, version parsing, status checking)
- **React + TypeScript + Zustand** for UI
- **Multi-layered detection** with caching
- **Background polling** for status updates
- **Comprehensive testing** strategy

This design meets all constitution requirements:
- ✅ Performance: < 2s startup, < 500ms detection, < 150MB memory
- ✅ Cross-platform: Windows, macOS, Linux support
- ✅ Testing: 85% coverage target
- ✅ Code Quality: TypeScript strict mode, ESLint, Rust clippy
- ✅ UX: Fast feedback, clear error messages, dark theme default

**Next Phase**: Generate data model and API contracts.
