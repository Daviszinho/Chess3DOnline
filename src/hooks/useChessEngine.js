import { useCallback, useRef, useState } from 'react'

/**
 * Handles all communication with the remote chess engine API.
 *
 * @param {string} apiBase  - Base URL of the engine API (no trailing slash).
 * @param {object} getT     - Function that returns the current translation object.
 *
 * Returns:
 *   isThinking       – boolean, true while a request is in flight
 *   engineError      – string, last engine error message ('' when none)
 *   clearEngineError – clears engineError
 *   requestMove      – async (fen, engine, level) => { from, to, san, promotion } | null
 *   cancelPending    – aborts any in-flight request and resets thinking state
 */
export function useChessEngine(apiBase, getT) {
  const [isThinking, setIsThinking] = useState(false)
  const [engineError, setEngineError] = useState('')

  // Incremented on every call; stale responses are discarded.
  const requestIdRef = useRef(0)
  // AbortController for the in-flight fetch.
  const abortControllerRef = useRef(null)

  const clearEngineError = useCallback(() => setEngineError(''), [])

  /** Cancel any pending request and reset thinking state. */
  const cancelPending = useCallback(() => {
    requestIdRef.current += 1
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsThinking(false)
  }, [])

  /**
   * Ask the engine for the best move in the given position.
   * Returns the parsed move object, or null if the request was superseded /
   * aborted before the response arrived.
   * Throws on network / API errors so the caller can surface them.
   */
  const requestMove = useCallback(
    async (fen, engine, level) => {
      // Cancel any previous in-flight request.
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller
      const requestId = ++requestIdRef.current

      setIsThinking(true)
      setEngineError('')

      try {
        const res = await fetch(`${apiBase}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen, engine, level }),
          signal: controller.signal,
        })

        // Request was superseded while in flight — discard silently.
        if (requestId !== requestIdRef.current) return null

        const data = await res.json()

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `HTTP ${res.status}`)
        }

        const t = getT()
        const from = data?.response?.from
        const to = data?.response?.to
        const promotion = data?.response?.promotion ?? undefined
        const san = data?.response?.san ?? undefined
        const uci = data?.response?.move

        if (from && to) {
          return { from, to, san, promotion }
        }

        // Fallback: parse UCI string (e.g. "e2e4" or "e7e8q")
        if (uci && uci.length >= 4) {
          return {
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            san,
            promotion: uci.length >= 5 ? uci.slice(4, 5).toLowerCase() : undefined,
          }
        }

        throw new Error(t.invalidEngineMove)
      } catch (err) {
        // Aborted requests are not errors — they happen when a newer move was requested.
        if (err.name === 'AbortError') return null

        // Request superseded between fetch and json parse.
        if (requestId !== requestIdRef.current) return null

        const t = getT()
        setEngineError(t.engineRequestFailed(err.message))
        throw err
      } finally {
        if (requestId === requestIdRef.current) {
          setIsThinking(false)
          abortControllerRef.current = null
        }
      }
    },
    [apiBase, getT],
  )

  return { isThinking, engineError, clearEngineError, requestMove, cancelPending }
}
