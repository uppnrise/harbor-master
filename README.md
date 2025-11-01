# 🚢 HarborMaster

**Master Your Containers** - A powerful cross-platform desktop application for managing Docker, Podman, and Kubernetes workloads.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/harbormaster-app/harbormaster)

---

## 🌟 Overview

HarborMaster is a native desktop application for managing Docker and Podman container runtimes. Built with Tauri 2.0, it provides automatic runtime detection, real-time status monitoring, and an intuitive dark-themed interface.

### Current Features (v0.1.0-alpha)

- � **Automatic Runtime Detection** - Detects Docker and Podman installations across Windows, macOS, and Linux
- 🖥️ **Cross-Platform Support** - Native performance on all major operating systems
- ⚡ **Real-Time Status Monitoring** - 5-second polling with visual indicators (green/gray/red)
- 🎯 **Smart Selection** - Auto-selects preferred runtime with persistent preferences
- � **Manual Refresh** - Force re-detection via button, keyboard (Cmd/Ctrl+R), or menu
- ♿ **Accessibility First** - WCAG 2.1 Level AA compliant with full keyboard navigation
- 🎨 **Dark Theme UI** - Beautiful, responsive interface built with React and Tailwind CSS
- 🦭 **Podman Mode Detection** - Identifies rootless vs rootful Podman configurations
- 🐧 **WSL2 Support** - Detects Docker installations in Windows Subsystem for Linux

### Technical Highlights

- **Tauri 2.0** - Lightweight native wrapper (~3MB binary)
- **React 18** - Modern UI with lazy-loaded components
- **TypeScript** - Type-safe frontend development
- **Rust** - High-performance backend for system operations
- **Zustand** - Minimal state management
- **Vitest + Playwright** - 163 tests with 65%+ coverage

---

## 🚀 Getting Started with Spec-Driven Development

