# HarborMaster Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-31

## Project Overview

**HarborMaster** is a cross-platform desktop application for managing Docker and Podman container runtimes. Built with Tauri 2.0, React 18, and TypeScript.

- **Version:** 0.1.0-alpha
- **Repository:** https://github.com/uppnrise/harbor-master
- **License:** MIT
- **Current Status:** Phase 1 Complete, Phase 2 Planned

## Active Technologies

### Backend (Rust)
- **Tauri 2.0** - Native application framework
- **tokio** - Async runtime
- **serde/serde_json** - Serialization
- **bollard** - Docker API client (planned for Phase 2)
- **which** - Executable detection in PATH

### Frontend (TypeScript/React)
- **React 18** - UI framework
- **TypeScript 5** - Type-safe development
- **Zustand** - State management
- **Tailwind CSS 3** - Styling
- **Vite 6** - Build tool
- **Vitest 3** - Unit testing
- **Playwright** - E2E testing
- **ESLint 9** - Linting (flat config)

### Package Management
- **npm** - Package manager (not pnpm)
- **cargo** - Rust package manager

## Project Structure

```text
harbor-master/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    # CI/CD pipeline (concurrency enabled)
│   └── copilot-instructions.md       # This file
│
├── .specify/                          # Spec-Kit specification files
│   ├── memory/
│   │   └── constitution.md           # Project principles & guidelines
│   ├── specs/
│   │   ├── 001-foundation-runtime-detection/
│   │   │   ├── spec.md              # Feature specification
│   │   │   ├── plan.md              # Implementation plan
│   │   │   └── tasks.md             # Task breakdown
│   │   └── 002-core-features/
│   │       ├── spec.md              # Phase 2 specification (25KB)
│   │       ├── plan.md              # Implementation plan (NEW)
│   │       └── tasks.md             # 330+ tasks breakdown (NEW)
│   ├── scripts/                      # Spec-Kit automation
│   └── templates/                    # Spec-Kit templates
│
├── src/                               # React frontend
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   ├── components/
│   │   ├── runtime/                  # Runtime detection UI
│   │   │   ├── RuntimeSelector.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   ├── RuntimeError.tsx
│   │   │   ├── NoRuntimesMessage.tsx
│   │   │   └── WelcomeScreen.tsx
│   │   └── ui/                       # Shared UI components
│   │       ├── StatusBadge.tsx
│   │       └── Toast.tsx
│   ├── services/
│   │   └── runtimeService.ts         # Tauri command wrappers
│   ├── stores/
│   │   └── runtimeStore.ts           # Zustand state management
│   ├── hooks/
│   │   └── useRuntimeStatus.ts       # Custom React hooks
│   ├── types/
│   │   └── runtime.ts                # TypeScript type definitions
│   └── utils/
│       └── formatters.ts             # Utility functions
│
├── src-tauri/                         # Rust backend
│   ├── src/
│   │   ├── main.rs                   # App entry point
│   │   ├── lib.rs                    # Library root
│   │   ├── runtime/                  # Runtime detection module
│   │   │   ├── mod.rs
│   │   │   ├── detector.rs           # Main detection logic
│   │   │   ├── docker.rs             # Docker detection
│   │   │   ├── podman.rs             # Podman detection
│   │   │   ├── version.rs            # Version parsing
│   │   │   ├── status.rs             # Status checking
│   │   │   └── cache.rs              # Detection caching
│   │   ├── commands/                 # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   └── runtime.rs            # Runtime commands
│   │   └── types/                    # Shared Rust types
│   │       ├── mod.rs
│   │       └── runtime.rs
│   ├── tests/
│   │   └── integration_test.rs       # Integration tests
│   ├── Cargo.toml                    # Rust dependencies
│   └── tauri.conf.json               # Tauri configuration
│
├── e2e/                               # End-to-end tests
│   ├── runtime-detection.spec.ts
│   └── runtime-selection.spec.ts
│
├── public/                            # Static assets
├── package.json                       # Node.js dependencies
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── eslint.config.js                   # ESLint 9 flat config
├── vitest.config.ts                   # Vitest test configuration
├── playwright.config.ts               # Playwright E2E configuration
└── README.md                          # Project documentation
```

## Key Document References

### Constitution & Principles
- **`.specify/memory/constitution.md`** - Project governance, code quality standards, testing requirements, development workflow

