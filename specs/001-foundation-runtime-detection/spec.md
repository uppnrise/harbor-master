# Feature Specification: Foundation and Runtime Detection

**Feature ID:** 001-foundation-runtime-detection  
**Feature Name:** Foundation and Runtime Detection  
**Priority:** P0 (Blocker)  
**Target Milestone:** Alpha Release (Month 2)  
**Status:** Planned

---

## Overview

### Problem Statement

Users need a reliable way to manage Docker and Podman containers across Windows, macOS, and Linux. Existing solutions are either platform-specific (Docker Desktop), web-based (Portainer), or lack polish. There's a need for a native, cross-platform desktop application that intelligently detects and works with multiple container runtimes.

### Solution Summary

Build HarborMaster, starting with the foundational infrastructure and intelligent runtime detection system that automatically discovers Docker and Podman installations, determines their capabilities, and allows seamless switching between runtimes.

### Success Criteria

- Application launches successfully on Windows, macOS, and Linux
- Automatically detects Docker and Podman installations
- Displays runtime status and version information
- Allows user to switch between runtimes
- Basic UI displays detected runtimes and their status

---

## User Stories

### Epic 1: Project Foundation

#### User Story 1.1: As a developer, I want to set up the project structure
**Priority:** P0

**Description:**  
Initialize the project with proper technology stack, build configuration, and development environment so the team can start building features.

**Acceptance Criteria:**
- [ ] Project initialized with Tauri + React + TypeScript
- [ ] Development server runs with hot-reload
- [ ] Build process creates executables for all platforms
- [ ] Linting and formatting configured (ESLint, Prettier)
- [ ] Git repository initialized with proper .gitignore
- [ ] README.md with setup instructions

**Technical Notes:**
- Use Tauri 2.0+ for desktop framework
- React 18+ with TypeScript 5+
- Vite as build tool
- pnpm for package management

---

#### User Story 1.2: As a user, I want to see a welcome screen when I launch the app
**Priority:** P0

**Description:**  
When launching HarborMaster for the first time, users should see a clean, professional welcome screen that indicates the app is detecting runtimes.

**Acceptance Criteria:**
- [ ] App window opens centered on screen (1200x800 default size)
- [ ] Welcome screen displays HarborMaster logo and tagline
- [ ] Loading indicator shows during runtime detection
- [ ] Window is resizable and remembers size/position
- [ ] Dark theme is default

**UI/UX Requirements:**
- Window minimum size: 1024x768
- Loading spinner with text: "Detecting container runtimes..."
- Professional, clean design following HarborMaster brand guide

---

### Epic 2: Runtime Detection System

#### User Story 2.1: As a user, I want the app to detect my Docker installation
**Priority:** P0

**Description:**  
HarborMaster should automatically scan the system to find Docker CLI installations, including Docker Desktop, standalone Docker, and WSL2-based installations.

**Acceptance Criteria:**
- [ ] Scans system PATH for `docker` executable
- [ ] Checks common installation locations:
  - Windows: `C:\Program Files\Docker\Docker\resources\bin`
  - macOS: `/usr/local/bin`, `/opt/homebrew/bin`
  - Linux: `/usr/bin`, `/usr/local/bin`
- [ ] Detects WSL2 Docker installations on Windows
- [ ] Verifies executable has proper permissions
- [ ] Completes detection in < 500ms
- [ ] Caches results for 60 seconds

**Technical Notes:**
- Use Rust backend (Tauri command) for file system access
- Implement platform-specific detection logic
- Handle permission errors gracefully

**Edge Cases:**
- Docker not installed
- Docker installed but not in PATH
- Multiple Docker installations
- Docker executable without execute permissions

---

#### User Story 2.2: As a user, I want the app to detect my Podman installation
**Priority:** P0

**Description:**  
HarborMaster should automatically scan the system to find Podman CLI installations and detect whether it's running in rootful or rootless mode.

**Acceptance Criteria:**
- [ ] Scans system PATH for `podman` executable
- [ ] Checks common installation locations:
  - Windows: `C:\Program Files\RedHat\Podman`
  - macOS: `/usr/local/bin`, `/opt/homebrew/bin`
  - Linux: `/usr/bin`, `/usr/local/bin`
