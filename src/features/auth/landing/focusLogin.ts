export function focusLogin() {
  document.getElementById('login')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => document.getElementById('phone')?.focus({ preventScroll: true }), 350)
}
