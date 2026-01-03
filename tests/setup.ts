import '@testing-library/jest-dom/vitest'

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
