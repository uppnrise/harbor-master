/**
 * Image store using Zustand
 * Manages image state, filtering, and operations
 */

import { create } from 'zustand';
import type { Image } from '../types/image';
import * as imageService from '../services/imageService';
import type { PruneResult } from '../services/imageService';
import type { Runtime } from '../types/runtime';

export interface ImageStore {
  // State
  images: Image[];
  selectedImageIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterTags: 'all' | 'tagged' | 'dangling';

  // Actions
  loadImages: (runtime: Runtime) => Promise<void>;
  removeImage: (runtime: Runtime, imageId: string, force?: boolean) => Promise<void>;
  removeImages: (runtime: Runtime, imageIds: string[], force?: boolean) => Promise<void>;
  pruneImages: (runtime: Runtime, all?: boolean) => Promise<PruneResult>;
  setSearchQuery: (query: string) => void;
  setFilterTags: (filter: 'all' | 'tagged' | 'dangling') => void;
  selectImage: (imageId: string) => void;
  deselectImage: (imageId: string) => void;
  selectAllImages: (imageIds: string[]) => void;
  deselectAllImages: () => void;
  clearError: () => void;
}

export const useImageStore = create<ImageStore>((set, get) => ({
  // Initial state
  images: [],
  selectedImageIds: new Set(),
  isLoading: false,
  error: null,
  searchQuery: '',
  filterTags: 'all',

  // Load images from backend
  loadImages: async (runtime: Runtime) => {
    set({ isLoading: true, error: null });
    try {
      const images = await imageService.listImages(runtime);
      set({ images, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Remove a single image
  removeImage: async (runtime: Runtime, imageId: string, force = false) => {
    set({ isLoading: true, error: null });
    try {
      await imageService.removeImage(runtime, imageId, force);
      // Reload images to reflect the change
      await get().loadImages(runtime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw for UI to handle
    }
  },

  // Remove multiple images
  removeImages: async (runtime: Runtime, imageIds: string[], force = false) => {
    set({ isLoading: true, error: null });
    try {
      await imageService.removeImages(runtime, imageIds, force);
      // Clear selection and reload
      set({ selectedImageIds: new Set() });
      await get().loadImages(runtime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw for UI to handle
    }
  },

  // Prune unused images
  pruneImages: async (runtime: Runtime, all = false) => {
    set({ isLoading: true, error: null });
    try {
      const result = await imageService.pruneImages(runtime, all);
      // Reload images to reflect the change
      await get().loadImages(runtime);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isLoading: false });
      throw error; // Re-throw for UI to handle
    }
  },

  // Set search query
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  // Set filter for tags
  setFilterTags: (filter: 'all' | 'tagged' | 'dangling') => {
    set({ filterTags: filter });
  },

  // Select a single image
  selectImage: (imageId: string) => {
    const selectedImageIds = new Set(get().selectedImageIds);
    selectedImageIds.add(imageId);
    set({ selectedImageIds });
  },

  // Deselect a single image
  deselectImage: (imageId: string) => {
    const selectedImageIds = new Set(get().selectedImageIds);
    selectedImageIds.delete(imageId);
    set({ selectedImageIds });
  },

  // Select all images (typically filtered list)
  selectAllImages: (imageIds: string[]) => {
    set({ selectedImageIds: new Set(imageIds) });
  },

  // Deselect all images
  deselectAllImages: () => {
    set({ selectedImageIds: new Set() });
  },

  // Clear error message
  clearError: () => {
    set({ error: null });
  },
}));