- [ ] Detects rootless vs rootful mode
- [ ] Verifies executable has proper permissions
- [ ] Completes detection in < 500ms
- [ ] Caches results for 60 seconds

**Technical Notes:**
- Podman mode detection via `podman info --format={{.Host.Security.Rootless}}`
- Handle both Podman 3.x and 4.x versions

---

#### User Story 2.3: As a user, I want to see version information for detected runtimes
**Priority:** P0

**Description:**  
Once runtimes are detected, users should see clear version information to understand what they're working with.

**Acceptance Criteria:**
- [ ] Executes `docker --version` and parses output
- [ ] Executes `podman --version` and parses output
- [ ] Displays version in format: "Docker 24.0.7" or "Podman 4.8.0"
- [ ] Handles version string variations across platforms
- [ ] Shows warning if version is below minimum supported:
  - Docker minimum: 20.10.0
  - Podman minimum: 3.0.0
- [ ] Displays version information in UI within 1 second

**Version String Examples:**
```
Docker version 24.0.7, build afdd53b
Podman version 4.8.0
```

**Technical Notes:**
- Use semver library for version comparison
- Cache version information with runtime path

---

#### User Story 2.4: As a user, I want to see runtime connection status
**Priority:** P0

**Description:**  
Users need to know if the detected runtime is actually running and accepting connections.

**Acceptance Criteria:**
- [ ] Checks Docker daemon connectivity via `docker info`
- [ ] Checks Podman service connectivity via `podman info`
- [ ] Displays status: "Running", "Stopped", or "Error"
- [ ] Shows colored status indicator (green/gray/red)
- [ ] Updates status every 5 seconds
- [ ] Shows last checked timestamp
- [ ] Handles timeout scenarios (3 second timeout)

**Status Definitions:**
- **Running** (Green): Daemon/service responsive
- **Stopped** (Gray): Runtime detected but not running
- **Error** (Red): Runtime error or not accessible

**Technical Notes:**
- Background polling service for status updates
- Exponential backoff on repeated failures

---

#### User Story 2.5: As a user, I want to select which runtime to use
**Priority:** P1

**Description:**  
When multiple runtimes are available, users should be able to choose which one HarborMaster uses.

**Acceptance Criteria:**
- [ ] Shows dropdown/selector with all detected runtimes
- [ ] Displays runtime name, version, and status in selector
- [ ] Highlights currently selected runtime
- [ ] Allows clicking to switch runtimes
- [ ] Persists selection to preferences
- [ ] Auto-selects running runtime on first launch
- [ ] Shows "No runtimes detected" message if none found
- [ ] Runtime switch completes in < 1 second

**Auto-Selection Logic:**
1. If only one runtime detected, select it
2. If multiple runtimes, prefer one that's running
3. If multiple running, prefer Docker over Podman
4. If none running, select last used (from preferences)
5. If no preference, select first detected

**UI Requirements:**
- Runtime selector in header/toolbar
- Icon showing runtime type (Docker whale, Podman logo)
- Version number in smaller text
- Status dot (green/gray/red)

---

#### User Story 2.6: As a user, I want to manually refresh runtime detection
**Priority:** P2

**Description:**  
Users who install a runtime while the app is running should be able to trigger re-detection.

**Acceptance Criteria:**
- [ ] Refresh button/menu item available
- [ ] Clears detection cache
- [ ] Re-runs detection for all runtimes
- [ ] Updates UI with new results
- [ ] Shows loading indicator during refresh
- [ ] Displays toast notification on completion
- [ ] Completes within 2 seconds

**UI Requirements:**
- Refresh icon button near runtime selector
- Keyboard shortcut: Cmd/Ctrl+R
- Menu: View → Refresh Runtimes

---

### Epic 3: Error Handling and User Guidance

#### User Story 3.1: As a user, I want helpful messages when no runtimes are detected
**Priority:** P1

**Description:**  
When HarborMaster cannot find any runtimes, users need clear guidance on what to do next.

**Acceptance Criteria:**
- [ ] Shows clear "No runtimes detected" message
- [ ] Provides links to Docker and Podman installation guides
- [ ] Suggests checking installation and PATH configuration
- [ ] Offers "Retry Detection" button
- [ ] Displays platform-specific installation instructions
- [ ] Links to HarborMaster documentation

