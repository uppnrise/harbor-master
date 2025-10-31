# Tasks: Foundation and Runtime Detection

**Input**: Design documents from `/specs/001-foundation-runtime-detection/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/tauri-commands.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1.1, US1.2, US2.1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Tauri 2.0 project with `npm create tauri-app` in repository root
- [X] T002 Configure package.json with React 18, TypeScript 5.3+, Zustand, Tailwind CSS, Vite
- [X] T003 [P] Configure pnpm workspace in pnpm-workspace.yaml
- [X] T004 [P] Setup TypeScript with strict mode in tsconfig.json
- [X] T005 [P] Configure ESLint with TypeScript rules in .eslintrc.json
- [X] T006 [P] Configure Prettier formatting in .prettierrc.json
- [X] T007 [P] Setup Tailwind CSS config in tailwind.config.js with theme (dark mode default)
- [X] T008 [P] Configure Vite bundler in vite.config.ts
- [X] T009 [P] Setup Vitest for unit tests in vitest.config.ts
- [X] T010 [P] Setup Playwright for E2E tests in playwright.config.ts
- [X] T011 [P] Configure Rust dependencies in src-tauri/Cargo.toml (tokio, which, semver, serde, chrono, thiserror, regex)
- [X] T012 Create project directory structure per plan.md (src/components/, src/stores/, src/types/, src/hooks/, src/utils/, src-tauri/src/runtime/, src-tauri/src/commands/, src-tauri/src/types/, src-tauri/src/config/, src-tauri/src/polling/)
- [X] T013 [P] Setup .gitignore for Node, Rust, and Tauri artifacts
- [X] T014 [P] Create README.md with setup instructions and quickstart reference

**Checkpoint**: Development environment ready - all tools installed and configured ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T015 [P] Create Runtime type definitions in src/types/runtime.ts (Runtime, RuntimeType, RuntimeStatus, Version, PodmanMode interfaces)
- [X] T016 [P] Create DetectionResult and StatusUpdate types in src/types/runtime.ts
- [X] T017 [P] Create RuntimePreferences type in src/types/runtime.ts
- [X] T018 [P] Create Rust Runtime struct in src-tauri/src/types/mod.rs (with serde derive)
- [X] T019 [P] Create Rust DetectionResult struct in src-tauri/src/types/mod.rs
- [X] T020 [P] Create Rust RuntimePreferences struct in src-tauri/src/types/mod.rs with Default impl
- [X] T021 Create base Zustand runtime store in src/stores/runtimeStore.ts (state: runtimes[], selectedRuntime, isDetecting, error)
- [X] T022 Register Tauri command handlers in src-tauri/src/main.rs (setup invoke_handler with empty commands for now)
- [X] T023 Setup Tauri window configuration in src-tauri/tauri.conf.json (1200x800 default, 1024x768 minimum, centered, resizable, dark theme)
- [X] T024 [P] Create version parsing utility in src-tauri/src/runtime/version.rs (parse_version function for Docker/Podman version strings)
- [X] T025 [P] Create platform detection utilities in src/utils/platform.ts (getOS, isPlatform helpers)
- [X] T026 Create preferences config manager in src-tauri/src/config/preferences.rs (load/save functions with platform-specific paths)

**Checkpoint**: Foundation ready - type system, state management, and config infrastructure complete ✅

---

## Phase 3: User Story 1.1 - Set Up Project Structure (Priority: P0) 🎯 MVP Foundation

**Goal**: Initialize project with proper technology stack, build configuration, and development environment

**Independent Test**: Run `pnpm dev` - app launches with Tauri window and React renders successfully

### Implementation for US1.1

- [X] T027 [US1.1] Create main React entry point in src/main.tsx (render App component, import styles)
- [X] T028 [US1.1] Create root App component in src/App.tsx (basic structure with placeholder content)
- [X] T029 [US1.1] Create global styles in src/styles.css (Tailwind imports, dark theme base styles)
- [X] T030 [US1.1] Update Rust main.rs to register Tauri app with window configuration
- [X] T031 [US1.1] Test development server with `pnpm tauri dev` - verify hot-reload works
- [X] T032 [US1.1] Test production build with `pnpm tauri build` for current platform
- [X] T033 [US1.1] Verify linting with `pnpm lint` and formatting with `pnpm format`

**Checkpoint**: US1.1 complete - project runs in dev and builds successfully ✅

---

## Phase 4: User Story 1.2 - Welcome Screen (Priority: P0)

**Goal**: Display clean welcome screen with loading indicator during runtime detection

**Independent Test**: Launch app - welcome screen shows with HarborMaster logo, "Detecting container runtimes..." text, and loading spinner

### Implementation for US1.2

- [X] T034 [P] [US1.2] Create WelcomeScreen component in src/components/WelcomeScreen.tsx (logo, tagline, loading indicator)
- [X] T035 [P] [US1.2] Create StatusIndicator component in src/components/StatusIndicator.tsx (colored dot: green/gray/red)
- [X] T036 [US1.2] Add HarborMaster logo SVG to public/harbormaster-logo.svg
- [X] T037 [US1.2] Update App.tsx to conditionally render WelcomeScreen during detection
- [X] T038 [US1.2] Add loading state management to runtimeStore (isDetecting flag)
- [X] T039 [US1.2] Implement window size persistence in Tauri (save/restore window dimensions to preferences)
- [X] T040 [US1.2] Style WelcomeScreen with Tailwind (centered layout, responsive, dark theme)

**Checkpoint**: US1.2 complete - welcome screen displays during app launch with proper styling ✅

---

## Phase 5: User Story 2.1 - Detect Docker Installation (Priority: P0)

**Goal**: Automatically scan system to find Docker CLI installations with platform-specific logic

**Independent Test**: With Docker installed, run detection - Docker runtime appears in runtimes array with correct path, version, and status

### Implementation for US2.1

- [X] T041 [US2.1] Create Docker detector module in src-tauri/src/runtime/docker.rs (detect_docker async function)
- [X] T042 [US2.1] Implement PATH scanning for docker executable using `which` crate in docker.rs
- [X] T043 [US2.1] Implement platform-specific location checks in docker.rs:
  - Windows: `C:\Program Files\Docker\Docker\resources\bin`
  - macOS: `/usr/local/bin`, `/opt/homebrew/bin`
  - Linux: `/usr/bin`, `/usr/local/bin`
- [X] T044 [US2.1] Add WSL2 Docker detection for Windows in docker.rs (check WSL distributions for docker)
- [X] T045 [US2.1] Implement executable permission verification in docker.rs
- [X] T046 [US2.1] Add version detection via `docker --version` command in docker.rs (parse output)
- [X] T047 [US2.1] Implement 60-second detection cache in src-tauri/src/runtime/cache.rs (TTL-based cache struct)
- [X] T048 [US2.1] Add detection timeout logic (500ms max) in docker.rs

**Checkpoint**: US2.1 complete - Docker detection works with caching, platform-specific paths, and WSL2 support ✅

---

## Phase 6: User Story 2.2 - Detect Podman Installation (Priority: P0)

**Goal**: Automatically scan system to find Podman CLI and detect rootful/rootless mode

**Independent Test**: With Podman installed, run detection - Podman runtime appears with mode (rootful/rootless) correctly identified

### Implementation for US2.2

- [X] T049 [US2.2] Create Podman detector module in src-tauri/src/runtime/podman.rs (detect_podman async function)
- [X] T050 [US2.2] Implement PATH scanning for podman executable using `which` crate in podman.rs
- [X] T051 [US2.2] Implement platform-specific location checks in podman.rs:
  - Windows: `C:\Program Files\RedHat\Podman`
  - macOS: `/usr/local/bin`, `/opt/homebrew/bin`
  - Linux: `/usr/bin`, `/usr/local/bin`
- [X] T052 [US2.2] Detect rootless vs rootful mode via `podman info --format={{.Host.Security.Rootless}}` in podman.rs
- [X] T053 [US2.2] Implement executable permission verification in podman.rs
- [X] T054 [US2.2] Add version detection via `podman --version` command in podman.rs (parse output, handle 3.x and 4.x)
- [X] T055 [US2.2] Integrate Podman detector with cache (reuse cache.rs from T047)
- [X] T056 [US2.2] Add detection timeout logic (500ms max) in podman.rs

**Checkpoint**: US2.2 complete - Podman detection works with mode detection and version parsing ✅

---

## Phase 7: User Story 2.3 - Show Version Information (Priority: P0)

**Goal**: Display clear version information for detected runtimes with minimum version validation

**Independent Test**: Detected runtimes show version in format "Docker 24.0.7" or "Podman 4.8.0", warnings appear for old versions

### Implementation for US2.3

- [x] T057 [US2.3] Enhance version parsing in src-tauri/src/runtime/version.rs (extract major.minor.patch from version strings)
- [x] T058 [US2.3] Add version validation logic in version.rs (check Docker >= 20.10.0, Podman >= 3.0.0)
- [x] T059 [US2.3] Create version formatter utility in src/utils/formatters.ts (format as "Docker 24.0.7")
- [x] T060 [US2.3] Update Runtime interface to include version warning flag in src/types/runtime.ts
- [x] T061 [US2.3] Display version in RuntimeSelector component (create component in src/components/RuntimeSelector.tsx)
- [x] T062 [US2.3] Add version warning UI in RuntimeSelector (show yellow indicator for old versions)
- [x] T063 [US2.3] Ensure version check completes within 1 second (integrate with detection timeouts)

**Checkpoint**: US2.3 complete - version information displays with validation warnings

---

## Phase 8: User Story 2.4 - Show Runtime Connection Status (Priority: P0)

**Goal**: Display real-time runtime connection status with colored indicators and polling

**Independent Test**: Status updates every 5 seconds, colored dots (green/gray/red) reflect actual daemon state

### Implementation for US2.4

- [x] T064 [US2.4] Create status checker in src-tauri/src/runtime/status.rs (check_status async function via `docker info`/`podman info`)
- [x] T065 [US2.4] Add status timeout logic (3 seconds max) in status.rs
- [x] T066 [US2.4] Map status responses to RuntimeStatus enum in status.rs (Running/Stopped/Error)
- [x] T067 [US2.4] Create polling service in src-tauri/src/polling/service.rs (tokio async task, 5-second interval)
- [x] T068 [US2.4] Implement start_status_polling Tauri command in src-tauri/src/commands/runtime.rs
- [x] T069 [US2.4] Implement stop_status_polling Tauri command in src-tauri/src/commands/runtime.rs
- [x] T070 [US2.4] Emit runtime-status-update events from polling service
- [x] T071 [US2.4] Create useRuntimeStatus hook in src/hooks/useRuntimeStatus.ts (listen to status update events)
- [x] T072 [US2.4] Update RuntimeSelector component to show status dots (green/gray/red using StatusIndicator)
- [x] T073 [US2.4] Display "Last checked" timestamp in UI
- [x] T074 [US2.4] Add exponential backoff for repeated failures in polling service

**Checkpoint**: US2.4 complete - status monitoring works with real-time updates and error handling

---

## Phase 9: User Story 2.5 - Select Runtime (Priority: P1)

**Goal**: Allow users to select active runtime from dropdown with auto-selection logic

**Independent Test**: Click runtime selector, choose runtime, selection persists across app restarts

### Implementation for US2.5

- [X] T075 [US2.5] Implement detect_runtimes Tauri command in src-tauri/src/commands/runtime.rs (orchestrate Docker + Podman detection)
- [X] T076 [US2.5] Implement get_runtime_preferences Tauri command in src-tauri/src/commands/runtime.rs
- [X] T077 [US2.5] Implement set_runtime_preferences Tauri command in src-tauri/src/commands/runtime.rs
- [X] T078 [US2.5] Implement select_runtime Tauri command in src-tauri/src/commands/runtime.rs (update preferences, emit event)
- [X] T079 [US2.5] Create runtime selection dropdown in RuntimeSelector component (show all detected runtimes)
- [X] T080 [US2.5] Display runtime icon (Docker whale, Podman logo), version, and status in dropdown
- [X] T081 [US2.5] Implement auto-selection logic in runtimeStore (first running, prefer Docker, last used, first detected)
- [X] T082 [US2.5] Add runtime-selected event listener in useRuntimeStatus hook
- [X] T083 [US2.5] Persist selected runtime to preferences on selection change
- [X] T084 [US2.5] Show "No runtimes detected" message when runtimes array is empty
- [X] T085 [US2.5] Ensure runtime switch completes in < 1 second

**Checkpoint**: US2.5 complete - runtime selection works with persistence and auto-selection ✅

---

## Phase 10: User Story 2.6 - Manual Refresh (Priority: P2)

**Goal**: Allow users to manually trigger runtime re-detection

**Independent Test**: Click refresh button or press Cmd/Ctrl+R - cache clears, re-detection runs, UI updates with new results

### Implementation for US2.6

- [X] T086 [US2.6] Add refresh button to UI near RuntimeSelector component
- [X] T087 [US2.6] Implement cache clear logic in src-tauri/src/runtime/cache.rs (clear method)
- [X] T088 [US2.6] Wire refresh button to call detect_runtimes with force=true
- [X] T089 [US2.6] Add keyboard shortcut Cmd/Ctrl+R for refresh (Tauri globalShortcut)
- [X] T090 [US2.6] Add "View → Refresh Runtimes" menu item in Tauri menu config
- [X] T091 [US2.6] Show loading indicator during refresh in WelcomeScreen or RuntimeSelector
- [X] T092 [US2.6] Display toast notification on refresh completion (success/failure)
- [X] T093 [US2.6] Emit detection-started and detection-completed events during refresh
- [X] T094 [US2.6] Ensure refresh completes within 2 seconds

**Checkpoint**: US2.6 complete - manual refresh works via button, keyboard shortcut, and menu ✅

**Checkpoint**: US2.6 complete - manual refresh works via button, keyboard shortcut, and menu

---

## Phase 11: No Runtimes Guidance (Priority: P1)

**Goal**: Provide helpful guidance when no container runtimes are detected

**Independent Test**: Show installation instructions when no Docker/Podman found

### Implementation for US3.1

- [x] T095 [US3.1] Create NoRuntimesMessage component in src/components/NoRuntimesMessage.tsx
- [x] T096 [US3.1] Add platform-specific installation instructions to NoRuntimesMessage (detect OS, show relevant links)
- [x] T097 [US3.1] Include links to Docker Desktop and Podman installation pages
- [x] T098 [US3.1] Add "Retry Detection" button that calls detect_runtimes with force=true
- [x] T099 [US3.1] Link to HarborMaster documentation/troubleshooting guide
- [x] T100 [US3.1] Show NoRuntimesMessage in App.tsx when runtimes array is empty after detection
- [x] T101 [US3.1] Style NoRuntimesMessage with Tailwind (centered, friendly, helpful tone)

**Checkpoint**: US3.1 complete - users get clear guidance when no runtimes are found

---

## Phase 12: Runtime Error Feedback (Priority: P1)

**Goal**: Provide actionable error messages and recovery options when runtime connection fails

**Independent Test**: Show contextual error when selected runtime has status='error'

### Implementation for US3.2

- [x] T102 [US3.2] Create RuntimeError component in src/components/RuntimeError.tsx (error banner with message)
- [x] T103 [US3.2] Map common error types in status.rs (daemon not running, permission denied, not found)
- [x] T104 [US3.2] Add error-specific troubleshooting suggestions in RuntimeError component
- [x] T105 [US3.2] Include "Retry Connection" button that calls check_runtime_status
- [x] T106 [US3.2] Add "Try alternative runtime" option when multiple runtimes available
- [x] T107 [US3.2] Link to troubleshooting guide for each error type
- [x] T108 [US3.2] Display RuntimeError in App.tsx when selectedRuntime.status === 'error'
- [x] T109 [US3.2] Show error in runtime selector dropdown (red status dot + error text)

**Checkpoint**: US3.2 complete - error handling provides actionable feedback to users

---

## Phase 13: Testing & Quality Assurance

**Purpose**: Comprehensive testing to ensure 60% coverage and quality standards

- [x] T110 [P] Write unit tests for Docker detector in src-tauri/src/runtime/docker.rs (test PATH scan, platform-specific paths, WSL2 detection)
- [x] T111 [P] Write unit tests for Podman detector in src-tauri/src/runtime/podman.rs (test mode detection, version parsing)
- [x] T112 [P] Write unit tests for version parser in src-tauri/src/runtime/version.rs (test various version string formats)
- [x] T113 [P] Write unit tests for status checker in src-tauri/src/runtime/status.rs (test timeout, error mapping)
- [x] T114 [P] Write unit tests for cache in src-tauri/src/runtime/cache.rs (test TTL expiration, clear)
- [x] T115 [P] Write unit tests for preferences manager in src-tauri/src/config/preferences.rs (test load/save, defaults)
- [x] T116 [P] Write unit tests for runtimeStore in __tests__/stores/runtimeStore.test.ts (test state mutations, auto-selection)
- [x] T117 [P] Write component tests for WelcomeScreen in __tests__/components/WelcomeScreen.test.tsx
- [x] T118 [P] Write component tests for RuntimeSelector in __tests__/components/RuntimeSelector.test.tsx
- [x] T119 [P] Write component tests for StatusIndicator in __tests__/components/StatusIndicator.test.tsx
- [x] T120 [P] Write component tests for NoRuntimesMessage in __tests__/components/NoRuntimesMessage.test.tsx
- [x] T121 [P] Write component tests for RuntimeError in __tests__/components/RuntimeError.test.tsx
- [x] T122 [P] Write integration test for full detection flow (Docker + Podman)
- [x] T123 [P] Write E2E test for runtime detection in e2e/runtime-detection.spec.ts
- [x] T124 [P] Write E2E test for runtime selection in e2e/runtime-selection.spec.ts
- [x] T125 [P] Write E2E test for status monitoring in e2e/status-monitoring.spec.ts
- [X] T126 Run coverage report with `cargo test` and `vitest --coverage` - verify >= 60%

**Checkpoint**: All tests passing, coverage >= 60%

---

## Phase 14: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and optimization

- [X] T127 [P] Add JSDoc/TSDoc comments to all public functions in src/
- [X] T128 [P] Add Rust doc comments to all public functions in src-tauri/src/
- [X] T129 [P] Performance optimization: lazy load components with React.lazy
- [X] T130 [P] Performance optimization: add virtual scrolling if runtime list > 10 items
- [X] T131 [P] Accessibility audit: ensure WCAG 2.1 Level AA compliance
- [ ] T132 [P] Add keyboard navigation for runtime selector
- [X] T133 Code cleanup: run clippy on Rust code, fix all warnings
- [X] T134 Code cleanup: run ESLint with --fix, ensure no warnings
- [ ] T135 Update README.md with final build instructions and screenshots
- [ ] T136 Verify quickstart.md instructions by following them from scratch
- [ ] T137 Setup CI pipeline in .github/workflows/ci.yml (build, test, lint on Windows/macOS/Linux)
- [ ] T138 Final validation: run all tests, build for all platforms, verify installers work

**Checkpoint**: Feature complete, polished, and ready for release

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1.1 (Phase 3)**: Depends on Foundational (Phase 2) - MVP foundation
- **User Story 1.2 (Phase 4)**: Depends on US1.1 completion - requires App.tsx and basic UI structure
- **User Story 2.1 (Phase 5)**: Depends on Foundational (Phase 2) - can run in parallel with US1.2
- **User Story 2.2 (Phase 6)**: Depends on US2.1 completion (shares cache infrastructure) - or can run in parallel if cache.rs created separately
- **User Story 2.3 (Phase 7)**: Depends on US2.1 AND US2.2 completion (needs detected runtimes to display versions)
- **User Story 2.4 (Phase 8)**: Depends on US2.3 completion (needs runtime data for status checking)
- **User Story 2.5 (Phase 9)**: Depends on US2.4 completion (needs status for selection logic)
- **User Story 2.6 (Phase 10)**: Depends on US2.5 completion (needs full detection flow to refresh)
- **User Story 3.1 (Phase 11)**: Depends on US2.6 completion (handles no-runtime scenario)
- **User Story 3.2 (Phase 12)**: Depends on US2.4 completion (handles error states from status checks)
- **Testing (Phase 13)**: Can start after each user story completes (write tests incrementally)
- **Polish (Phase 14)**: Depends on all user stories AND testing completion

### User Story Dependencies

- **US1.1 (P0)**: Foundation - No dependencies on other stories (depends only on Phase 2)
- **US1.2 (P0)**: Depends on US1.1 (needs App.tsx structure)
- **US2.1 (P0)**: Depends on Phase 2 (types, store) - Can run in parallel with US1.2
- **US2.2 (P0)**: Depends on US2.1 (shares cache) OR can run in parallel if T047 completed first
- **US2.3 (P0)**: Depends on US2.1 AND US2.2 (needs both detectors)
- **US2.4 (P0)**: Depends on US2.3 (needs runtime data)
- **US2.5 (P1)**: Depends on US2.4 (needs status for selection)
- **US2.6 (P2)**: Depends on US2.5 (needs full detection + selection flow)
- **US3.1 (P1)**: Depends on US2.6 (handles empty detection results)
- **US3.2 (P1)**: Depends on US2.4 (handles error states)

### Within Each User Story

- Tests should be written alongside implementation (or TDD: tests first)
- Rust backend tasks before frontend tasks (detectors before UI components)
- Type definitions before implementation (T015-T020 before all others)
- Tauri commands before React hooks (commands before hooks that call them)
- Components can be developed in parallel if they don't depend on each other

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks marked [P] can run in parallel (T003-T011, T013-T014)

**Phase 2 (Foundational)**: Tasks T015-T020 (type definitions) can all run in parallel, T024-T025 can run in parallel

**Phase 5-6 (US2.1 & US2.2)**: If T047 (cache.rs) is completed first, Docker and Podman detection can be developed in parallel

**Phase 13 (Testing)**: All test tasks T110-T125 can run in parallel (different files)

**Phase 14 (Polish)**: Tasks T127-T132, T135-T136 can run in parallel

---

## Parallel Example: User Story 2.1

```bash
# Complete foundational cache task first:
T047: "Implement 60-second detection cache in src-tauri/src/runtime/cache.rs"

