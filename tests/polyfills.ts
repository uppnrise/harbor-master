// Polyfills that must be loaded before any other modules
// This file should be the first in setupFiles array

// Ensure WeakMap is available globally for webidl-conversions
if (typeof globalThis.WeakMap === 'undefined') {
  (globalThis as typeof globalThis & { WeakMap: typeof WeakMap }).WeakMap = WeakMap;
}

// Ensure Map is available
if (typeof globalThis.Map === 'undefined') {
  (globalThis as typeof globalThis & { Map: typeof Map }).Map = Map;
}

// Ensure Set is available
if (typeof globalThis.Set === 'undefined') {
  (globalThis as typeof globalThis & { Set: typeof Set }).Set = Set;
}

// Mock Tauri API for tests
if (typeof window !== 'undefined') {
  (window as unknown as { __TAURI_INTERNALS__: { invoke: () => Promise<unknown> } }).__TAURI_INTERNALS__ = {
    invoke: () => Promise.resolve(),
  };
}

// Polyfill HTMLDialogElement for jsdom
if (typeof window !== 'undefined' && typeof HTMLDialogElement === 'undefined') {
  (window as unknown as { HTMLDialogElement: typeof Element }).HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
    open = false;
    returnValue = '';
    
    showModal() {
      this.open = true;
    }
    
    show() {
      this.open = true;
    }
    
    close(returnValue = '') {
      this.open = false;
      this.returnValue = returnValue;
    }
  } as typeof HTMLDialogElement;
}

