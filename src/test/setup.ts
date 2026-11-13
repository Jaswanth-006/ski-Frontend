import '@testing-library/jest-dom/vitest'

// jsdom lacks IntersectionObserver; framer-motion's whileInView/useInView need it.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver
