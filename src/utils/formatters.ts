import type { Runtime, RuntimeType, Version } from '../types/runtime';

/**
 * Format runtime name with version
 * Examples: "Docker 24.0.7", "Podman 4.8.0"
 */
export function formatRuntimeVersion(runtime: Runtime): string {
  const name = runtime.type === 'docker' ? 'Docker' : 'Podman';
  return `${name} ${runtime.version.full}`;
}

/**
 * Format version object to string
 */
export function formatVersion(version: Version): string {
  return version.full;
}

/**
 * Check if runtime version meets minimum requirements
 */
export function isVersionSupported(runtime: Runtime): boolean {
  const { type, version } = runtime;
  
  if (type === 'docker') {
    // Docker >= 20.10.0
    return version.major > 20 || (version.major === 20 && version.minor >= 10);
  } else if (type === 'podman') {
    // Podman >= 3.0.0
    return version.major >= 3;
  }
  
  return true;
}

/**
 * Get minimum required version string for runtime type
 */
export function getMinimumVersion(type: RuntimeType): string {
  return type === 'docker' ? '20.10.0' : '3.0.0';
}

/**
 * Format relative time from ISO string
 * Examples: "just now", "2 minutes ago", "5 hours ago"
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}
