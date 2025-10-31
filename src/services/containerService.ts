/**
 * Container service - Tauri command wrappers for container operations
 */
import { invoke } from '@tauri-apps/api/core';
import type {
  Container,
  ContainerDetails,
  ContainerListOptions,
  PruneResult,
} from '../types/container';
import type { Runtime } from '../types/runtime';

/**
 * List containers from the selected runtime
 */
export async function listContainers(
  runtime: Runtime,
  options: ContainerListOptions
): Promise<Container[]> {
  return invoke<Container[]>('list_containers_command', { runtime, options });
}

/**
 * Start a container
 */
export async function startContainer(
  runtime: Runtime,
  containerId: string
): Promise<void> {
  return invoke<void>('start_container_command', { runtime, containerId });
}

/**
 * Stop a container
 */
export async function stopContainer(
  runtime: Runtime,
  containerId: string,
  timeout?: number
): Promise<void> {
  return invoke<void>('stop_container_command', {
    runtime,
    containerId,
    timeout: timeout ?? null,
  });
}

/**
 * Restart a container
 */
export async function restartContainer(
  runtime: Runtime,
  containerId: string,
  timeout?: number
): Promise<void> {
  return invoke<void>('restart_container_command', {
    runtime,
    containerId,
    timeout: timeout ?? null,
  });
}

/**
 * Pause a container
 */
export async function pauseContainer(
  runtime: Runtime,
  containerId: string
): Promise<void> {
  return invoke<void>('pause_container_command', { runtime, containerId });
}

/**
 * Unpause a container
 */
export async function unpauseContainer(
  runtime: Runtime,
  containerId: string
): Promise<void> {
  return invoke<void>('unpause_container_command', { runtime, containerId });
}

/**
 * Get detailed information about a container
 */
export async function inspectContainer(
  runtime: Runtime,
  containerId: string
): Promise<ContainerDetails> {
  return invoke<ContainerDetails>('inspect_container_command', {
    runtime,
    containerId,
  });
}

/**
 * Remove a container
 */
export async function removeContainer(
  runtime: Runtime,
  containerId: string,
  force = false,
  volumes = false
): Promise<void> {
  return invoke<void>('remove_container_command', {
    runtime,
    containerId,
    force,
    volumes,
  });
}

/**
 * Remove multiple containers
 */
export async function removeContainers(
  runtime: Runtime,
  containerIds: string[],
  force = false,
  volumes = false
): Promise<string[]> {
  return invoke<string[]>('remove_containers_command', {
    runtime,
    containerIds,
    force,
    volumes,
  });
}

/**
 * Prune stopped containers
 */
export async function pruneContainers(runtime: Runtime): Promise<PruneResult> {
  return invoke<PruneResult>('prune_containers_command', { runtime });
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  id: string;
  success: boolean;
  error?: string | undefined;
}

/**
 * Start multiple containers concurrently
 */
export async function startContainers(
  runtime: Runtime,
  containerIds: string[]
): Promise<BatchOperationResult[]> {
  const results = await invoke<[string, { Ok?: undefined; Err?: string }][]>(
    'start_containers_command',
    { runtime, containerIds }
  );
  
  return results.map(([id, result]) => ({
    id,
    success: result.Ok !== undefined || !result.Err,
    error: result.Err,
  }));
}

/**
 * Stop multiple containers concurrently
 */
export async function stopContainers(
  runtime: Runtime,
  containerIds: string[],
  timeout?: number
): Promise<BatchOperationResult[]> {
  const results = await invoke<[string, { Ok?: undefined; Err?: string }][]>(
    'stop_containers_command',
    { runtime, containerIds, timeout: timeout ?? null }
  );
  
  return results.map(([id, result]) => ({
    id,
    success: result.Ok !== undefined || !result.Err,
    error: result.Err,
  }));
}

/**
 * Restart multiple containers concurrently
 */
export async function restartContainers(
  runtime: Runtime,
  containerIds: string[],
  timeout?: number
): Promise<BatchOperationResult[]> {
  const results = await invoke<[string, { Ok?: undefined; Err?: string }][]>(
    'restart_containers_command',
    { runtime, containerIds, timeout: timeout ?? null }
  );
  
  return results.map(([id, result]) => ({
    id,
    success: result.Ok !== undefined || !result.Err,
    error: result.Err,
  }));
}

/**
 * Pause multiple containers concurrently
 */
export async function pauseContainers(
  runtime: Runtime,
  containerIds: string[]
): Promise<BatchOperationResult[]> {
  const results = await invoke<[string, { Ok?: undefined; Err?: string }][]>(
    'pause_containers_command',
    { runtime, containerIds }
  );
  
  return results.map(([id, result]) => ({
    id,
    success: result.Ok !== undefined || !result.Err,
    error: result.Err,
  }));
}

/**
 * Unpause multiple containers concurrently
 */
export async function unpauseContainers(
  runtime: Runtime,
  containerIds: string[]
): Promise<BatchOperationResult[]> {
  const results = await invoke<[string, { Ok?: undefined; Err?: string }][]>(
    'unpause_containers_command',
    { runtime, containerIds }
  );
  
  return results.map(([id, result]) => ({
    id,
    success: result.Ok !== undefined || !result.Err,
    error: result.Err,
  }));
}