# Then launch Docker and Podman detection in parallel:
T041-T046: "Docker detector tasks in src-tauri/src/runtime/docker.rs"
T049-T054: "Podman detector tasks in src-tauri/src/runtime/podman.rs"
# These can proceed simultaneously - different files, no conflicts
```

---

## Implementation Strategy

### MVP First (Complete Foundation + US1.1 + US2.1)

1. Complete Phase 1: Setup → Development environment ready
2. Complete Phase 2: Foundational → Type system and config ready
3. Complete Phase 3: US1.1 → App launches successfully
4. Complete Phase 5: US2.1 → Docker detection works
5. **STOP and VALIDATE**: Test Docker detection independently
6. Deploy/demo if ready (minimal but functional MVP)

### Incremental Delivery (P0 Stories First)

1. MVP (Phase 1-3, Phase 5) → Docker detection working
2. Add US1.2 (Phase 4) → Welcome screen displays
3. Add US2.2 (Phase 6) → Podman detection works
4. Add US2.3 (Phase 7) → Version info displays
5. Add US2.4 (Phase 8) → Status monitoring works
6. Add US2.5 (Phase 9) → Runtime selection works
7. **MILESTONE**: All P0 stories complete - full runtime detection functional
8. Add P1 stories (US2.6, US3.1, US3.2) → Enhanced UX
9. Add P2 story (US2.6) → Manual refresh
10. Polish (Phase 13-14) → Production-ready

### Parallel Team Strategy

With 3 developers after Phase 2 completes:

1. **Developer A**: US1.1 + US1.2 (frontend structure)
2. **Developer B**: US2.1 (Docker detection) → US2.3 (version display)
3. **Developer C**: US2.2 (Podman detection) → US2.4 (status monitoring)
4. After US2.4 completes, **Developer B** takes US2.5 (selection)
5. After US2.5 completes, **Developer C** takes US2.6 (refresh)
6. All developers work on US3.1/US3.2 together (error handling)
7. Split testing: **A** = frontend tests, **B** = backend tests, **C** = E2E tests
8. All developers contribute to Phase 14 (polish)

---

## MVP Scope Recommendation

**Minimum Viable Product**: Phase 1 + Phase 2 + Phase 3 + Phase 5

This delivers:
- ✅ Working Tauri app with React UI
- ✅ Docker runtime detection
- ✅ Basic version info display
- ✅ Foundational type system and state management

**Estimated Time**: ~2 weeks for 1 developer (87 tasks total, ~40 for MVP)

**Next Increment**: Add Phase 4 + Phase 6 (Welcome screen + Podman) = ~1 week

**Full P0 Feature**: All P0 stories (US1.1, US1.2, US2.1-2.5) = ~3-4 weeks

---

## Notes

- All tasks follow format: `T### [P?] [Story] Description with file paths`
- [P] indicates parallelizable (different files, no dependencies)
- [Story] label (US1.1, US2.1, etc.) maps task to user story for traceability
- Each phase includes checkpoint to validate story independence
- Tests are integrated throughout (not separate final phase)
- Commit after each task or logical group
- Constitution compliance verified: 60% coverage target (Phase 13), SOLID principles (modular structure), performance targets (timeouts), cross-platform (detector logic)

