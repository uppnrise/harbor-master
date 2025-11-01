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

/**
 * Remove a single image
 * @param runtime - The container runtime to use
 * @param imageId - ID of the image to remove
 * @param force - Force removal even if containers are using this image
 * @param noPrune - Don't delete untagged parent images
 * @returns Promise that resolves when image is removed
 */
export async function removeImage(
  runtime: Runtime,
  imageId: string,
  force = false,
  noPrune = false
): Promise<void> {
  try {
    await invoke('remove_image', {
      runtime,
      imageId,
      force,
      noPrune,
    });
  } catch (error) {
    console.error('Failed to remove image:', error);
    throw new Error(`Failed to remove image: ${error}`);
  }
}

/**
 * Remove multiple images
 * @param runtime - The container runtime to use
 * @param imageIds - Array of image IDs to remove
 * @param force - Force removal even if containers are using these images
 * @param noPrune - Don't delete untagged parent images
 * @returns Promise resolving to array of successfully removed image IDs
 */
export async function removeImages(
  runtime: Runtime,
  imageIds: string[],
  force = false,
  noPrune = false
): Promise<string[]> {
  try {
    const removed = await invoke<string[]>('remove_images', {
      runtime,
      imageIds,
      force,
      noPrune,
    });
    return removed;
  } catch (error) {
    console.error('Failed to remove images:', error);
    throw new Error(`Failed to remove images: ${error}`);
  }
}
