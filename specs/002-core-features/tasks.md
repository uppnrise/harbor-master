# Task Breakdown: Phase 2 - Core Container Management Features

**Branch**: `002-core-features` | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## Task Summary

**Total Estimated Effort:** 160 hours (4 weeks @ 40 hours/week)  
**Total Tasks:** 330+  
**Organized by:** Epic → User Story → Task

---

## Epic 1: Container Management

### User Story 1.1: List All Containers
**As a user, I want to view all containers with their status, so I can see what's running**

**Acceptance Criteria:**
- Show running and stopped containers
- Display: Name, Image, Status, Ports, Created
- Support both Docker and Podman

**Tasks:**

#### Backend (Rust) - 8 hours
- [x] T1.1.1: Create `src-tauri/src/container/mod.rs` module (1h)
- [x] T1.1.2: Create `src-tauri/src/container/types.rs` with Container struct (1h)
- [x] T1.1.3: Implement `list_containers()` in `src-tauri/src/container/list.rs` (2h)
  - Using CLI: `docker ps --format json` / `podman ps --format json`
- [x] T1.1.4: Add `list_containers` command to `src-tauri/src/commands/container.rs` (1h)
- [x] T1.1.5: Write unit tests for container listing (2h)
- [ ] T1.1.6: Write integration tests with real Docker/Podman (1h)

#### Frontend (TypeScript/React) - 12 hours
- [x] T1.1.7: Create `src/types/container.ts` with Container interface (1h)
- [x] T1.1.8: Create `src/services/containerService.ts` with listContainers() (1h)
- [x] T1.1.9: Create `src/stores/containerStore.ts` with Zustand state (2h)
- [x] T1.1.10: Create `src/components/containers/ContainerList.tsx` (3h)
- [x] T1.1.11: Create `src/components/containers/ContainerRow.tsx` (2h)
- [x] T1.1.12: Create `src/hooks/useContainers.ts` hook (1h)
- [x] T1.1.13: Write tests for ContainerList component (2h)

**Subtotal:** 20 hours

---

### User Story 1.2: Filter and Search Containers
**As a user, I want to filter containers by status and search by name**

**Acceptance Criteria:**
- Filter by: All, Running, Stopped, Paused
- Search by container name or ID
- Sort by: Name, Status, Created, Image

**Tasks:**

#### Backend (Rust) - 2 hours
- [ ] T1.2.1: Add filter parameters to `list_containers()` (1h)
- [ ] T1.2.2: Write tests for filtering (1h)

#### Frontend (TypeScript/React) - 10 hours
- [ ] T1.2.3: Create `src/components/containers/FilterBar.tsx` (3h)
- [ ] T1.2.4: Create `src/utils/filters.ts` with filter logic (2h)
- [ ] T1.2.5: Create `src/utils/sorters.ts` with sort logic (2h)
- [ ] T1.2.6: Update containerStore with filter/search state (1h)
- [ ] T1.2.7: Write tests for filtering and sorting (2h)

**Subtotal:** 12 hours

---

### User Story 1.3: Start, Stop, Restart Containers
**As a user, I want to control container lifecycle**

**Acceptance Criteria:**
- Start, stop, restart, pause, unpause containers
- Visual feedback during operations
- Error handling with user-friendly messages

**Tasks:**

#### Backend (Rust) - 10 hours
- [x] T1.3.1: Create `src-tauri/src/container/lifecycle.rs` (1h)
- [x] T1.3.2: Implement `start_container(id)` (1h)
- [x] T1.3.3: Implement `stop_container(id, timeout)` (1h)
- [x] T1.3.4: Implement `restart_container(id, timeout)` (1h)
- [x] T1.3.5: Implement `pause_container(id)` (1h)
- [x] T1.3.6: Implement `unpause_container(id)` (1h)
- [x] T1.3.7: Add lifecycle commands to commands/container.rs (1h)
- [x] T1.3.8: Write unit tests for all operations (2h)
- [ ] T1.3.9: Write integration tests (1h)

#### Frontend (TypeScript/React) - 14 hours
- [ ] T1.3.10: Create `src/components/containers/ContainerActions.tsx` (4h)
- [ ] T1.3.11: Create `src/hooks/useContainerOps.ts` hook (3h)
- [ ] T1.3.12: Add lifecycle methods to containerService (2h)
- [ ] T1.3.13: Update containerStore with operation state (2h)
- [ ] T1.3.14: Add loading states to ContainerRow (1h)
- [ ] T1.3.15: Write tests for container operations (2h)

