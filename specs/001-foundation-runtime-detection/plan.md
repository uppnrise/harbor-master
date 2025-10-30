# Implementation Plan: Foundation and Runtime Detection

**Branch**: `001-foundation-runtime-detection` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-foundation-runtime-detection/spec.md`

## Summary

Build the foundational infrastructure for HarborMaster with intelligent runtime detection that automatically discovers Docker and Podman installations, determines their capabilities, and allows seamless switching between runtimes. This feature establishes the project structure using Tauri 2.0 + React + TypeScript, implements multi-layered detection with PATH scanning and platform-specific checks, and provides a clean UI for runtime selection and status monitoring.

## Technical Context

**Language/Version**: Rust 1.75+ (backend), TypeScript 5.3+ (frontend), React 18+  
**Primary Dependencies**: Tauri 2.0, Zustand (state), Tailwind CSS, tokio (async), which (PATH search), semver (version parsing)  
**Storage**: Local filesystem (JSON config in app data directory)  
**Testing**: Vitest (unit/integration), Playwright (E2E), cargo test (Rust)  
**Target Platform**: Desktop (Windows 10/11, macOS 11+, Linux Ubuntu 20.04+)  
**Project Type**: Desktop application (Tauri hybrid: Rust backend + web frontend)  
**Performance Goals**: < 2s startup, < 500ms detection, 60 FPS UI, < 150MB idle memory  
**Constraints**: Offline-capable, cross-platform, < 200ms status checks, 3s command timeout  
**Scale/Scope**: Single user, 2-5 runtimes per system, ~20K LOC for v1.0

## Constitution Check

✅ **PASSED - All Gates Met**

### Code Quality & Architecture
- ✅ SOLID principles applied (separation: UI/Backend/Data)
- ✅ Dependency injection via Tauri command system
- ✅ Functions < 50 lines (detector modules are focused)
- ✅ TypeScript strict mode + ESLint configured
- ✅ Rust clippy for static analysis

### Testing Standards
- ✅ Target: 85% coverage (exceeds 80% requirement)
- ✅ Testing pyramid: Unit > Integration > E2E
- ✅ Mock Docker/Podman APIs in unit tests
- ✅ Integration tests for real runtime detection
- ✅ E2E tests for critical user workflows

### User Experience Consistency
- ✅ Native desktop experience (Tauri)
- ✅ Platform-specific conventions respected
- ✅ Dark theme default
- ✅ WCAG 2.1 Level AA accessibility planned
- ✅ 4px/8px/16px/24px spacing grid (Tailwind)

### Performance Requirements
- ✅ Startup < 2s (Tauri optimized)
- ✅ Detection < 500ms (cached < 10ms)
- ✅ UI 60 FPS (React + virtualization)
- ✅ Memory < 150MB idle (Tauri lightweight)

### Security & Privacy
- ✅ No credential storage needed for detection
- ✅ Input validation on all user inputs
- ✅ Command execution uses safe APIs (no shell injection)
- ✅ No telemetry in v1.0

### Cross-Platform Compatibility
- ✅ Windows, macOS, Linux support
- ✅ Platform-specific detection (WSL2, rootless Podman)
- ✅ CI on all three platforms planned

### Runtime Compatibility
- ✅ Docker 20.10+ support
- ✅ Podman 3.0+ support
- ✅ Intelligent auto-detection
- ✅ Seamless switching (no restart)

### Documentation Standards
- ✅ Quickstart guide created
- ✅ API contracts documented
- ✅ Data model specified
- ✅ Code will use JSDoc/TSDoc

### Development Workflow
- ✅ Conventional commits enforced
- ✅ Feature branch workflow (current: 001-*)
- ✅ Code review required (documented)
- ✅ CI/CD planned (GitHub Actions)

### Technical Stack
- ✅ Tauri 2.0 selected (matches constitution)
- ✅ React + TypeScript (matches constitution)
- ✅ Zustand for state (matches constitution)
- ✅ Tailwind CSS (matches constitution)
- ✅ Vite build tool (matches constitution)
- ✅ pnpm package manager (matches constitution)

**Re-check after Phase 1 design**: ✅ All gates still met with detailed design

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-runtime-detection/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Technical research and decisions ✅
├── data-model.md        # Data structures and relationships ✅
├── quickstart.md        # Developer getting started guide ✅
├── contracts/           # API contracts ✅
│   └── tauri-commands.md
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
harbor-master/
├── src/                           # React frontend
│   ├── main.tsx                   # App entry point
│   ├── App.tsx                    # Root component
│   ├── styles.css                 # Global styles (Tailwind)
│   │
│   ├── components/                # UI components
│   │   ├── WelcomeScreen.tsx     # Loading/detection screen
│   │   ├── RuntimeSelector.tsx   # Runtime dropdown selector
│   │   └── StatusIndicator.tsx   # Status dot (running/stopped/error)
│   │
│   ├── stores/                    # Zustand state management
│   │   └── runtimeStore.ts       # Runtime state (detected, selected, status)
│   │
│   ├── types/                     # TypeScript type definitions
│   │   └── runtime.ts            # Runtime, DetectionResult, StatusUpdate types
│   │
│   ├── hooks/                     # React hooks
│   │   ├── useRuntimeStatus.ts   # Status polling hook
│   │   └── useRuntimeDetection.ts # Detection hook
│   │
│   └── utils/                     # Utility functions
│       └── formatters.ts         # Version formatting, etc.
│
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri app entry, command registration
│   │   │
│   │   ├── runtime/              # Runtime detection module
│   │   │   ├── mod.rs            # Module exports
│   │   │   ├── detector.rs       # Main detection orchestration
│   │   │   ├── docker.rs         # Docker-specific detection
│   │   │   ├── podman.rs         # Podman-specific detection
│   │   │   ├── version.rs        # Version parsing
│   │   │   ├── status.rs         # Status checking
│   │   │   └── cache.rs          # Detection caching (60s TTL)
│   │   │
│   │   ├── commands/             # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   └── runtime.rs        # Runtime commands (detect, check_status, etc.)
│   │   │
│   │   ├── types/                # Rust type definitions
│   │   │   └── mod.rs            # Runtime, DetectionResult, StatusUpdate
│   │   │
│   │   ├── config/               # Configuration management
│   │   │   ├── mod.rs
│   │   │   └── preferences.rs    # Load/save RuntimePreferences
│   │   │
│   │   └── polling/              # Background status polling
│   │       ├── mod.rs
│   │       └── service.rs        # Status polling service (5s interval)
│   │
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
│
├── __tests__/                     # Frontend tests
│   ├── components/
│   │   ├── RuntimeSelector.test.tsx
│   │   ├── StatusIndicator.test.tsx
│   │   └── WelcomeScreen.test.tsx
│   │
│   └── stores/
│       └── runtimeStore.test.ts
│
├── e2e/                           # End-to-end tests (Playwright)
│   ├── runtime-detection.spec.ts
│   ├── runtime-selection.spec.ts
│   └── status-monitoring.spec.ts
│
├── public/                        # Static assets
│   └── harbormaster-logo.svg
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                # GitHub Actions CI
│   └── copilot-instructions.md   # GitHub Copilot context ✅
│
├── package.json                   # Frontend dependencies (pnpm)
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite bundler configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc.json               # Prettier configuration
├── vitest.config.ts               # Vitest test configuration
└── playwright.config.ts           # Playwright E2E configuration
```

**Structure Decision**: Desktop application with Tauri hybrid architecture. Frontend (React + TypeScript) in `src/`, backend (Rust) in `src-tauri/`. This is **Option 2 variant** (desktop hybrid), not traditional web frontend/backend. The structure follows Tauri conventions with clear separation between UI layer (components, stores), communication layer (hooks, Tauri commands), and system layer (runtime detection, file I/O).

## Complexity Tracking

**No violations** - All constitution requirements are met:

- ✅ Single desktop project (not multiple projects)
- ✅ Appropriate patterns for scale (Zustand for state, not Redux overkill)
- ✅ Direct OS integration where needed (filesystem for config, no unnecessary abstraction)
- ✅ Minimal dependencies (only what's needed for functionality)
- ✅ Clear architecture (UI → Commands → Runtime → System)