**Error Message Template:**
```
No container runtimes detected

HarborMaster requires Docker or Podman to be installed.

Installation Options:
- Install Docker Desktop: [link]
- Install Podman: [link]
- View setup guide: [link]

[Retry Detection]
```

---

#### User Story 3.2: As a user, I want clear feedback when a runtime fails to connect
**Priority:** P1

**Description:**  
When a selected runtime cannot be reached, users need to understand why and how to fix it.

**Acceptance Criteria:**
- [ ] Shows error banner when connection fails
- [ ] Displays specific error message from runtime
- [ ] Suggests troubleshooting steps based on error
- [ ] Provides link to troubleshooting guide
- [ ] Offers to try alternative runtime if available
- [ ] Shows "Retry Connection" button

**Common Errors:**
- **Daemon not running:** "Docker daemon is not running. Start Docker Desktop?"
- **Permission denied:** "Permission denied. Try running with elevated privileges?"
- **Not found:** "Docker command not found. Is Docker in your PATH?"

---

## UI/UX Specifications

### Main Window Layout
```
┌─────────────────────────────────────────────────────────┐
│  HarborMaster                          🐳 Docker 24.0.7 │
│                                           [●] Running   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    ⚓ HarborMaster                       │
│                  Master Your Containers                 │
│                                                         │
│                   [Detecting runtimes...]               │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Runtime Selector (Dropdown)
```
┌──────────────────────────────┐
│ 🐳 Docker 24.0.7       [●]  │ ← Running
│ 🟣 Podman 4.8.0        [●]  │ ← Running
│ 🐳 Docker (WSL2) 24.0.6 [○] │ ← Stopped
└──────────────────────────────┘
```

### Status Indicators

- 🟢 Running (green circle)
- ⚪ Stopped (gray circle)  
- 🔴 Error (red circle)
- ◐ Connecting (animated)

---

## Technical Architecture

### Component Structure
```
src/
├── main.ts                 # Tauri main entry
├── App.tsx                 # React root component
├── components/
│   ├── WelcomeScreen.tsx   # Initial welcome/loading
│   ├── RuntimeSelector.tsx # Runtime dropdown
│   └── StatusIndicator.tsx # Status dot component
├── services/
│   ├── RuntimeDetector.ts  # Detection orchestration
│   ├── DockerDetector.ts   # Docker-specific detection
│   ├── PodmanDetector.ts   # Podman-specific detection
│   └── RuntimeMonitor.ts   # Status polling service
├── stores/
│   └── runtimeStore.ts     # Zustand store for runtime state
├── types/
│   └── runtime.ts          # TypeScript interfaces
└── utils/
    ├── version.ts          # Version parsing utilities
    └── platform.ts         # Platform detection utilities
```

### Rust Backend (Tauri Commands)
```rust
src-tauri/
├── src/
│   ├── main.rs
│   ├── runtime/
│   │   ├── mod.rs
│   │   ├── detector.rs     # Runtime detection logic
│   │   ├── docker.rs       # Docker-specific
│   │   └── podman.rs       # Podman-specific
│   └── commands/
│       └── runtime.rs      # Tauri command handlers
```

### Key Interfaces
```typescript
interface Runtime {
  type: 'docker' | 'podman';
  path: string;
  version: string;
  status: 'running' | 'stopped' | 'error';
  mode?: 'rootful' | 'rootless'; // Podman only
  isWSL?: boolean; // Docker on Windows only
}

interface RuntimeDetectionResult {
  runtimes: Runtime[];
  detectedAt: Date;
  detectionDuration: number; // milliseconds
}