**Subtotal:** 24 hours

---

### User Story 1.4: Batch Container Operations
**As a user, I want to perform actions on multiple containers**

**Acceptance Criteria:**
- Select multiple containers
- Batch start, stop, restart, remove
- Progress indicator for batch operations

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T1.4.1: Add batch operation support (concurrent execution) (2h)
- [ ] T1.4.2: Write tests for batch operations (2h)

#### Frontend (TypeScript/React) - 10 hours
- [ ] T1.4.3: Create `src/components/containers/BatchActionsBar.tsx` (3h)
- [ ] T1.4.4: Add multi-selection to ContainerList (2h)
- [ ] T1.4.5: Add batch operation state to containerStore (2h)
- [ ] T1.4.6: Add batch progress UI (2h)
- [ ] T1.4.7: Write tests for batch operations (1h)

**Subtotal:** 14 hours

---

### User Story 1.5: View Container Details
**As a user, I want to see detailed container information**

**Acceptance Criteria:**
- View: Overview, Environment, Labels, Mounts, Networks
- Tabbed interface for organization

**Tasks:**

#### Backend (Rust) - 6 hours
- [x] T1.5.1: Create `src-tauri/src/container/inspect.rs` (1h)
- [x] T1.5.2: Implement `inspect_container(id)` (2h)
- [x] T1.5.3: Add inspect command (1h)
- [x] T1.5.4: Write tests for inspect (2h)

#### Frontend (TypeScript/React) - 12 hours
- [ ] T1.5.5: Create `src/components/containers/ContainerDetails.tsx` (4h)
- [ ] T1.5.6: Create `src/components/containers/ContainerOverview.tsx` (2h)
- [ ] T1.5.7: Create `src/components/layout/DetailPanel.tsx` (3h)
- [ ] T1.5.8: Create `src/components/layout/TabPanel.tsx` (2h)
- [ ] T1.5.9: Write tests for detail components (1h)

**Subtotal:** 18 hours

---

### User Story 1.6: Remove Containers
**As a user, I want to remove containers safely**

**Acceptance Criteria:**
- Confirmation dialog before removal
- Force remove option
- Remove with associated volumes option

**Tasks:**

#### Backend (Rust) - 4 hours
- [x] T1.6.1: Create `src-tauri/src/container/remove.rs` (1h)
- [x] T1.6.2: Implement `remove_container(id, force, volumes)` (1h)
- [x] T1.6.3: Add remove command (1h)
- [x] T1.6.4: Write tests for removal (1h)

#### Frontend (TypeScript/React) - 8 hours
- [ ] T1.6.5: Create `src/components/ui/ConfirmDialog.tsx` (3h)
- [ ] T1.6.6: Add remove confirmation to ContainerActions (2h)
- [ ] T1.6.7: Add remove options (force, volumes) (2h)
- [ ] T1.6.8: Write tests for removal flow (1h)

**Subtotal:** 12 hours

---

## Epic 2: Image Management

### User Story 2.1: List All Images
**As a user, I want to view all images with their details**

**Acceptance Criteria:**
- Show: Repository, Tag, Size, Created
- Support both Docker and Podman

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T2.1.1: Create `src-tauri/src/image/mod.rs` module (1h)
- [ ] T2.1.2: Create `src-tauri/src/image/types.rs` with Image struct (1h)
- [ ] T2.1.3: Implement `list_images()` in `src-tauri/src/image/list.rs` (2h)
- [ ] T2.1.4: Add list_images command (1h)
- [ ] T2.1.5: Write tests for image listing (1h)

#### Frontend (TypeScript/React) - 10 hours
- [ ] T2.1.6: Create `src/types/image.ts` (1h)
- [ ] T2.1.7: Create `src/services/imageService.ts` (1h)
- [ ] T2.1.8: Create `src/stores/imageStore.ts` (2h)
- [ ] T2.1.9: Create `src/components/images/ImageList.tsx` (3h)
- [ ] T2.1.10: Create `src/components/images/ImageRow.tsx` (2h)
- [ ] T2.1.11: Write tests for ImageList (1h)

**Subtotal:** 16 hours

---

### User Story 2.2: Pull Images from Registry
**As a user, I want to pull images with progress tracking**

**Acceptance Criteria:**
- Enter image name and tag
- Show layer-by-layer progress
- Support authentication

**Tasks:**

