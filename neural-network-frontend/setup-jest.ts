import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Global mocks for browser APIs not available in jsdom
Object.defineProperty(window, 'CSS', { value: null });

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance']
  })
});

// Mock sessionStorage for AppComponent navigation flag
const sessionStorageMock = (() => {
  let store: Record<string, string> = {
    'app_navigation_active': 'true' // Prevent navigation on init
  };
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = { 'app_navigation_active': 'true' }; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Suppress specific console warnings during tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Filter out Angular's router warnings during tests
  if (args[0]?.includes?.('NG0912') || args[0]?.includes?.('navigation')) {
    return;
  }
  originalWarn.apply(console, args);
};
