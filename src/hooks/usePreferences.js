import { useCallback, useState } from 'react'

const STORAGE_KEY = 'chess3d_prefs'

const DEFAULTS = {
  engine: 'stockfish',
  level: 5,
  language: 'en',
  boardTheme: 'brownCream',
  playerColor: 'w',
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function writeStorage(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore write errors (private browsing, storage quota, etc.).
  }
}

/**
 * Persists user preferences (engine, level, language, boardTheme, playerColor)
 * to localStorage.  Falls back to defaults silently on any storage error.
 *
 * @param {object} [urlOverrides]  - Values read from the URL at startup that
 *   take precedence over localStorage.  Only non-null keys are applied.
 *
 * Returns individual state values plus setters that both update React state
 * and persist to localStorage in one call.
 */
export function usePreferences(urlOverrides = {}) {
  const [prefs, setPrefs] = useState(() => {
    const stored = readStorage()

    // Detect browser language and override only if not already stored.
    if (!localStorage.getItem(STORAGE_KEY)) {
      const browserLang = (navigator?.language || 'en').slice(0, 2)
      const supported = ['en', 'es', 'pt', 'it']
      if (supported.includes(browserLang)) {
        stored.language = browserLang
      }
    }

    // URL params take the highest precedence — applied once at initialisation.
    const overrides = {}
    for (const [key, val] of Object.entries(urlOverrides)) {
      if (val !== null && val !== undefined) overrides[key] = val
    }

    return { ...stored, ...overrides }
  })

  const update = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      writeStorage(next)
      return next
    })
  }, [])

  return {
    engine: prefs.engine,
    level: prefs.level,
    language: prefs.language,
    boardTheme: prefs.boardTheme,
    playerColor: prefs.playerColor,
    setEngine: (v) => update('engine', v),
    setLevel: (v) => update('level', v),
    setLanguage: (v) => update('language', v),
    setBoardTheme: (v) => update('boardTheme', v),
    setPlayerColor: (v) => update('playerColor', v),
  }
}