This project uses [Spec-Kit](https://github.com/github/spec-kit) for structured, AI-assisted development. Follow these steps to start building HarborMaster:

### Prerequisites

1. **Install uv** (Python package manager):
```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **Install Specify CLI:**
```bash
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

3. **Install Development Tools:**
   - [Rust](https://rustup.rs/) (for Tauri)
   - [Node.js](https://nodejs.org/) 18+ 
   - [npm](https://www.npmjs.com/) package manager (comes with Node.js)
   - [Git](https://git-scm.com/)
   - [Docker](https://docs.docker.com/get-docker/) or [Podman](https://podman.io/getting-started/installation)

4. **Install AI Agent** (choose one):
   - [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (recommended)
   - [Cursor](https://cursor.sh/)
   - [GitHub Copilot](https://github.com/features/copilot)
   - [Windsurf](https://windsurf.com/)

### Initialize the Project

1. **Clone this repository:**
```bash
   git clone https://github.com/uppnrise/harbor-master.git
   cd harbor-master
```

2. **Initialize Spec-Kit:**
```bash
   specify init . --ai claude --force
```
   
   Replace `claude` with your preferred AI agent: `copilot`, `cursor-agent`, `gemini`, `windsurf`, etc.

3. **Install dependencies:**
```bash
   npm install
   cd src-tauri && cargo build
```

4. **Start your AI agent:**
```bash
   # For Claude Code:
   claude

   # For Cursor:
   cursor .

   # For GitHub Copilot:
   code .
```

### Development Workflow

#### 1. Review the Constitution

The `.specify/memory/constitution.md` file contains the project's governing principles. Your AI agent will reference this throughout development.

#### 2. Start with Feature 001

Open the specification: `.specify/specs/001-foundation-runtime-detection/spec.md`

This is the foundation feature that includes:
- Project setup and structure
- Runtime detection (Docker/Podman)
- Basic UI and window management
- Status monitoring

#### 3. Create Implementation Plan

In your AI agent, use the Spec-Kit command:
```
/speckit.plan

We will build HarborMaster using:
- Tauri 2.0 (Rust backend + web frontend)
- React 18 with TypeScript
- Zustand for state management
- Tailwind CSS for styling
- Vite as build tool
- npm for package management

For runtime detection, we'll use:
- Rust for system-level operations (file system, process execution)
- which crate for finding executables in PATH
- tokio for async operations
- Platform-specific APIs for WSL2 detection on Windows

The frontend will communicate with the Rust backend via Tauri commands.
```

#### 4. Generate Task Breakdown
```
/speckit.tasks
```

This creates a detailed task list with dependencies and execution order.

#### 5. Implement the Feature
```
/speckit.implement
```

The AI agent will execute all tasks according to the plan.

#### 6. Test and Iterate

Run the application:
```bash
pnpm tauri dev
```

Test the functionality and refine as needed with your AI agent.

---

## 📁 Project Structure
```
harbormaster/
├── .specify/                      # Spec-Kit files
│   ├── memory/
│   │   └── constitution.md        # Project principles
│   ├── specs/
│   │   ├── 001-foundation-runtime-detection/
│   │   │   ├── spec.md           # Feature specification
│   │   │   ├── plan.md           # Implementation plan (generated)
│   │   │   └── tasks.md          # Task breakdown (generated)
│   │   └── 002-core-features/
│   │       ├── spec.md           # Feature specification
│   │       ├── plan.md           # Implementation plan (generated)
│   │       └── tasks.md          # Task breakdown (generated)
│   ├── scripts/                   # Spec-Kit automation scripts
│   └── templates/                 # Spec-Kit templates
│
├── src/                           # React frontend
│   ├── App.tsx
│   ├── components/
│   ├── services/
│   ├── stores/
│   └── types/
│
├── src-tauri/                     # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── runtime/              # Runtime detection logic
│   │   └── commands/             # Tauri commands
│   └── Cargo.toml
│
├── public/                        # Static assets
├── docs/                          # Documentation
├── package.json
└── README.md
```

---

## 🛠️ Available Spec-Kit Commands

Once you've initialized the project, these commands are available in your AI agent:

### Essential Commands

| Command | Description |
|---------|-------------|
| `/speckit.constitution` | Create or update project principles |
| `/speckit.specify` | Define what you want to build |
| `/speckit.plan` | Create technical implementation plans |
| `/speckit.tasks` | Generate actionable task lists |
| `/speckit.implement` | Execute all tasks to build the feature |

### Quality Commands

| Command | Description |
|---------|-------------|
| `/speckit.clarify` | Clarify underspecified areas |
| `/speckit.analyze` | Check consistency across specs |
| `/speckit.checklist` | Generate quality validation checklists |

---

## 🗺️ Development Roadmap

### Phase 1: Foundation & Runtime Detection ✅ **COMPLETE**
- [x] Project setup with Tauri 2.0 + React + TypeScript
- [x] Runtime detection (Docker/Podman) with platform-specific paths
- [x] WSL2 Docker detection on Windows
- [x] Version parsing and validation
- [x] Real-time status monitoring with 5-second polling
- [x] Runtime selection with auto-selection logic
- [x] Manual refresh (button, keyboard shortcut, menu)
- [x] Error handling and user guidance
- [x] Welcome screen and dark theme UI
- [x] Comprehensive testing (163 tests, 65%+ coverage)
- [x] Full accessibility (WCAG 2.1 AA, keyboard navigation)

### Phase 2: Core Features 📋 **PLANNED**
- [ ] Container Management (list, filter, start, stop, restart, remove, batch operations)
- [ ] Image Management (list, pull, push, tag, remove, prune)
- [ ] Volume Operations (create, list, inspect, remove, prune)
- [ ] Network Operations (create, list, connect, disconnect)
- [ ] Real-Time Logs Viewer (streaming, search, filter, export)
- [ ] Resource Monitoring (CPU, memory, network, disk I/O, multi-container dashboard)

### Phase 3: Advanced Features
- [ ] Kubernetes integration
- [ ] Multi-platform builds (Buildx)
- [ ] Docker Compose support
- [ ] Terminal access to containers
- [ ] Platform-specific optimizations

### Phase 4: Cloud & Polish
- [ ] Cloud platform integration
- [ ] Advanced features (templates, backup)
- [ ] Beta release
- [ ] Performance optimization
- [ ] Internationalization

### Phase 5: Production
- [ ] Security audit
- [ ] Complete documentation
- [ ] v1.0 Release 🚀

---

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [User Manual](docs/user-guide.md)
- [API Reference](docs/api.md)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run TypeScript unit tests only
npm run test:unit

# Run Rust unit tests
cd src-tauri && cargo test --lib

# Run Rust integration tests
cd src-tauri && cargo test --test integration_test

# Run all Rust tests (including doctests)
cd src-tauri && cargo test

# Run E2E tests (Playwright)
npm run test:e2e

# Check test coverage
npm run test:coverage
```

**Current Test Status:**
- ✅ 80 TypeScript unit tests passing
- ✅ 72 Rust unit tests passing (includes lib, integration, and doctests)
- ✅ 5 Rust integration tests passing
- ✅ 6 Rust doctests passing
- **Total: 163 tests passing**
- **Coverage: 65%+** (exceeds 60% target)

---

## 🏗️ Building

### Development Build
```bash
# Start development server with hot-reload
npm run tauri dev
```

### Production Build
```bash
# Build for your current platform
npm run tauri build

# The installer will be in src-tauri/target/release/bundle/
```

**Build Outputs:**
- **Windows:** `.msi` installer in `src-tauri/target/release/bundle/msi/`
- **macOS:** `.dmg` installer in `src-tauri/target/release/bundle/dmg/`
- **Linux:** `.deb` and `.AppImage` in `src-tauri/target/release/bundle/`

**Binary Size:** ~3MB (Tauri's lightweight footprint)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the constitution principles
4. Write tests (minimum 80% coverage)
5. Run tests: `npm test`
6. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

---

## 📊 Project Status

- **Current Version:** 0.1.0-alpha
- **Status:** Phase 1 Complete (Foundation & Runtime Detection)
- **Branch:** `main` (Phase 1 merged)
- **Next Milestone:** Phase 2 - Core Features

### Quality Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Unit Test Coverage | ≥ 60% | 65.27% | ✅ |
| Tests Passing | 100% | 163/163 | ✅ |
| Accessibility | WCAG 2.1 AA | AA Compliant | ✅ |
| Build Success | 100% | 100% | ✅ |
| Critical Bugs | 0 | 0 | ✅ |
| Code Documentation | Complete | Complete | ✅ |

### Recent Achievements

- ✅ **Phase 1: 93/93 tasks complete (100%)**
- ✅ Full TypeScript and Rust documentation with working doctests
- ✅ Lazy loading for performance optimization
- ✅ ARIA attributes and keyboard navigation for accessibility
- ✅ Comprehensive error handling and user guidance
- ✅ Cross-platform runtime detection with WSL2 support
- ✅ All CI/CD pipelines passing (GitHub Actions)
- ✅ Zero npm vulnerabilities (updated to latest dependencies)
- ✅ ESLint 9 migration with flat config

---

## � Troubleshooting

### Runtime Not Detected

**Docker not found:**
1. Verify Docker is installed: `docker --version`
2. Check Docker daemon is running: `docker info`
3. Ensure Docker is in your PATH
4. On Windows, check WSL2 Docker installations
5. Try manual refresh (Cmd/Ctrl+R)

**Podman not found:**
1. Verify Podman is installed: `podman --version`
2. Check Podman service is running: `podman info`
3. Ensure Podman is in your PATH
4. Check rootless vs rootful mode configuration

### Status Shows "Error" or "Unknown"

1. Verify the runtime daemon is running
2. Check permissions (user must be in docker/podman group on Linux)
3. Review runtime logs for errors
4. Try restarting the runtime service
5. Use "Retry Connection" button in error message

### Build Errors

**Rust compilation fails:**
```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

**Node/npm errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Platform-Specific Issues

**Windows:**
- Enable WSL2 if using Docker Desktop
- Run as Administrator if permission errors occur
- Check Windows Defender isn't blocking the app

**macOS:**
- Grant Terminal/IDE full disk access in System Preferences
- For Apple Silicon, ensure compatible Rust target installed
- Check Gatekeeper settings if app won't open

**Linux:**
- Add user to docker/podman group: `sudo usermod -aG docker $USER`
- Log out and back in for group changes to take effect
- Check SELinux/AppArmor policies

For more help, see [GitHub Issues](https://github.com/uppnrise/harbor-master/issues) or [Discussions](https://github.com/uppnrise/harbor-master/discussions).

---

## 🐛 Known Issues

See [GitHub Issues](https://github.com/uppnrise/harbor-master/issues) for current bugs and feature requests.

---

## 🔒 Security

Found a security vulnerability? Please open a [Security Advisory](https://github.com/uppnrise/harbor-master/security/advisories) or contact the maintainers directly.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Tauri 2.0](https://tauri.app/) for native performance
- UI powered by [React 18](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
- Build tooling with [Vite 6](https://vitejs.dev/)
- Testing with [Vitest 3](https://vitest.dev/) and [Playwright](https://playwright.dev/)
- Spec-Driven Development via [Spec-Kit](https://github.com/github/spec-kit)
- Inspired by Docker Desktop, Portainer, and Rancher Desktop

---

## 💬 Community

- **GitHub Discussions:** [Ask questions](https://github.com/uppnrise/harbor-master/discussions)
- **Issues:** [Report bugs or request features](https://github.com/uppnrise/harbor-master/issues)

---

## 📧 Contact

- **GitHub:** https://github.com/uppnrise/harbor-master
- **Issues:** https://github.com/uppnrise/harbor-master/issues
- **Discussions:** https://github.com/uppnrise/harbor-master/discussions

---

<div align="center">

**Built with ❤️ by developers, for developers**

⚓ **Welcome aboard, Captain!** 🚢

[GitHub](https://github.com/uppnrise/harbor-master) • [Report Bug](https://github.com/uppnrise/harbor-master/issues) • [Request Feature](https://github.com/uppnrise/harbor-master/issues) • [Discussions](https://github.com/uppnrise/harbor-master/discussions)

</div>