interface RuntimeStatus {
  runtime: Runtime;
  status: 'running' | 'stopped' | 'error';
  error?: string;
  lastChecked: Date;
}
```

---

## Performance Requirements

### Detection Performance
- Initial scan: < 500ms
- Cached lookup: < 10ms
- Version check: < 300ms per runtime
- Status check: < 200ms per runtime
- Full refresh: < 2 seconds

### UI Performance
- Window launch: < 500ms to first paint
- Runtime selector: < 50ms to open dropdown
- Status update: < 100ms to reflect in UI
- Runtime switch: < 1 second total

### Resource Usage
- Memory usage: < 50MB during detection
- CPU usage: < 5% during polling
- Disk I/O: Minimal (only reading executables)

---

## Testing Strategy

### Unit Tests (Target: 85% coverage)
```typescript
// Example test structure
describe('RuntimeDetector', () => {
  describe('detectDocker', () => {
    it('should find Docker in PATH');
    it('should find Docker in common locations');
    it('should detect WSL Docker on Windows');
    it('should return null when Docker not found');
    it('should cache detection results');
  });

  describe('parseVersion', () => {
    it('should parse Docker version string');
    it('should parse Podman version string');
    it('should handle malformed version strings');
  });
});
```

### Integration Tests

- Test with real Docker installation
- Test with real Podman installation
- Test with both runtimes installed
- Test with no runtimes installed
- Test WSL detection on Windows
- Test permission denied scenarios

### Platform-Specific Tests

- **Windows:** Test Docker Desktop, standalone Docker, WSL2
- **macOS:** Test Intel and Apple Silicon installations
- **Linux:** Test various distribution paths

### Performance Tests

- Benchmark detection speed with various scenarios
- Memory leak detection for status polling
- UI responsiveness during detection

---

## Security Considerations

### Privilege Escalation
- Never run with elevated privileges by default
- Detect and warn if Podman requires rootful mode
- Handle permission denied errors gracefully

### Path Injection
- Sanitize all file paths before execution
- Validate executables before running
- Use allowlist for executable locations

### Command Execution
- Use safe command execution (no shell injection)
- Timeout all external commands (3 seconds max)
- Validate command output before parsing

---

## Dependencies

### Frontend Dependencies
```json
{
  "@tauri-apps/api": "^2.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "zustand": "^4.5.0",
  "lucide-react": "^0.300.0",
  "semver": "^7.6.0"
}
```

### Rust Dependencies
```toml
[dependencies]
tauri = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
which = "6.0" # For finding executables in PATH
```

---

## Rollout Plan

### Phase 1: Development (Week 1-2)
- Set up project structure
- Implement basic window and UI
- Create detection logic for one runtime

### Phase 2: Detection (Week 2-3)
- Complete Docker detection
- Complete Podman detection  
- Add version parsing
- Implement caching

### Phase 3: Status & Selection (Week 3-4)
- Add status monitoring
- Implement runtime selector
- Add persistence
- Create error handling

### Phase 4: Polish & Testing (Week 4)
- Comprehensive testing
- Performance optimization
- Documentation
- Bug fixes

---

## Success Metrics

### Functional Metrics
- Runtime detection success rate: > 99% when runtime installed
- False positive rate: < 1%
- Runtime switch success rate: 100%

### Performance Metrics
- Detection time: < 500ms (95th percentile)
- Status check time: < 200ms (95th percentile)
- UI responsiveness: 60 FPS maintained

### Quality Metrics
- Unit test coverage: > 85%
- Integration test coverage: All scenarios
- Zero critical bugs

---

## Known Limitations

### v1.0 Scope
- Does not support custom runtime locations (only PATH and common locations)
- Does not support runtime installation/setup
- Does not support OCI-compliant runtimes beyond Docker/Podman
- Requires runtime to be installed before app launch (no hot detection)

### Future Enhancements
- Support for additional runtimes (containerd, cri-o)
- Custom runtime location configuration
- Runtime installation wizard
- Hot detection when runtime installed while app running
- Multiple runtime instances (different versions)

---

## Review & Acceptance Checklist

### Specification Quality
- [ ] All user stories have clear acceptance criteria
- [ ] Technical architecture is well-defined
- [ ] UI/UX mockups are clear and detailed
- [ ] Performance requirements are measurable
- [ ] Security considerations addressed

### Completeness
- [ ] All core scenarios covered
- [ ] Error handling defined
- [ ] Edge cases identified
- [ ] Cross-platform differences documented

### Feasibility
- [ ] Technical approach is sound
- [ ] Dependencies are available
- [ ] Timeline is realistic (4 weeks)
- [ ] Team has required skills

### Alignment
- [ ] Follows constitution principles
- [ ] Meets quality standards
- [ ] Supports project vision
- [ ] Ready for implementation

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-01  
**Author:** Spec-Kit AI  
**Status:** Ready for /speckit.plan