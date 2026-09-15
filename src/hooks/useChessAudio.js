import { useRef } from 'react'

/**
 * Provides a single `playMoveSound()` function that synthesizes a short
 * percussive click using the Web Audio API.  The AudioContext is created
 * lazily on the first call and reused afterward.
 */
export function useChessAudio() {
  const audioContextRef = useRef(null)

  function playMoveSound() {
    if (typeof window === 'undefined') return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const duration = 0.075
      const now = ctx.currentTime
      const frameCount = Math.floor(ctx.sampleRate * duration)
      const noiseBuffer = ctx.createBuffer(1, frameCount, ctx.sampleRate)
      const channelData = noiseBuffer.getChannelData(0)

      for (let i = 0; i < frameCount; i++) {
        const decay = 1 - i / frameCount
        channelData[i] = (Math.random() * 2 - 1) * decay * decay
      }

      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1100, now)
      filter.Q.setValueAtTime(0.9, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + duration)
    } catch {
      // Ignore audio errors (unsupported browser policy or blocked context).
    }
  }

  function dispose() {
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  return { playMoveSound, dispose }
}
