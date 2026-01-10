import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// Polyfill localStorage for thread pool (jsdom may not provide it in all threads)
if (!globalThis.localStorage?.getItem) {
  const store: Record<string, string> = {}
  const localStorageMock: Storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(key => delete store[key]) },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })
}

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorage.clear()
})

// Mock StorageEvent if it doesn't work with our polyfilled localStorage
const OriginalStorageEvent = globalThis.StorageEvent
class MockStorageEvent extends Event {
  readonly key: string | null
  readonly newValue: string | null
  readonly oldValue: string | null
  readonly storageArea: Storage | null
  readonly url: string

  constructor(type: string, eventInit?: StorageEventInit) {
    super(type, eventInit)
    this.key = eventInit?.key ?? null
    this.newValue = eventInit?.newValue ?? null
    this.oldValue = eventInit?.oldValue ?? null
    this.storageArea = eventInit?.storageArea ?? null
    this.url = eventInit?.url ?? ''
  }
}

// Replace StorageEvent with our mock that doesn't validate storageArea
Object.defineProperty(globalThis, 'StorageEvent', {
  value: MockStorageEvent,
  writable: true,
})

// Mock matchMedia for jsdom (required for ThemeContext)
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  })
}

// Mock URL.createObjectURL and revokeObjectURL for jsdom environment
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-url'
}

if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {}
}

// Polyfill File.text() for jsdom
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => { resolve(reader.result as string); }
      reader.onerror = () => { reject(reader.error); }
      reader.readAsText(this)
    })
  }
}
