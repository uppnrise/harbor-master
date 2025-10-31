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