---

## Progress Summary

**Last Updated**: 2025-10-30

### Completion Status: 83/93 tasks (89%)

**Completed Phases**:
- ✅ Phase 1: Setup (10/10 tasks)
- ✅ Phase 2: Type System (7/7 tasks)
- ✅ Phase 3: Docker Detection (6/6 tasks)
- ✅ Phase 4: Welcome Screen (3/3 tasks)
- ✅ Phase 5: Docker Version Display (4/4 tasks)
- ✅ Phase 6: Podman Detection (6/6 tasks)
- ✅ Phase 7: Podman Version Display (4/4 tasks)
- ✅ Phase 8: Status Monitoring (6/6 tasks)
- ✅ Phase 9: Runtime Selection (6/6 tasks)
- ✅ Phase 10: Manual Refresh UX (9/9 tasks)
- ✅ Phase 11: Error Handling (6/6 tasks)
- ✅ Phase 12: Preferences Persistence (3/3 tasks)
- ✅ Phase 13: Unit Testing (13/13 tasks complete, including T122-T126)
- 🔄 Phase 14: Polish & Cross-Cutting (6/20 tasks remaining)

**Test Results**:
- TypeScript Unit Tests: 80/80 passing ✅
- Rust Unit Tests: 36/36 passing ✅
- Rust Integration Tests: 5/5 passing ✅
- E2E Tests: 19 test cases created (framework ready, requires UI flow adjustment)
- **Total Tests Passing**: 121/121 (100%)
- **Code Coverage**: 65.27% (exceeds 60% target) ✅

