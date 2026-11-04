export const themeStorageKey = 'nash-web-color-scheme'

// Run before the application loads so dark-mode visitors do not see a light flash.
export const themeInitScript = `
(() => {
  let preference = 'auto'
  try {
    const saved = localStorage.getItem('${themeStorageKey}')
    if (saved === 'light' || saved === 'dark' || saved === 'auto')
      preference = saved
    else if (saved !== null)
      localStorage.removeItem('${themeStorageKey}')
  } catch {
    // Browser privacy settings can disable local storage.
  }
  const dark = preference === 'dark'
    || (preference === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
})()
`
