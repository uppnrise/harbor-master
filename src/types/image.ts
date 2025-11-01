/**
 * Image type definitions
 * Matches the Rust Image struct from backend
 */

export interface Image {
  /** Image ID (full SHA256 hash) */
  id: string;

  /** Repository name (e.g., "nginx", "ubuntu") */
  repository: string;

  /** Image tag (e.g., "latest", "20.04") */
  tag: string;

  /** Image digest (SHA256 hash) */
  digest?: string;

  /** Image size in bytes */
  size: number;

  /** Creation timestamp (ISO 8601 format) */
  created: string;

  /** Number of containers using this image */
  containers: number;

  /** Labels applied to the image */
  labels: Record<string, string>;
}

/**
 * Format bytes into human-readable size
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.2 GB")
 */
export function formatImageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) {
    return '0 B';
  }

  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${bytes} ${units[unitIndex]}`;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get the full image name (repository:tag)
 * @param image - The image object
 * @returns Full image name
 */
export function getImageName(image: Image): string {
  return `${image.repository}:${image.tag}`;
}

/**
 * Check if an image is dangling (no tag)
 * @param image - The image object
 * @returns True if image is dangling
 */
export function isDanglingImage(image: Image): boolean {
  return image.repository === '<none>' || image.tag === '<none>';
}

/**
 * Progress status for an image layer during pull
 */
export interface LayerProgress {
  /** Layer ID */
  id: string;
  /** Status message */
  status: string;
  /** Current progress in bytes */
  current?: number;
  /** Total size in bytes */
  total?: number;
}

/**
 * Overall pull progress
 */
export interface PullProgress {
  /** Image being pulled */
  image: string;
  /** Individual layer progress */
  layers: LayerProgress[];
  /** Overall status message */
  message: string;
  /** Whether pull is complete */
  complete: boolean;
}