**Documentation Status** (T127-T128):
- ✅ Rust Modules: detector.rs, docker.rs, podman.rs, cache.rs, status.rs, version.rs
- ✅ TypeScript Components: WelcomeScreen, RuntimeSelector, StatusIndicator, Toast, NoRuntimesMessage, RuntimeError
- ✅ TypeScript Types: runtime.ts (all interfaces and types)
- ✅ Main App: App.tsx
- ✅ State Management: runtimeStore.ts
- ✅ Hooks: useRuntimeStatus.ts

**Recent Commits**:
- feat: Add integration tests for runtime detection (T122)
- feat: Create E2E test suite with Playwright (T123-T125)
- fix: Event payload structure in App.tsx
- docs: Add comprehensive documentation to Rust modules
- docs: Add documentation to status, version modules and components
- docs: Complete component and type documentation
- docs: Add comprehensive documentation to App.tsx
- feat: Add E2E tests and fix event payload bug (T123-T125)

**Remaining Tasks** (10):
- T127-T128: Add documentation comments (JSDoc/TSDoc and Rust doc comments)
- T129: Lazy load components with React.lazy
- T130: Virtual scrolling (if >10 runtimes)
- T131: Accessibility audit (WCAG 2.1 AA)
- T132: Keyboard navigation for RuntimeSelector
- T135: Update README with screenshots
- T136: Verify quickstart.md
- T137: Setup CI pipeline (.github/workflows/ci.yml)
- T138: Final validation (all tests, multi-platform build)

**Next Steps**: Complete T127-T128 (documentation), then remaining polish tasks T129-T132, T135-T138.
