# 🚢 HarborMaster

**Master Your Containers** - A powerful cross-platform desktop application for managing Docker, Podman, and Kubernetes workloads.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/harbormaster-app/harbormaster)

---

## 🌟 Overview

HarborMaster is a native desktop application that brings enterprise-grade container management to your fingertips. Whether you're running Docker, Podman, or Kubernetes, HarborMaster provides the clarity and control you need to navigate your container infrastructure with confidence.

### Key Features

- 🚢 **Universal Compatibility** - Works seamlessly with Docker, Podman, and Kubernetes
- 🖥️ **Cross-Platform Native** - Beautiful native experience on Windows, macOS, and Linux  
- ⚡ **Lightning Fast** - Built for performance with Tauri and Rust
- 🎯 **Smart Detection** - Automatically discovers and connects to installed runtimes
- 📊 **Real-Time Insights** - Monitor resources, logs, and metrics at a glance
- 🔧 **Power User Tools** - Terminal access, advanced networking, multi-arch builds
- ☁️ **Cloud Ready** - Deploy to AWS, Azure, or Google Cloud
- 🔒 **Security First** - Built with security best practices from the ground up

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
   - [pnpm](https://pnpm.io/) package manager
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
   git clone https://github.com/[your-org]/harbormaster.git
   cd harbormaster
```

2. **Initialize Spec-Kit:**
```bash
   specify init . --ai claude --force
```
   
   Replace `claude` with your preferred AI agent: `copilot`, `cursor-agent`, `gemini`, `windsurf`, etc.

3. **Install dependencies:**
```bash
   pnpm install
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
- pnpm for package management

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
│   │   └── 002-container-operations/
│   │       └── spec.md
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

### Phase 1: Foundation (Months 1-3) ✅ Current
- [x] Project setup and architecture
- [ ] Runtime detection (Docker/Podman)
- [ ] Basic UI and navigation
- [ ] Container listing and filtering

### Phase 2: Core Features (Months 4-6)
- [ ] Container lifecycle management
- [ ] Image management
- [ ] Volume and network operations
- [ ] Logs and statistics

### Phase 3: Advanced Features (Months 7-9)
- [ ] Kubernetes integration
- [ ] Multi-platform builds (Buildx)
- [ ] Docker Compose support
- [ ] Platform-specific optimizations

### Phase 4: Cloud & Polish (Months 10-12)
- [ ] Cloud platform integration
- [ ] Advanced features (templates, backup)
- [ ] Beta release
- [ ] Performance optimization

### Phase 5: Production (Months 13-18)
- [ ] Security audit
- [ ] Documentation
- [ ] Internationalization
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
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run all tests with coverage
pnpm test:coverage
```

---

## 🏗️ Building

### Development Build
```bash
pnpm tauri dev
```

### Production Build
```bash
# Build for your platform
pnpm tauri build

# Build for specific platform
pnpm tauri build --target x86_64-pc-windows-msvc   # Windows
pnpm tauri build --target x86_64-apple-darwin       # macOS Intel
pnpm tauri build --target aarch64-apple-darwin      # macOS Apple Silicon
pnpm tauri build --target x86_64-unknown-linux-gnu  # Linux
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the constitution principles
4. Write tests (minimum 80% coverage)
5. Run tests: `pnpm test`
6. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your fork: `git push origin feature/amazing-feature`
8. Open a Pull Request

---

## 📊 Project Status

- **Current Version:** 0.1.0-alpha
- **Status:** In active development
- **Target:** Alpha release Q2 2025, v1.0 Q4 2025

### Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Unit Test Coverage | > 80% | TBD |
| Build Success Rate | 100% | TBD |
| Open Critical Bugs | 0 | 0 |
| Performance Benchmarks | All passing | TBD |

---

## 🐛 Known Issues

See [GitHub Issues](https://github.com/[your-org]/harbormaster/issues) for current bugs and feature requests.

---

## 🔒 Security

Found a security vulnerability? Please email security@harbormaster.app instead of opening a public issue.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) for native performance
- UI powered by [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)
- Spec-Driven Development via [Spec-Kit](https://github.com/github/spec-kit)
- Inspired by Docker Desktop, Portainer, and Rancher Desktop

---

## 💬 Community

- **Discord:** [Join our community](https://discord.gg/harbormaster) (coming soon)
- **Twitter:** [@harbormaster_app](https://twitter.com/harbormaster_app) (coming soon)
- **GitHub Discussions:** [Ask questions](https://github.com/[your-org]/harbormaster/discussions)

---

## 📧 Contact

- **Website:** https://harbormaster.app (coming soon)
- **Email:** hello@harbormaster.app
- **Issues:** https://github.com/[your-org]/harbormaster/issues

---

<div align="center">

**Built with ❤️ by developers, for developers**

⚓ **Welcome aboard, Captain!** 🚢

[Website](https://harbormaster.app) • [Documentation](https://docs.harbormaster.app) • [Report Bug](https://github.com/[your-org]/harbormaster/issues) • [Request Feature](https://github.com/[your-org]/harbormaster/issues)

</div>