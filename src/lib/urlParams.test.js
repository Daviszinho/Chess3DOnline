import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readUrlParams, writeUrlParams } from './urlParams'

describe('readUrlParams', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('returns null values when URL has no params', () => {
    const result = readUrlParams()
    expect(result.fen).toBeNull()
    expect(result.engine).toBeNull()
    expect(result.level).toBeNull()
    expect(result.language).toBeNull()
    expect(result.boardTheme).toBeNull()
    expect(result.playerColor).toBeNull()
  })

  it('reads fen param', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    window.history.replaceState({}, '', `/?fen=${encodeURIComponent(fen)}`)
    expect(readUrlParams().fen).toBe(fen)
  })

  it('reads legacy position param as fen', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    window.history.replaceState({}, '', `/?position=${encodeURIComponent(fen)}`)
    expect(readUrlParams().fen).toBe(fen)
  })

  it('reads engine param', () => {
    window.history.replaceState({}, '', '/?engine=gnuchess')
    expect(readUrlParams().engine).toBe('gnuchess')
  })

  it('reads valid level param', () => {
    window.history.replaceState({}, '', '/?level=12')
    expect(readUrlParams().level).toBe(12)
  })

  it('returns null for out-of-range level param', () => {
    window.history.replaceState({}, '', '/?level=99')
    expect(readUrlParams().level).toBeNull()
  })

  it('reads playerColor w and b', () => {
    window.history.replaceState({}, '', '/?color=b')
    expect(readUrlParams().playerColor).toBe('b')
    window.history.replaceState({}, '', '/?color=w')
    expect(readUrlParams().playerColor).toBe('w')
  })

  it('returns null for unknown playerColor', () => {
    window.history.replaceState({}, '', '/?color=x')
    expect(readUrlParams().playerColor).toBeNull()
  })
})

describe('writeUrlParams', () => {
  let replaceStateSpy

  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    replaceStateSpy = vi.spyOn(window.history, 'replaceState')
  })

  afterEach(() => {
    replaceStateSpy.mockRestore()
    window.history.replaceState({}, '', '/')
  })

  it('sets the fen param in the URL', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    writeUrlParams({ fen })
    expect(new URLSearchParams(window.location.search).get('fen')).toBe(fen)
  })

  it('sets engine and level params', () => {
    writeUrlParams({ engine: 'fruit', level: 15 })
    const p = new URLSearchParams(window.location.search)
    expect(p.get('engine')).toBe('fruit')
    expect(p.get('level')).toBe('15')
  })

  it('removes a param when value is null', () => {
    writeUrlParams({ engine: 'fruit' })
    writeUrlParams({ engine: null })
    expect(new URLSearchParams(window.location.search).get('engine')).toBeNull()
  })

  it('removes legacy position param', () => {
    window.history.replaceState({}, '', '/?position=foo&fen=bar')
    writeUrlParams({})
    expect(new URLSearchParams(window.location.search).get('position')).toBeNull()
  })

  it('calls replaceState without triggering navigation', () => {
    writeUrlParams({ level: 10 })
    expect(replaceStateSpy).toHaveBeenCalledTimes(1)
  })
})