### Phase 1: Foundation (COMPLETE ✅)
- **Spec:** `.specify/specs/001-foundation-runtime-detection/spec.md`
- **Plan:** `.specify/specs/001-foundation-runtime-detection/plan.md`
- **Tasks:** `.specify/specs/001-foundation-runtime-detection/tasks.md`
- **Status:** 93/93 tasks complete (100%)
- **Features:** Runtime detection (Docker/Podman), status monitoring, runtime selection, WSL2 support

### Phase 2: Core Features (PLANNED 📋)
- **Spec:** `.specify/specs/002-core-features/spec.md` (25KB, 10 epics, 30+ user stories)
- **Plan:** `.specify/specs/002-core-features/plan.md` (NEW - comprehensive architecture)
- **Tasks:** `.specify/specs/002-core-features/tasks.md` (NEW - 330+ tasks, 540h estimated)
- **Status:** Awaiting implementation kickoff
- **Features:**
  - Container Management (list, filter, lifecycle, batch operations, details)
  - Image Management (pull, push, tag, remove, prune)
  - Volume Operations (create, list, inspect, remove, prune)
  - Network Operations (create, list, connect, disconnect)
  - Real-Time Logs Viewer (streaming 1000 lines/sec, search, filter, export)
  - Resource Monitoring (CPU, memory, network, disk I/O, multi-container dashboard)

### API Documentation
- **Tauri Commands:** See `src-tauri/src/commands/` for command implementations
- **Rust Docs:** Run `cargo doc --open` in `src-tauri/` directory
- **Component Docs:** TSDoc comments in TypeScript files

### User Documentation
- **README.md** - Getting started, features, installation, troubleshooting
- **Architecture:** (planned) `docs/architecture.md`
- **Development Guide:** (planned) `docs/development.md`
- **User Manual:** (planned) `docs/user-guide.md`

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (with Tauri)
npm run tauri dev

# Run TypeScript unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Lint TypeScript/React code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build frontend only
npm run build
```

### Backend Development
```bash
# Navigate to Rust workspace
cd src-tauri

# Build Rust backend
cargo build

# Run Rust unit tests
cargo test --lib

# Run integration tests
cargo test --test integration_test

# Run all tests (includes doctests)
cargo test

# Format Rust code
cargo fmt

# Lint Rust code
cargo clippy

# Generate documentation
cargo doc --open
```

### Full Application
```bash
# Development mode with hot-reload
npm run tauri dev

# Production build
npm run tauri build

# Build outputs:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/deb/ and .AppImage
```

### CI/CD
```bash
# Run all CI checks locally
npm run lint && npm test && cd src-tauri && cargo test && cargo clippy

# Check GitHub Actions status
# - See .github/workflows/ci.yml for pipeline configuration
# - Concurrency enabled (cancels old runs)
# - Build/coverage jobs run only on main branch
```

## Code Style Guidelines

### TypeScript/React
- **ESLint 9** with flat config (`eslint.config.js`)
- **Strict mode** enabled in `tsconfig.json`
- **Functional components** with hooks (no class components)
- **Type imports:** Use `import type { ... }` for type-only imports
- **Naming:**
  - Components: PascalCase (`RuntimeSelector.tsx`)
  - Hooks: camelCase with `use` prefix (`useRuntimeStatus.ts`)
  - Services: camelCase (`runtimeService.ts`)
  - Stores: camelCase (`runtimeStore.ts`)
- **File structure:** One component per file, colocated tests
- **Accessibility:** WCAG 2.1 AA compliance required (ARIA labels, keyboard navigation)

### Rust
- **Edition:** 2021
- **Style:** Run `cargo fmt` before committing
- **Linting:** Run `cargo clippy` and fix all warnings
- **Documentation:** Use `///` for public APIs, include examples
- **Error handling:** Use `Result<T, E>` for fallible operations
- **Async:** Use `tokio` runtime, `async`/`await` syntax
- **Naming:**
  - Modules: snake_case (`runtime_detector`)
  - Types: PascalCase (`RuntimeInfo`)
  - Functions: snake_case (`detect_docker`)
  - Constants: SCREAMING_SNAKE_CASE (`DEFAULT_TIMEOUT`)

