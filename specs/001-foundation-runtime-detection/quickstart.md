# Quickstart Guide: Foundation and Runtime Detection

**Feature**: 001-foundation-runtime-detection  
**Target Audience**: Developers implementing this feature  
**Estimated Time**: 30-45 minutes

---

## Prerequisites

Before starting implementation, ensure you have:

- ✅ **Rust** 1.75+ installed ([rustup.rs](https://rustup.rs/))
- ✅ **Node.js** 18+ installed ([nodejs.org](https://nodejs.org/))
- ✅ **pnpm** installed (`npm install -g pnpm`)
- ✅ **Git** configured for the repository
- ✅ **Docker** or **Podman** installed (for testing)
- ✅ **VS Code** with Rust Analyzer extension (recommended)

**OS-Specific Requirements:**
- **Windows**: Visual Studio Build Tools, WSL2 (optional for testing)
- **macOS**: Xcode Command Line Tools
- **Linux**: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`

---

## Step 1: Initialize Tauri Project (15 min)

### 1.1 Create Tauri App

```bash
# Navigate to repo root
cd /path/to/harbor-master

# Create Tauri + React + TypeScript app
pnpm create tauri-app --name harbormaster --template react-ts

# Follow prompts:
# - Package manager: pnpm
# - Frontend: React with TypeScript
# - Use Vite: Yes
```

### 1.2 Project Structure

After initialization, you should have:

```
harbor-master/
├── src/                    # React frontend
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

### 1.3 Install Dependencies

```bash
# Frontend dependencies
pnpm add zustand lucide-react

# Dev dependencies
pnpm add -D tailwindcss postcss autoprefixer @types/node
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D prettier

# Rust dependencies (edit src-tauri/Cargo.toml)
# Add to [dependencies]:
```

**Edit** `src-tauri/Cargo.toml`:
```toml
[dependencies]
tauri = { version = "2.0", features = ["protocol-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
which = "6.0"
regex = "1.10"
semver = "1.0"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
```

### 1.4 Initialize Tailwind CSS

```bash
# Generate Tailwind config
pnpx tailwindcss init -p
```

**Edit** `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        harbor: {
          blue: '#1e40af',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
```

**Edit** `src/styles.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 1.5 Configure TypeScript

**Edit** `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Step 2: Implement Rust Backend (30 min)

### 2.1 Create Module Structure

```bash
cd src-tauri/src
mkdir -p runtime commands types
```

**File Structure:**
```
src-tauri/src/
├── main.rs
├── runtime/
│   ├── mod.rs
│   ├── detector.rs
│   ├── docker.rs
│   ├── podman.rs
│   └── cache.rs
├── commands/
│   └── runtime.rs
└── types/
    └── mod.rs
```

### 2.2 Define Types

**Create** `src-tauri/src/types/mod.rs`:
```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};

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

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionResult {
    pub runtimes: Vec<Runtime>,
    pub detected_at: DateTime<Utc>,
    pub duration: u64,
    pub errors: Vec<DetectionError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DetectionError {
    pub runtime: RuntimeType,
    pub path: String,
    pub error: String,
}
```

### 2.3 Implement Runtime Detector

**Create** `src-tauri/src/runtime/detector.rs`:
```rust
use crate::types::*;
use std::path::PathBuf;
use which::which;

pub async fn detect_all() -> DetectionResult {
    let start = std::time::Instant::now();
    let mut runtimes = Vec::new();
    let mut errors = Vec::new();
    
    // Detect Docker
    if let Some(docker) = detect_docker().await {
        runtimes.push(docker);
    }
    
    // Detect Podman
    if let Some(podman) = detect_podman().await {
        runtimes.push(podman);
    }
    
    DetectionResult {
        runtimes,
        detected_at: chrono::Utc::now(),
        duration: start.elapsed().as_millis() as u64,
        errors,
    }
}

async fn detect_docker() -> Option<Runtime> {
    // Try PATH first
    if let Ok(path) = which("docker") {
        return build_runtime(RuntimeType::Docker, path).await;
    }
    
    // Try common locations
    for location in get_common_docker_paths() {
        if let Some(runtime) = build_runtime(RuntimeType::Docker, location.into()).await {
            return Some(runtime);
        }
    }
    
    None
}

async fn detect_podman() -> Option<Runtime> {
    // Similar implementation
    todo!()
}

fn get_common_docker_paths() -> Vec<&'static str> {
    #[cfg(target_os = "windows")]
    return vec![
        r"C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    ];
    
    #[cfg(target_os = "macos")]
    return vec![
        "/usr/local/bin/docker",
        "/opt/homebrew/bin/docker",
    ];
    
    #[cfg(target_os = "linux")]
    return vec![
        "/usr/bin/docker",
        "/usr/local/bin/docker",
    ];
}

async fn build_runtime(runtime_type: RuntimeType, path: PathBuf) -> Option<Runtime> {
    // Implementation: parse version, check status
    todo!()
}
```

### 2.4 Implement Tauri Commands

**Create** `src-tauri/src/commands/runtime.rs`:
```rust
use crate::runtime::detector;
use crate::types::*;

#[tauri::command]
pub async fn detect_runtimes(force: bool) -> Result<DetectionResult, String> {
    // TODO: Check cache if !force
    
    detector::detect_all()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_runtime_status(runtime_id: String) -> Result<StatusUpdate, String> {
    // TODO: Implementation
    Err("Not implemented".to_string())
}
```

### 2.5 Register Commands

**Edit** `src-tauri/src/main.rs`:
```rust
mod commands;
mod runtime;
mod types;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::runtime::detect_runtimes,
            commands::runtime::check_runtime_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Step 3: Implement React Frontend (25 min)

### 3.1 Create Type Definitions

**Create** `src/types/runtime.ts`:
```typescript
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
```

### 3.2 Create Zustand Store

**Create** `src/stores/runtimeStore.ts`:
```typescript
import { create } from 'zustand';
import { Runtime, RuntimeStatus } from '../types/runtime';

interface RuntimeState {
  runtimes: Runtime[];
  selectedRuntime: Runtime | null;
  isDetecting: boolean;
  error: string | null;
  
  setRuntimes: (runtimes: Runtime[]) => void;
  selectRuntime: (runtime: Runtime) => void;
  updateRuntimeStatus: (runtimeId: string, status: RuntimeStatus) => void;
  setDetecting: (isDetecting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  runtimes: [],
  selectedRuntime: null,
  isDetecting: false,
  error: null,
  
  setRuntimes: (runtimes) => set({ runtimes }),
  selectRuntime: (runtime) => set({ selectedRuntime: runtime }),
  updateRuntimeStatus: (runtimeId, status) =>
    set((state) => ({
      runtimes: state.runtimes.map((r) =>
        r.id === runtimeId ? { ...r, status } : r
      ),
    })),
  setDetecting: (isDetecting) => set({ isDetecting }),
  setError: (error) => set({ error }),
}));
```

### 3.3 Create Components

**Create** `src/components/WelcomeScreen.tsx`:
```typescript
import { Loader2 } from 'lucide-react';

interface WelcomeScreenProps {
  isDetecting: boolean;
  error: string | null;
}

export function WelcomeScreen({ isDetecting, error }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-harbor-dark text-white">
      <h1 className="text-4xl font-bold mb-4">⚓ HarborMaster</h1>
      <p className="text-xl text-gray-400 mb-8">Master Your Containers</p>
      
      {isDetecting && (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <span>Detecting container runtimes...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 mt-4">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

**Create** `src/components/RuntimeSelector.tsx`:
```typescript
import { Runtime } from '../types/runtime';
import { StatusIndicator } from './StatusIndicator';

interface RuntimeSelectorProps {
  runtimes: Runtime[];
  selected: Runtime | null;
  onSelect: (runtime: Runtime) => void;
}

export function RuntimeSelector({ runtimes, selected, onSelect }: RuntimeSelectorProps) {
  if (runtimes.length === 0) {
    return <div>No runtimes detected</div>;
  }
  
  return (
    <div className="flex gap-2">
      {runtimes.map((runtime) => (
        <button
          key={runtime.id}
          onClick={() => onSelect(runtime)}
          className={`px-4 py-2 rounded ${
            selected?.id === runtime.id ? 'bg-harbor-blue' : 'bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <StatusIndicator status={runtime.status} />
            <span>
              {runtime.type} {runtime.version.full}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Create** `src/components/StatusIndicator.tsx`:
```typescript
import { RuntimeStatus } from '../types/runtime';

interface StatusIndicatorProps {
  status: RuntimeStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  const colorClasses = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
    unknown: 'bg-yellow-500',
  };
  
  return (
    <div
      className={`rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}
      title={status}
    />
  );
}
```

### 3.4 Update App Component

**Edit** `src/App.tsx`:
```typescript
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useRuntimeStore } from './stores/runtimeStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RuntimeSelector } from './components/RuntimeSelector';
import { DetectionResult } from './types/runtime';

function App() {
  const {
    runtimes,
    selectedRuntime,
    isDetecting,
    error,
    setRuntimes,
    selectRuntime,
    setDetecting,
    setError,
  } = useRuntimeStore();
  
  useEffect(() => {
    async function detectRuntimes() {
      setDetecting(true);
      setError(null);
      
      try {
        const result = await invoke<DetectionResult>('detect_runtimes', {
          force: false,
        });
        
        setRuntimes(result.runtimes);
        
        // Auto-select first runtime
        if (result.runtimes.length > 0) {
          selectRuntime(result.runtimes[0]);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setDetecting(false);
      }
    }
    
    detectRuntimes();
  }, []);
  
  if (isDetecting || runtimes.length === 0) {
    return <WelcomeScreen isDetecting={isDetecting} error={error} />;
  }
  
  return (
    <div className="min-h-screen bg-harbor-dark text-white p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-4">HarborMaster</h1>
        <RuntimeSelector
          runtimes={runtimes}
          selected={selectedRuntime}
          onSelect={selectRuntime}
        />
      </header>
    </div>
  );
}

export default App;
```

---

## Step 4: Run and Test (10 min)

### 4.1 Start Development Server

```bash
# From repo root
pnpm tauri dev
```

This will:
1. Compile Rust backend
2. Start Vite dev server
3. Launch application window

### 4.2 Verify Detection

You should see:
1. Welcome screen with "Detecting container runtimes..."
2. Runtime selector with detected Docker/Podman
3. Status indicator (green if running)

### 4.3 Test Edge Cases

- **No runtimes**: Uninstall Docker/Podman temporarily
- **Multiple runtimes**: Install both Docker and Podman
- **Stopped daemon**: Stop Docker/Podman service

---

## Step 5: Write Tests (20 min)

### 5.1 Rust Unit Tests

**Add to** `src-tauri/src/runtime/detector.rs`:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_detect_all() {
        let result = detect_all().await;
        assert!(result.duration < 2000); // < 2 seconds
    }
    
    #[test]
    fn test_get_common_docker_paths() {
        let paths = get_common_docker_paths();
        assert!(!paths.is_empty());
    }
}
```

Run tests:
```bash
cd src-tauri
cargo test
```

### 5.2 Frontend Unit Tests

**Create** `src/__tests__/RuntimeSelector.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RuntimeSelector } from '../components/RuntimeSelector';

describe('RuntimeSelector', () => {
  const mockRuntimes = [
    {
      id: '1',
      type: 'docker' as const,
      version: { major: 24, minor: 0, patch: 7, full: '24.0.7' },
      status: 'running' as const,
      // ... other fields
    },
  ];
  
  it('displays all runtimes', () => {
    const { getByText } = render(
      <RuntimeSelector
        runtimes={mockRuntimes}
        selected={null}
        onSelect={() => {}}
      />
    );
    
    expect(getByText(/docker 24.0.7/i)).toBeInTheDocument();
  });
});
```

Run tests:
```bash
pnpm test
```

---

## Next Steps

After completing this quickstart, you should:

1. ✅ Review [research.md](./research.md) for best practices
2. ✅ Review [data-model.md](./data-model.md) for complete type definitions
3. ✅ Review [contracts/tauri-commands.md](./contracts/tauri-commands.md) for full API
4. ✅ Implement caching (60s TTL)
5. ✅ Implement status polling (5s interval)
6. ✅ Add error handling for all edge cases
7. ✅ Implement platform-specific detection (WSL2, rootless Podman)
8. ✅ Write comprehensive tests (target: 85% coverage)
9. ✅ Add ESLint + Prettier configuration
10. ✅ Set up CI/CD pipeline

---

## Troubleshooting

### Rust Compilation Errors

```bash
# Update Rust toolchain
rustup update

# Clean build cache
cd src-tauri
cargo clean
cargo build
```

### Frontend Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Tauri Not Found

```bash
# Reinstall Tauri CLI
cargo install tauri-cli
```

### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

---

## Success Criteria

You've successfully completed the quickstart when:

- ✅ App launches without errors
- ✅ Runtime detection works (< 500ms)
- ✅ UI displays detected runtimes
- ✅ Status indicators show correct state
- ✅ Runtime selection works
- ✅ Basic tests pass
- ✅ Code follows TypeScript strict mode
- ✅ No ESLint errors

---

## Support

- **Documentation**: See [plan.md](./plan.md) for full implementation details
- **Constitution**: See `.specify/memory/constitution.md` for project principles
- **Issues**: Report bugs to GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

Good luck implementing! 🚀