#### Backend (Rust) - 12 hours
- [ ] T2.2.1: Create `src-tauri/src/image/pull.rs` (2h)
- [ ] T2.2.2: Implement `pull_image(name, tag, auth)` with streaming progress (4h)
- [ ] T2.2.3: Create Tauri event for progress updates (2h)
- [ ] T2.2.4: Add pull command (1h)
- [ ] T2.2.5: Write tests for image pulling (3h)

#### Frontend (TypeScript/React) - 14 hours
- [ ] T2.2.6: Create `src/components/images/PullDialog.tsx` (4h)
- [ ] T2.2.7: Create `src/components/images/PullProgress.tsx` (4h)
- [ ] T2.2.8: Add pull progress handling to imageStore (3h)
- [ ] T2.2.9: Add Tauri event listener for progress (2h)
- [ ] T2.2.10: Write tests for pull flow (1h)

**Subtotal:** 26 hours

---

### User Story 2.3: Push Images to Registry
**As a user, I want to push images with authentication**

**Acceptance Criteria:**
- Enter registry credentials
- Show upload progress
- Handle authentication errors

**Tasks:**

#### Backend (Rust) - 10 hours
- [ ] T2.3.1: Create `src-tauri/src/image/push.rs` (2h)
- [ ] T2.3.2: Implement `push_image(name, tag, auth)` with progress (4h)
- [ ] T2.3.3: Add push command (1h)
- [ ] T2.3.4: Write tests for image pushing (3h)

#### Frontend (TypeScript/React) - 12 hours
- [ ] T2.3.5: Create `src/components/images/PushDialog.tsx` (5h)
- [ ] T2.3.6: Create `src/services/registryService.ts` for auth (3h)
- [ ] T2.3.7: Add push progress handling (2h)
- [ ] T2.3.8: Write tests for push flow (2h)

**Subtotal:** 22 hours

---

### User Story 2.4: Tag/Untag Images
**As a user, I want to tag images with different names**

