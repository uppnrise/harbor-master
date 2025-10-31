import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Ensure WeakMap is available for webidl-conversions
if (typeof globalThis.WeakMap === 'undefined') {
  (globalThis as any).WeakMap = WeakMap;
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
