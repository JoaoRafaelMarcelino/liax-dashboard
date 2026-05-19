export function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data } = JSON.parse(raw)
    return data
  } catch { return null }
}

export function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data })) } catch {}
}
