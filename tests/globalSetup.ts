// Global setup that runs before any test files are loaded
// This ensures WeakMap is available before webidl-conversions tries to use it

export default function globalSetup() {
  // Ensure WeakMap exists in the global scope
  if (!globalThis.WeakMap) {
    (globalThis as typeof globalThis & { WeakMap: typeof WeakMap }).WeakMap = WeakMap;
  }
}