**Acceptance Criteria:**
- Tag image with new repository:tag
- Remove tags from images

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T2.4.1: Create `src-tauri/src/image/tag.rs` (1h)
- [ ] T2.4.2: Implement `tag_image(id, repo, tag)` (1h)
- [ ] T2.4.3: Implement `untag_image(id, repo, tag)` (1h)
- [ ] T2.4.4: Write tests for tagging (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T2.4.5: Create `src/components/images/TagDialog.tsx` (3h)
- [ ] T2.4.6: Add tag/untag to imageService (1h)
- [ ] T2.4.7: Add tag UI to ImageRow actions (1h)
- [ ] T2.4.8: Write tests for tagging (1h)

**Subtotal:** 10 hours

---

### User Story 2.5: Remove Images
**As a user, I want to remove images safely**

**Acceptance Criteria:**
- Confirmation dialog
- Force remove option
- Show which containers use the image

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T2.5.1: Create `src-tauri/src/image/remove.rs` (1h)
- [ ] T2.5.2: Implement `remove_image(id, force)` (1h)
- [ ] T2.5.3: Add remove command (1h)
- [ ] T2.5.4: Write tests for removal (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T2.5.5: Add remove confirmation to ImageRow (2h)
- [ ] T2.5.6: Check container usage before removal (2h)
- [ ] T2.5.7: Add force remove option (1h)
- [ ] T2.5.8: Write tests for removal (1h)

**Subtotal:** 10 hours

---

### User Story 2.6: Prune Unused Images
**As a user, I want to clean up disk space by removing unused images**

**Acceptance Criteria:**
- Show dangling images
- Bulk removal with size savings
- Confirmation with total space to reclaim

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T2.6.1: Create `src-tauri/src/image/prune.rs` (1h)
- [ ] T2.6.2: Implement `prune_images()` (1h)
- [ ] T2.6.3: Add prune command (1h)
- [ ] T2.6.4: Write tests for pruning (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T2.6.5: Create `src/components/images/PruneDialog.tsx` (3h)
- [ ] T2.6.6: Show space savings calculation (2h)
- [ ] T2.6.7: Write tests for prune flow (1h)

**Subtotal:** 10 hours

---

## Epic 3: Real-Time Log Viewer

### User Story 3.1: View Container Logs
**As a user, I want to see container logs in real-time**

**Acceptance Criteria:**
- Stream logs from container
- Auto-scroll with follow mode
- Handle high throughput (1000 lines/sec)

**Tasks:**

#### Backend (Rust) - 14 hours
- [ ] T3.1.1: Create `src-tauri/src/container/logs.rs` (2h)
- [ ] T3.1.2: Create `src-tauri/src/streaming/mod.rs` (1h)
- [ ] T3.1.3: Implement log streaming with Tokio streams (4h)
- [ ] T3.1.4: Add Tauri event emitter for log lines (2h)
- [ ] T3.1.5: Implement efficient buffering (ring buffer) (3h)
- [ ] T3.1.6: Write tests for log streaming (2h)

#### Frontend (TypeScript/React) - 20 hours
- [ ] T3.1.7: Create `src/types/log.ts` (1h)
- [ ] T3.1.8: Create `src/stores/logStore.ts` with circular buffer (4h)
- [ ] T3.1.9: Create `src/components/logs/LogViewer.tsx` with virtual scrolling (6h)
- [ ] T3.1.10: Create `src/components/logs/LogLine.tsx` (2h)
- [ ] T3.1.11: Create `src/components/logs/LogControls.tsx` (3h)
- [ ] T3.1.12: Create `src/hooks/useLogStream.ts` (3h)
- [ ] T3.1.13: Write tests for log viewer (1h)

**Subtotal:** 34 hours

---

### User Story 3.2: Search and Filter Logs
**As a user, I want to search and filter logs**

**Acceptance Criteria:**
- Search by text (case-sensitive/insensitive)
- Filter by log level (info, warning, error, debug)
- Highlight search matches

**Tasks:**

#### Frontend (TypeScript/React) - 12 hours
- [ ] T3.2.1: Create `src/components/logs/LogSearch.tsx` (3h)
- [ ] T3.2.2: Create `src/components/logs/LogFilter.tsx` (3h)
- [ ] T3.2.3: Create `src/utils/parsers.ts` for log level detection (2h)
- [ ] T3.2.4: Add search/filter state to logStore (2h)
- [ ] T3.2.5: Implement search highlighting (1h)
- [ ] T3.2.6: Write tests for search/filter (1h)

**Subtotal:** 12 hours

---

### User Story 3.3: Export Logs
**As a user, I want to export logs to a file**

**Acceptance Criteria:**
- Export current view (filtered/searched)
- Export all logs
- Save as .txt or .log file

**Tasks:**

#### Backend (Rust) - 3 hours
- [ ] T3.3.1: Implement `export_logs(container_id, filepath)` (2h)
- [ ] T3.3.2: Write tests for export (1h)

#### Frontend (TypeScript/React) - 5 hours
- [ ] T3.3.3: Create `src/components/logs/LogExport.tsx` (3h)
- [ ] T3.3.4: Add export to logService (1h)
- [ ] T3.3.5: Write tests for export (1h)

**Subtotal:** 8 hours

---

## Epic 4: Resource Monitoring

### User Story 4.1: Monitor Single Container Stats
**As a user, I want to see real-time CPU, memory, network, and disk usage**

**Acceptance Criteria:**
- Show: CPU %, Memory usage/limit, Network I/O, Disk I/O
- Update every 1-2 seconds
- Display as gauges and charts

**Tasks:**

#### Backend (Rust) - 10 hours
- [ ] T4.1.1: Create `src-tauri/src/container/stats.rs` (2h)
- [ ] T4.1.2: Create `src-tauri/src/streaming/stats.rs` (2h)
- [ ] T4.1.3: Implement stats streaming (3h)
- [ ] T4.1.4: Add stats Tauri events (2h)
- [ ] T4.1.5: Write tests for stats collection (1h)

#### Frontend (TypeScript/React) - 16 hours
- [ ] T4.1.6: Create `src/types/stats.ts` (1h)
- [ ] T4.1.7: Create `src/stores/statsStore.ts` (3h)
- [ ] T4.1.8: Create `src/components/stats/StatsViewer.tsx` (4h)
- [ ] T4.1.9: Create `src/components/stats/StatsGauge.tsx` (3h)
- [ ] T4.1.10: Create `src/components/stats/StatsChart.tsx` (3h)
- [ ] T4.1.11: Create `src/hooks/useContainerStats.ts` (1h)
- [ ] T4.1.12: Write tests for stats components (1h)

**Subtotal:** 26 hours

---

### User Story 4.2: View Process List
**As a user, I want to see processes running inside a container**

**Acceptance Criteria:**
- Show: PID, User, CPU %, Memory %, Command
- Auto-refresh every 2 seconds

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T4.2.1: Create `src-tauri/src/container/top.rs` (2h)
- [ ] T4.2.2: Implement `container_top(id)` (1h)
- [ ] T4.2.3: Write tests for top (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T4.2.4: Create `src/components/stats/ProcessList.tsx` (4h)
- [ ] T4.2.5: Add polling with usePolling hook (1h)
- [ ] T4.2.6: Write tests for process list (1h)

**Subtotal:** 10 hours

---

### User Story 4.3: Multi-Container Monitoring Dashboard
**As a user, I want to monitor multiple containers simultaneously**

**Acceptance Criteria:**
- Grid view of multiple containers
- Real-time stats for each
- Support monitoring 20+ containers

**Tasks:**

#### Frontend (TypeScript/React) - 14 hours
- [ ] T4.3.1: Create `src/components/stats/MonitorDashboard.tsx` (5h)
- [ ] T4.3.2: Create `src/components/stats/MonitorCard.tsx` (3h)
- [ ] T4.3.3: Create `src/hooks/useMultiStats.ts` (3h)
- [ ] T4.3.4: Optimize for 20+ containers (batching, throttling) (2h)
- [ ] T4.3.5: Write tests for dashboard (1h)

**Subtotal:** 14 hours

---

## Epic 5: Volume Management

### User Story 5.1: List All Volumes
**As a user, I want to view all volumes**

**Acceptance Criteria:**
- Show: Name, Driver, Mountpoint, Size, In-Use
- Support Docker and Podman

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T5.1.1: Create `src-tauri/src/volume/mod.rs` (1h)
- [ ] T5.1.2: Create `src-tauri/src/volume/types.rs` (1h)
- [ ] T5.1.3: Implement `list_volumes()` (2h)
- [ ] T5.1.4: Add list_volumes command (1h)
- [ ] T5.1.5: Write tests for volume listing (1h)

#### Frontend (TypeScript/React) - 8 hours
- [ ] T5.1.6: Create `src/types/volume.ts` (1h)
- [ ] T5.1.7: Create `src/services/volumeService.ts` (1h)
- [ ] T5.1.8: Create `src/stores/volumeStore.ts` (2h)
- [ ] T5.1.9: Create `src/components/volumes/VolumeList.tsx` (2h)
- [ ] T5.1.10: Create `src/components/volumes/VolumeRow.tsx` (1h)
- [ ] T5.1.11: Write tests for VolumeList (1h)

**Subtotal:** 14 hours

---

### User Story 5.2: Create and Remove Volumes
**As a user, I want to create and remove volumes**

**Acceptance Criteria:**
- Create volume with name and driver
- Remove volume with confirmation
- Warn if volume is in use

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T5.2.1: Create `src-tauri/src/volume/create.rs` (2h)
- [ ] T5.2.2: Create `src-tauri/src/volume/remove.rs` (2h)
- [ ] T5.2.3: Add volume commands (1h)
- [ ] T5.2.4: Write tests for create/remove (1h)

#### Frontend (TypeScript/React) - 10 hours
- [ ] T5.2.5: Create `src/components/volumes/CreateVolumeDialog.tsx` (4h)
- [ ] T5.2.6: Add remove confirmation (2h)
- [ ] T5.2.7: Check in-use status (2h)
- [ ] T5.2.8: Write tests for create/remove (2h)

**Subtotal:** 16 hours

---

### User Story 5.3: Inspect Volume Details
**As a user, I want to see volume details**

**Acceptance Criteria:**
- Show: Name, Driver, Mountpoint, Labels, Options
- Show which containers use the volume

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T5.3.1: Create `src-tauri/src/volume/inspect.rs` (2h)
- [ ] T5.3.2: Add inspect command (1h)
- [ ] T5.3.3: Write tests for inspect (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T5.3.4: Create `src/components/volumes/VolumeDetails.tsx` (4h)
- [ ] T5.3.5: Show container usage (1h)
- [ ] T5.3.6: Write tests for details (1h)

**Subtotal:** 10 hours

---

### User Story 5.4: Prune Unused Volumes
**As a user, I want to clean up unused volumes**

**Acceptance Criteria:**
- Show unused volumes
- Bulk removal with confirmation

**Tasks:**

#### Backend (Rust) - 3 hours
- [ ] T5.4.1: Create `src-tauri/src/volume/prune.rs` (1h)
- [ ] T5.4.2: Add prune command (1h)
- [ ] T5.4.3: Write tests for prune (1h)

#### Frontend (TypeScript/React) - 5 hours
- [ ] T5.4.4: Create `src/components/volumes/PruneVolumesDialog.tsx` (3h)
- [ ] T5.4.5: Show space savings (1h)
- [ ] T5.4.6: Write tests for prune (1h)

**Subtotal:** 8 hours

---

## Epic 6: Network Management

### User Story 6.1: List All Networks
**As a user, I want to view all networks**

**Acceptance Criteria:**
- Show: Name, Driver, Subnet, Connected Containers
- Support Docker and Podman

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T6.1.1: Create `src-tauri/src/network/mod.rs` (1h)
- [ ] T6.1.2: Create `src-tauri/src/network/types.rs` (1h)
- [ ] T6.1.3: Implement `list_networks()` (2h)
- [ ] T6.1.4: Add list_networks command (1h)
- [ ] T6.1.5: Write tests for network listing (1h)

#### Frontend (TypeScript/React) - 8 hours
- [ ] T6.1.6: Create `src/types/network.ts` (1h)
- [ ] T6.1.7: Create `src/services/networkService.ts` (1h)
- [ ] T6.1.8: Create `src/stores/networkStore.ts` (2h)
- [ ] T6.1.9: Create `src/components/networks/NetworkList.tsx` (2h)
- [ ] T6.1.10: Create `src/components/networks/NetworkRow.tsx` (1h)
- [ ] T6.1.11: Write tests for NetworkList (1h)

**Subtotal:** 14 hours

---

### User Story 6.2: Create and Remove Networks
**As a user, I want to create and remove networks**

**Acceptance Criteria:**
- Create network with name, driver, subnet
- Remove network with confirmation
- Warn if containers are connected

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T6.2.1: Create `src-tauri/src/network/create.rs` (2h)
- [ ] T6.2.2: Create `src-tauri/src/network/remove.rs` (2h)
- [ ] T6.2.3: Add network commands (1h)
- [ ] T6.2.4: Write tests for create/remove (1h)

#### Frontend (TypeScript/React) - 10 hours
- [ ] T6.2.5: Create `src/components/networks/CreateNetworkDialog.tsx` (4h)
- [ ] T6.2.6: Add remove confirmation (2h)
- [ ] T6.2.7: Check container connections (2h)
- [ ] T6.2.8: Write tests for create/remove (2h)

**Subtotal:** 16 hours

---

### User Story 6.3: Connect/Disconnect Containers
**As a user, I want to connect containers to networks**

**Acceptance Criteria:**
- Connect container to network
- Disconnect container from network
- Show connection status

**Tasks:**

#### Backend (Rust) - 6 hours
- [ ] T6.3.1: Create `src-tauri/src/network/connect.rs` (2h)
- [ ] T6.3.2: Create `src-tauri/src/network/disconnect.rs` (2h)
- [ ] T6.3.3: Add connect/disconnect commands (1h)
- [ ] T6.3.4: Write tests for connect/disconnect (1h)

#### Frontend (TypeScript/React) - 8 hours
- [ ] T6.3.5: Create `src/components/networks/ConnectContainerDialog.tsx` (3h)
- [ ] T6.3.6: Create `src/components/networks/DisconnectConfirm.tsx` (2h)
- [ ] T6.3.7: Update NetworkDetails with connections (2h)
- [ ] T6.3.8: Write tests for connect/disconnect (1h)

**Subtotal:** 14 hours

---

### User Story 6.4: Inspect Network Details
**As a user, I want to see network details**

**Acceptance Criteria:**
- Show: Name, Driver, Subnet, Gateway, Labels
- Show connected containers with IP addresses

**Tasks:**

#### Backend (Rust) - 4 hours
- [ ] T6.4.1: Create `src-tauri/src/network/inspect.rs` (2h)
- [ ] T6.4.2: Add inspect command (1h)
- [ ] T6.4.3: Write tests for inspect (1h)

#### Frontend (TypeScript/React) - 6 hours
- [ ] T6.4.4: Create `src/components/networks/NetworkDetails.tsx` (4h)
- [ ] T6.4.5: Show container IP addresses (1h)
- [ ] T6.4.6: Write tests for details (1h)

**Subtotal:** 10 hours

---

## Epic 7: Shared UI Components

### Reusable UI Library
**Build common components for consistent UX**

**Tasks:**

#### Frontend (TypeScript/React) - 24 hours
- [ ] T7.1: Create `src/components/ui/VirtualList.tsx` (@tanstack/react-virtual) (4h)
- [ ] T7.2: Create `src/components/ui/Button.tsx` (2h)
- [ ] T7.3: Create `src/components/ui/Input.tsx` (2h)
- [ ] T7.4: Create `src/components/ui/Select.tsx` (2h)
- [ ] T7.5: Create `src/components/ui/Checkbox.tsx` (1h)
- [ ] T7.6: Create `src/components/ui/ProgressBar.tsx` (2h)
- [ ] T7.7: Create `src/components/ui/ProgressRing.tsx` (2h)
- [ ] T7.8: Create `src/components/ui/Tooltip.tsx` (2h)
- [ ] T7.9: Create `src/components/ui/Skeleton.tsx` (2h)
- [ ] T7.10: Create `src/components/ui/ErrorBoundary.tsx` (2h)
- [ ] T7.11: Create `src/components/ui/Chart.tsx` (lightweight SVG charts) (3h)

**Subtotal:** 24 hours

---

## Epic 8: Layout & Navigation

### App Layout and Navigation
**Build main app structure**

**Tasks:**

#### Frontend (TypeScript/React) - 16 hours
- [ ] T8.1: Create `src/components/layout/Sidebar.tsx` (4h)
- [ ] T8.2: Create `src/components/layout/MainContent.tsx` (2h)
- [ ] T8.3: Create `src/components/layout/DetailPanel.tsx` (sliding panel) (4h)
- [ ] T8.4: Create `src/components/layout/Breadcrumbs.tsx` (2h)
- [ ] T8.5: Update `src/App.tsx` with routing (2h)
- [ ] T8.6: Add navigation state to uiStore (2h)

**Subtotal:** 16 hours

---

## Epic 9: Performance & Optimization

### Performance Optimization
**Ensure all performance targets are met**

**Tasks:**

#### Backend (Rust) - 12 hours
- [ ] T9.1: Optimize container listing for 1000+ containers (3h)
- [ ] T9.2: Implement efficient log streaming (ring buffer, batching) (4h)
- [ ] T9.3: Optimize stats collection (batch requests) (3h)
- [ ] T9.4: Add caching for frequently accessed data (2h)

#### Frontend (TypeScript/React) - 16 hours
- [ ] T9.5: Implement virtual scrolling for all lists (4h)
- [ ] T9.6: Optimize re-renders with React.memo and useMemo (3h)
- [ ] T9.7: Debounce search and filter operations (2h)
- [ ] T9.8: Lazy load heavy components (2h)
- [ ] T9.9: Implement Web Workers for log parsing (3h)
- [ ] T9.10: Optimize chart rendering (60 FPS) (2h)

**Subtotal:** 28 hours

---

## Epic 10: Testing & Documentation

### Comprehensive Testing
**Achieve 80% test coverage**

**Tasks:**

#### Unit Tests - 20 hours
- [ ] T10.1: Backend unit tests (all Rust modules) (10h)
- [ ] T10.2: Frontend unit tests (services, stores, hooks, utils) (10h)

#### Integration Tests - 12 hours
- [ ] T10.3: Docker/Podman API integration tests (6h)
- [ ] T10.4: Log streaming integration tests (3h)
- [ ] T10.5: Stats collection integration tests (3h)

#### E2E Tests - 16 hours
- [ ] T10.6: Container management workflow (4h)
- [ ] T10.7: Image pull/push workflow (4h)
- [ ] T10.8: Volume/network management workflow (3h)
- [ ] T10.9: Log viewer workflow (2h)
- [ ] T10.10: Multi-container monitoring workflow (3h)

#### Performance Tests - 8 hours
- [ ] T10.11: List 1000 containers (< 500ms render) (2h)
- [ ] T10.12: Stream 10,000 log lines (smooth scrolling) (2h)
- [ ] T10.13: Monitor 20 containers (< 2s update) (2h)
- [ ] T10.14: Virtual scrolling with 10,000 items (60 FPS) (2h)

#### Documentation - 16 hours
- [ ] T10.15: API documentation (Tauri commands, rustdoc) (4h)
- [ ] T10.16: Component documentation (TSDoc) (4h)
- [ ] T10.17: User guide updates (4h)
- [ ] T10.18: Architecture diagrams (2h)
- [ ] T10.19: Developer quickstart guide (2h)

**Subtotal:** 72 hours

---

## Summary by Epic

| Epic | Estimated Hours | Tasks |
|------|----------------|-------|
| 1. Container Management | 100h | 70+ tasks |
| 2. Image Management | 94h | 50+ tasks |
| 3. Real-Time Logs | 54h | 30+ tasks |
| 4. Resource Monitoring | 50h | 35+ tasks |
| 5. Volume Management | 48h | 30+ tasks |
| 6. Network Management | 54h | 35+ tasks |
| 7. Shared UI Components | 24h | 11 tasks |
| 8. Layout & Navigation | 16h | 6 tasks |
| 9. Performance Optimization | 28h | 10 tasks |
| 10. Testing & Documentation | 72h | 19 tasks |
| **TOTAL** | **540h** | **330+ tasks** |

---

## Implementation Schedule (4 Weeks)

### Week 1: Container & Image Management
- Day 1-2: Container listing, filtering, search (Epic 1.1, 1.2)
- Day 3-4: Container lifecycle operations (Epic 1.3, 1.4)
- Day 5: Container details and removal (Epic 1.5, 1.6)
- Weekend: Image listing and pull (Epic 2.1, 2.2)

**Checkpoint:** Can list, filter, and manage containers. Can list and pull images.

### Week 2: Image Management & Logs
- Day 1-2: Image push, tag, remove, prune (Epic 2.3-2.6)
- Day 3-5: Real-time log viewer (Epic 3.1-3.3)

**Checkpoint:** Image management complete. Logs stream in real-time.

### Week 3: Stats & Volume/Network
- Day 1-3: Resource monitoring (Epic 4.1-4.3)
- Day 4-5: Volume management (Epic 5.1-5.4)
- Weekend: Network management (Epic 6.1-6.4)

**Checkpoint:** Stats update smoothly. Volumes and networks can be managed.

### Week 4: Polish, Testing, Documentation
- Day 1-2: Shared UI components (Epic 7)
- Day 2-3: Layout & navigation (Epic 8)
- Day 3-4: Performance optimization (Epic 9)
- Day 4-5: Testing & documentation (Epic 10)

**Checkpoint:** All features complete, tested, documented. Ready for release.

---

## Dependencies Between Tasks

### Phase 2A Dependencies (Week 1)
- Container listing → Filter bar → Batch operations
- Container lifecycle → Container actions UI
- Container inspect → Detail panel

### Phase 2B Dependencies (Week 1-2)
- Image listing → Image operations
- Pull implementation → Progress UI
- Push implementation → Registry auth

### Phase 2C Dependencies (Week 2-3)
- Log streaming backend → Log viewer UI
- Stats streaming backend → Stats viewer UI
- Single container stats → Multi-container dashboard

### Phase 2D Dependencies (Week 3)
- Volume/Network listing → Create/remove operations
- Network inspect → Connect/disconnect UI

### Phase 2E Dependencies (Week 4)
- All epics complete → Performance optimization
- All features complete → E2E tests
- All code complete → Documentation

---

## Risk Mitigation

### High-Risk Tasks (Monitor Closely)
- T3.1.3: Log streaming implementation (high throughput) - 4h
- T3.1.9: LogViewer with virtual scrolling - 6h
- T4.3.3: Multi-container stats hook - 3h
- T9.5: Virtual scrolling for all lists - 4h
- T9.9: Web Workers for log parsing - 3h

**Mitigation:**
- Prototype early (research phase)
- Use proven libraries
- Performance testing during development
- Fallback to simpler approaches if needed

---

## Task Completion Tracking

### Format
- [ ] NOT STARTED
- [~] IN PROGRESS
- [x] COMPLETE

### Progress Updates
Update this document as tasks are completed. Use conventional commits:
- `feat: Implement container listing (T1.1.3)`
- `test: Add unit tests for image pulling (T2.2.5)`
- `docs: Add API documentation for volumes (T10.15)`

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-31  
**Total Tasks:** 330+  
**Total Estimated Effort:** 540 hours (13.5 weeks)  
**Target Timeline:** 4 weeks (focused on P0 stories, 160 hours)

**Note:** Task estimates are aggressive for 4-week timeline. Consider:
1. Prioritize P0 user stories first (core functionality)
2. Defer P2 stories to Phase 3 if timeline slips (network topology, volume file browsing)
3. Incremental PRs for early feedback
4. Parallel work on independent epics (containers + images, logs + stats)

**Next Action:** Get user approval, then create feature branch `002-core-features` and begin implementation

