/**
 * Container management types
 * These types match the Rust backend container types
 */

export enum ContainerState {
  Created = 'created',
  Running = 'running',
  Paused = 'paused',
  Restarting = 'restarting',
  Removing = 'removing',
  Exited = 'exited',
  Dead = 'dead',
}

export interface PortBinding {
  containerPort: number;
  hostPort: number;
  protocol: string;
  hostIp: string;
}

export interface ContainerNetwork {
  networkId: string;
  endpointId: string;
  gateway: string;
  ipAddress: string;
  macAddress: string;
}

export interface Mount {
  type: string;
  source: string;
  destination: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerStatus {
  state: ContainerState;
  running: boolean;
  paused: boolean;
  pid: number;
  exitCode: number;
  startedAt: string;
  finishedAt: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  imageId: string;
  command: string;
  created: number;
  state: ContainerState;
  status: string;
  ports: PortBinding[];
  labels: Record<string, string>;
  sizeRw?: number;
  sizeRootFs?: number;
  networks: ContainerNetwork[];
  mounts: Mount[];
}

export interface ContainerListOptions {
  all: boolean;
  limit?: number;
  size: boolean;
  filters?: Record<string, string>;
}

export interface RemoveOptions {
  force: boolean;
  volumes: boolean;
}

export interface PruneResult {
  containersDeleted?: string[];
  spaceReclaimed: number;
}

// Container details (from inspect)
export interface ContainerStateDetails {
  status: string;
  running: boolean;
  paused: boolean;
  restarting: boolean;
  oomKilled: boolean;
  dead: boolean;
  pid: number;
  exitCode: number;
  error: string;
  startedAt: string;
  finishedAt: string;
}

export interface ContainerConfig {
  hostname: string;
  domainname: string;
  user: string;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
  tty: boolean;
  openStdin: boolean;
  stdinOnce: boolean;
  env: string[];
  cmd?: string[];
  image: string;
  volumes?: Record<string, unknown>;
  workingDir: string;
  entrypoint?: string[];
  onBuild?: string[];
  labels: Record<string, string>;
}

export interface NetworkSettings {
  bridge: string;
  sandboxId: string;
  hairpinMode: boolean;
  linkLocalIpv6Address: string;
  linkLocalIpv6PrefixLen: number;
  ports: Record<string, Array<{ hostIp: string; hostPort: string }> | null>;
  sandboxKey: string;
  gateway: string;
  ipAddress: string;
  ipPrefixLen: number;
  ipv6Gateway: string;
  macAddress: string;
  networks: Record<string, unknown>;
}

export interface MountDetails {
  mountType?: string;
  name?: string;
  source: string;
  destination: string;
  driver?: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerDetails {
  id: string;
  created: string;
  path: string;
  args: string[];
  state: ContainerStateDetails;
  image: string;
  name: string;
  restartCount: number;
  driver: string;
  platform: string;
  mountLabel: string;
  processLabel: string;
  appArmorProfile: string;
  config: ContainerConfig;
  networkSettings: NetworkSettings;
  mounts: MountDetails[];
}
