/**
 * Image management service
 * Provides API for Docker/Podman image operations via Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';
import type { Image } from '../types/image';
import type { Runtime } from '../types/runtime';

/**
 * List all images for the current runtime
 * @param runtime - The container runtime to use
 * @returns Promise resolving to array of images
 */
export async function listImages(runtime: Runtime): Promise<Image[]> {
  try {
    const images = await invoke<Image[]>('list_images', { runtime });
    return images;
  } catch (error) {
    console.error('Failed to list images:', error);
    throw new Error(`Failed to list images: ${error}`);
  }
}