### Commits
- **Format:** Conventional Commits
  - `feat: add container listing`
  - `fix: resolve Docker detection on Windows`
  - `docs: update README with Phase 2 info`
  - `test: add unit tests for image operations`
  - `chore: update dependencies`
  - `refactor: simplify runtime detection logic`
  - `perf: optimize log streaming performance`

### Testing Requirements
- **Coverage:** Minimum 80% for new code
- **Unit tests:** Test all business logic
- **Integration tests:** Test Tauri commands and Docker/Podman integration
- **E2E tests:** Test critical user workflows
- **Performance tests:** Verify performance targets (60 FPS, <500ms renders)

## Architecture Patterns

### State Management
- **Zustand stores** for global state
- **React hooks** for component-local state
- **Tauri events** for backend → frontend communication
- **Polling** for periodic updates (e.g., 5-second status checks)

### Backend → Frontend Communication
- **Commands:** Synchronous calls from frontend to Rust (`invoke()`)
- **Events:** Asynchronous push from Rust to frontend (`emit()`)
- **Example:**
  ```typescript
  // Frontend: Call Tauri command
  const result = await invoke('detect_runtimes');
  
  // Frontend: Listen for events
  await listen('runtime-status-changed', (event) => {
    console.log('Status:', event.payload);
  });
  ```

### Error Handling
- **Backend:** Return `Result<T, String>` from Tauri commands
- **Frontend:** Try/catch around `invoke()` calls, display user-friendly errors
- **UI:** Use Toast notifications for transient errors, error boundaries for crashes

### Performance Targets (Phase 2)
- **List renders:** < 500ms for 1000 items
- **UI animations:** 60 FPS
- **Log streaming:** 1000 lines/second without lag
- **Stats updates:** Every 1-2 seconds
- **Virtual scrolling:** For lists with 10,000+ items
- **Memory:** < 100MB for logs, < 500MB total

## Testing Strategy

### Unit Tests
- **TypeScript:** Vitest with jsdom (see `src/**/*.test.ts`)
- **Rust:** Built-in test framework (see `#[cfg(test)]` modules)
- **Coverage:** Run `npm run test:coverage` for frontend

### Integration Tests
- **Rust:** Test Tauri commands with real Docker/Podman (see `src-tauri/tests/`)
- **Setup:** Requires Docker or Podman installed locally

### E2E Tests
- **Playwright:** Test full user workflows (see `e2e/`)
- **Scenarios:** Runtime detection, selection, status monitoring

### Current Test Status
- ✅ 80 TypeScript unit tests
- ✅ 72 Rust tests (unit + integration + doctests)
- ✅ 163 total tests passing
- ✅ 65%+ coverage

## Phase 2 Implementation Notes

### Timeline
- **Planned:** 4 weeks (160 hours focused effort)
- **Estimated:** 540 hours for full scope
- **Strategy:** Focus on P0 user stories, defer P2 features to Phase 3

### Technology Decisions
- **Docker/Podman API:** Use bollard (Docker) + CLI fallback (Podman)
- **Virtual Scrolling:** @tanstack/react-virtual
- **Charts:** Custom lightweight SVG charts
- **Log Rendering:** Virtual list + Web Worker for parsing
- **Streaming:** Tauri events + tokio async streams

### High-Risk Areas
- Real-time log streaming (1000 lines/sec)
- Multi-container stats monitoring (20+ containers)
- Large image operations (progress tracking)
- Virtual scrolling performance
- Memory management for log buffering

### Mitigation Strategies
- Prototype early, use proven libraries
- Performance testing during development
- Efficient buffering (ring buffer for logs)
- Batch stats requests, throttle updates
- Virtual rendering for large lists

## Recent Changes

### 2025-10-31
- ✅ Phase 1 merged to main (93/93 tasks complete)
- ✅ CI/CD pipeline fully passing (GitHub Actions)
- ✅ All dependencies updated (ESLint 9, Vitest 3, Vite 6)
- ✅ Zero npm vulnerabilities
- ✅ ESLint migrated to flat config
- ✅ README.md updated with accurate info
- ✅ Phase 2 plan and tasks created (330+ tasks)

### 2025-10-30
- Phase 1 implementation complete
- 163 tests passing, 65%+ coverage
- Full WCAG 2.1 AA accessibility compliance

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific notes, conventions, or guidelines here -->

<!-- MANUAL ADDITIONS END -->
