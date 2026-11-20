import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureChessboard3Loaded } from './lib/loadChessboard3'
import { readUrlParams, writeUrlParams } from './lib/urlParams'
import { useChessAudio } from './hooks/useChessAudio'
import { useChessEngine } from './hooks/useChessEngine'
import { useChessGame } from './hooks/useChessGame'
import { usePreferences } from './hooks/usePreferences'
import { useMovesScroll } from './hooks/useMovesScroll'
import { PromotionModal } from './components/PromotionModal'

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (
  import.meta.env.VITE_CHESS_API_BASE
  || (import.meta.env.DEV
    ? '/api'
    : 'https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api')
).replace(/\/$/, '')

const BOARD_CONTAINER_ID = 'chessboard3-root'

const FALLBACK_ENGINES = ['stockfish', 'gnuchess', 'fruit', 'toga2', 'phalanx', 'crafty', 'glaurung']

const BOARD_THEMES = {
  brownCream: { light: 0xf5deb3, dark: 0x8b5a2b },
  whiteGray:  { light: 0xf8fafc, dark: 0x6b7280 },
  skyBlue:    { light: 0x93c5fd, dark: 0x1d4ed8 },
  yellowGreen:{ light: 0xfef08a, dark: 0x65a30d },
}

// ─── Translations ─────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  en: {
    title: 'Chess 3D Online',
    health: 'health',
    loadingBoard: 'Loading board...',
    engine: 'Engine',
    level: 'Level',
    levelBeginner: 'Beginner',
    levelCasual: 'Casual',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    levelMax: 'Maximum strength',
    language: 'Language',
    playAs: 'Play as',
    boardTheme: 'Board theme',
    themeBrownCream: 'Brown / Cream',
    themeWhiteGray: 'White / Gray',
    themeSkyBlue: 'Sky / Blue',
    themeYellowGreen: 'Light Yellow / Green',
    white: 'White',
    black: 'Black',
    newGame: 'New game',
    undo: 'Undo',
    flip: 'Flip',
    copyPgn: 'Copy PGN',
    downloadPgn: 'Download PGN',
    copyPng: 'Copy PNG',
    downloadPng: 'Download PNG',
    engineMoveNow: 'Engine move now',
    statusLabel: 'Status',
    fen: 'FEN',
    invalidFen: 'Invalid FEN',
    moves: 'Moves',
    turn: 'Turn',
    check: 'check',
    checkmate: (winner) => `Checkmate. ${winner} wins.`,
    draw: 'Draw.',
    gameOver: 'Game over.',
    toMove: (side, check) => `${side} to move${check ? ` (${check})` : ''}`,
    thinking: (engine) => `${engine} is thinking...`,
    moveFailed: 'Move failed. Try again.',
    copiedPgn: 'PGN copied to clipboard.',
    downloadedPgnText: 'Clipboard unavailable. PGN downloaded.',
    copyPgnFailed: (msg) => `Could not copy PGN: ${msg}`,
    copiedPng: 'Board PNG copied to clipboard.',
    engineUnavailable: (msg) => `Engines endpoint unavailable (${msg}). Using fallback list.`,
    failedInit: 'Failed to initialize chessboard3',
    clipboardSecure: 'Clipboard PNG is only available in secure context (HTTPS or localhost).',
    canvasNotFound: 'Board canvas not found.',
    pngFailed: 'Could not generate PNG from board.',
    copyFailed: (msg) => `Could not copy PNG: ${msg}`,
    downloadedPng: 'Clipboard not available. PNG downloaded.',
    verifyClipboardUnavailable: 'Clipboard verification unavailable. PNG downloaded.',
    taintedCanvas: 'Canvas cannot be exported due to external assets (CORS).',
    engineRequestFailed: (msg) => `Engine request failed: ${msg}`,
    invalidEngineMove: 'Engine response does not contain a move',
    promotionPrompt: 'Promotion piece? (q=Queen, r=Rook, b=Bishop, n=Knight)',
    promotionTitle: 'Choose promotion piece',
    promotionCancel: 'Cancel',
    invalidPromotion: 'Invalid promotion piece. Use q, r, b, or n.',
    sharePosition: 'Share',
    shareCopied: 'Link copied!',
    newGameConfirm: 'Start a new game? Current game will be lost.',
    newGameConfirmYes: 'New game',
    newGameConfirmNo: 'Keep playing',
  },
  es: {
    title: 'Chess 3D Online',
    health: 'salud',
    loadingBoard: 'Cargando tablero...',
    engine: 'Motor',
    level: 'Nivel',
    levelBeginner: 'Principiante',
    levelCasual: 'Casual',
    levelIntermediate: 'Intermedio',
    levelAdvanced: 'Avanzado',
    levelMax: 'Fuerza máxima',
    language: 'Idioma',
    playAs: 'Jugar como',
    boardTheme: 'Tema del tablero',
    themeBrownCream: 'Cafe / Crema',
    themeWhiteGray: 'Blanco / Gris',
    themeSkyBlue: 'Celeste / Azul',
    themeYellowGreen: 'Amarillo claro / Verde',
    white: 'Blancas',
    black: 'Negras',
    newGame: 'Nueva partida',
    undo: 'Deshacer',
    flip: 'Girar',
    copyPgn: 'Copiar PGN',
    downloadPgn: 'Descargar PGN',
    copyPng: 'Copiar PNG',
    downloadPng: 'Descargar PNG',
    engineMoveNow: 'Jugada del motor',
    statusLabel: 'Estado',
    fen: 'FEN',
    invalidFen: 'FEN invalido',
    moves: 'Jugadas',
    turn: 'Turno',
    check: 'jaque',
    checkmate: (winner) => `Jaque mate. Ganan ${winner}.`,
    draw: 'Tablas.',
    gameOver: 'Partida terminada.',
    toMove: (side, check) => `Turno de ${side}${check ? ` (${check})` : ''}`,
    thinking: (engine) => `${engine} está pensando...`,
    moveFailed: 'Falló la jugada. Intenta de nuevo.',
    copiedPgn: 'PGN copiado al portapapeles.',
    downloadedPgnText: 'Portapapeles no disponible. PGN descargado.',
    copyPgnFailed: (msg) => `No se pudo copiar PGN: ${msg}`,
    copiedPng: 'PNG del tablero copiado al portapapeles.',
    engineUnavailable: (msg) => `Endpoint de motores no disponible (${msg}). Usando lista local.`,
    failedInit: 'No se pudo inicializar chessboard3',
    clipboardSecure: 'Copiar PNG requiere contexto seguro (HTTPS o localhost).',
    canvasNotFound: 'No se encontró el canvas del tablero.',
    pngFailed: 'No se pudo generar el PNG del tablero.',
    copyFailed: (msg) => `No se pudo copiar PNG: ${msg}`,
    downloadedPng: 'Portapapeles no disponible. PNG descargado.',
    verifyClipboardUnavailable: 'No se puede verificar portapapeles. PNG descargado.',
    taintedCanvas: 'No se puede exportar el canvas por recursos externos (CORS).',
    engineRequestFailed: (msg) => `Falló la petición al motor: ${msg}`,
    invalidEngineMove: 'La respuesta del motor no contiene jugada',
    promotionPrompt: 'Pieza de promocion? (q=dama, r=torre, b=alfil, n=caballo)',
    promotionTitle: 'Elige pieza de promocion',
    promotionCancel: 'Cancelar',
    invalidPromotion: 'Promocion invalida. Usa q, r, b o n.',
    sharePosition: 'Compartir',
    shareCopied: '¡Enlace copiado!',
    newGameConfirm: '¿Nueva partida? Se perderá la partida actual.',
    newGameConfirmYes: 'Nueva partida',
    newGameConfirmNo: 'Seguir jugando',
  },
  pt: {
    title: 'Chess 3D Online',
    health: 'saude',
    loadingBoard: 'Carregando tabuleiro...',
    engine: 'Motor',
    level: 'Nivel',
    levelBeginner: 'Iniciante',
    levelCasual: 'Casual',
    levelIntermediate: 'Intermediário',
    levelAdvanced: 'Avançado',
    levelMax: 'Força máxima',
    language: 'Idioma',
    playAs: 'Jogar como',
    boardTheme: 'Tema do tabuleiro',
    themeBrownCream: 'Marrom / Creme',
    themeWhiteGray: 'Branco / Cinza',
    themeSkyBlue: 'Azul claro / Azul',
    themeYellowGreen: 'Amarelo claro / Verde',
    white: 'Brancas',
    black: 'Pretas',
    newGame: 'Novo jogo',
    undo: 'Desfazer',
    flip: 'Girar',
    copyPgn: 'Copiar PGN',
    downloadPgn: 'Baixar PGN',
    copyPng: 'Copiar PNG',
    downloadPng: 'Baixar PNG',
    engineMoveNow: 'Lance do motor',
    statusLabel: 'Status',
    fen: 'FEN',
    invalidFen: 'FEN invalido',
    moves: 'Lances',
    turn: 'Turno',
    check: 'xeque',
    checkmate: (winner) => `Xeque-mate. ${winner} vencem.`,
    draw: 'Empate.',
    gameOver: 'Jogo encerrado.',
    toMove: (side, check) => `${side} jogam${check ? ` (${check})` : ''}`,
    thinking: (engine) => `${engine} está pensando...`,
    moveFailed: 'Falha no lance. Tente novamente.',
    copiedPgn: 'PGN copiado para a area de transferencia.',
    downloadedPgnText: 'Area de transferencia indisponivel. PGN baixado.',
    copyPgnFailed: (msg) => `Nao foi possivel copiar PGN: ${msg}`,
    copiedPng: 'PNG do tabuleiro copiado para a area de transferencia.',
    engineUnavailable: (msg) => `Endpoint de motores indisponivel (${msg}). Usando lista local.`,
    failedInit: 'Falha ao inicializar chessboard3',
    clipboardSecure: 'Copiar PNG requer contexto seguro (HTTPS ou localhost).',
    canvasNotFound: 'Canvas do tabuleiro nao encontrado.',
    pngFailed: 'Nao foi possivel gerar PNG do tabuleiro.',
    copyFailed: (msg) => `Nao foi possivel copiar PNG: ${msg}`,
    downloadedPng: 'Area de transferencia indisponivel. PNG baixado.',
    verifyClipboardUnavailable: 'Nao foi possivel verificar a area de transferencia. PNG baixado.',
    taintedCanvas: 'Nao foi possivel exportar o canvas por recursos externos (CORS).',
    engineRequestFailed: (msg) => `Falha na requisicao do motor: ${msg}`,
    invalidEngineMove: 'Resposta do motor sem jogada',
    promotionPrompt: 'Peca de promocao? (q=dama, r=torre, b=bispo, n=cavalo)',
    promotionTitle: 'Escolha a peca de promocao',
    promotionCancel: 'Cancelar',
    invalidPromotion: 'Promocao invalida. Use q, r, b ou n.',
    sharePosition: 'Compartilhar',
    shareCopied: 'Link copiado!',
    newGameConfirm: 'Novo jogo? O jogo atual sera perdido.',
    newGameConfirmYes: 'Novo jogo',
    newGameConfirmNo: 'Continuar',
  },
  it: {
    title: 'Chess 3D Online',
    health: 'salute',
    loadingBoard: 'Caricamento scacchiera...',
    engine: 'Motore',
    level: 'Livello',
    levelBeginner: 'Principiante',
    levelCasual: 'Casuale',
    levelIntermediate: 'Intermedio',
    levelAdvanced: 'Avanzato',
    levelMax: 'Forza massima',
    language: 'Lingua',
    playAs: 'Gioca come',
    boardTheme: 'Tema scacchiera',
    themeBrownCream: 'Marrone / Crema',
    themeWhiteGray: 'Bianco / Grigio',
    themeSkyBlue: 'Azzurro / Blu',
    themeYellowGreen: 'Giallo chiaro / Verde',
    white: 'Bianco',
    black: 'Nero',
    newGame: 'Nuova partita',
    undo: 'Annulla',
    flip: 'Ruota',
    copyPgn: 'Copia PGN',
    downloadPgn: 'Scarica PGN',
    copyPng: 'Copia PNG',
    downloadPng: 'Scarica PNG',
    engineMoveNow: 'Mossa motore',
    statusLabel: 'Stato',
    fen: 'FEN',
    invalidFen: 'FEN non valido',
    moves: 'Mosse',
    turn: 'Turno',
    check: 'scacco',
    checkmate: (winner) => `Scacco matto. Vince ${winner}.`,
    draw: 'Patta.',
    gameOver: 'Partita terminata.',
    toMove: (side, check) => `Tocca a ${side}${check ? ` (${check})` : ''}`,
    thinking: (engine) => `${engine} sta pensando...`,
    moveFailed: 'Mossa non riuscita. Riprova.',
    copiedPgn: 'PGN copiato negli appunti.',
    downloadedPgnText: 'Appunti non disponibili. PGN scaricato.',
    copyPgnFailed: (msg) => `Impossibile copiare PGN: ${msg}`,
    copiedPng: 'PNG della scacchiera copiato negli appunti.',
    engineUnavailable: (msg) => `Endpoint motori non disponibile (${msg}). Uso lista locale.`,
    failedInit: 'Impossibile inizializzare chessboard3',
    clipboardSecure: 'Copia PNG disponibile solo in contesto sicuro (HTTPS o localhost).',
    canvasNotFound: 'Canvas della scacchiera non trovato.',
    pngFailed: 'Impossibile generare PNG della scacchiera.',
    copyFailed: (msg) => `Impossibile copiare PNG: ${msg}`,
    downloadedPng: 'Appunti non disponibili. PNG scaricato.',
    verifyClipboardUnavailable: 'Impossibile verificare appunti. PNG scaricato.',
    taintedCanvas: 'Impossibile esportare il canvas per risorse esterne (CORS).',
    engineRequestFailed: (msg) => `Richiesta al motore fallita: ${msg}`,
    invalidEngineMove: 'Risposta del motore senza mossa',
    promotionPrompt: 'Pezzo di promozione? (q=donna, r=torre, b=alfiere, n=cavallo)',
    promotionTitle: 'Scegli il pezzo di promozione',
    promotionCancel: 'Annulla',
    invalidPromotion: 'Promozione non valida. Usa q, r, b o n.',
    sharePosition: 'Condividi',
    shareCopied: 'Link copiato!',
    newGameConfirm: 'Nuova partita? La partita attuale andrà persa.',
    newGameConfirmYes: 'Nuova partita',
    newGameConfirmNo: 'Continua',
  },
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function isDarkSquare(square) {
  const file = square.charCodeAt(0) - 97 // a=0…h=7
  const rank = Number(square[1])          // 1…8
  return (file + rank) % 2 === 1
}

function getLevelProfile(level) {
  if (level <= 4)  return 'levelBeginner'
  if (level <= 9)  return 'levelCasual'
  if (level <= 14) return 'levelIntermediate'
  if (level <= 19) return 'levelAdvanced'
  return 'levelMax'
}

/**
 * Approximate Elo for the given level (1–20), linearly mapped onto 800–2850.
 * Useful for engines that support UCI_Elo (Stockfish, Rubi, Berserk, Caissa, LC0).
 */
function getLevelElo(level) {
  if (level >= 20) return '~2850'
  return `~${Math.round(800 + (level - 1) * ((2850 - 800) / 19))}`
}

function downloadTextFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  // ── Preferences (localStorage + URL seed) ──────────────────────────────────
  // Build the URL seed once at component creation time (before first render).
  const urlSeed = useRef(null)
  if (urlSeed.current === null) {
    const seed = readUrlParams()
    // If the URL has a FEN but no explicit color param, infer the player color
    // from the side to move in the FEN (preserving legacy share-link behaviour).
    if (seed.fen && !seed.playerColor) {
      const turn = seed.fen.split(' ')[1] // 'w' or 'b'
      if (turn === 'b' || turn === 'w') seed.playerColor = turn
    }
    urlSeed.current = seed
  }
  const {
    engine: selectedEngine, setEngine: setSelectedEngine,
    level,                  setLevel,
    language,               setLanguage,
    boardTheme,             setBoardTheme,
    playerColor,            setPlayerColor,
  } = usePreferences(urlSeed.current)

  // ── Game state ──────────────────────────────────────────────────────────────
  const { gameRef, fen, moves, applyMove, applyEngineMove, undoMoves, resetGame, loadFen, moveRows } =
    useChessGame(urlSeed.current.fen)

  // ── Engine ──────────────────────────────────────────────────────────────────
  // Stable ref to current translation, used inside the engine hook callback.
  const tRef = useRef(TRANSLATIONS[language] || TRANSLATIONS.en)
  const getT = useCallback(() => tRef.current, [])
  const { isThinking, engineError, clearEngineError, requestMove, cancelPending } =
    useChessEngine(API_BASE, getT)

  // ── Audio ───────────────────────────────────────────────────────────────────
  const { playMoveSound, dispose: disposeAudio } = useChessAudio()

  // ── Board widget ────────────────────────────────────────────────────────────
  const boardRef = useRef(null)
  const boardInitRef = useRef(false)
  const boardOrientationRef = useRef('white')
  const boardResizeObserverRef = useRef(null)
  const thinkingRef = useRef(false)  // Sync mirror of isThinking for use in callbacks.

  // ── Misc UI state ───────────────────────────────────────────────────────────
  const [ready, setReady] = useState(false)
  const [engines, setEngines] = useState([])
  const [status, setStatus] = useState(TRANSLATIONS.en.loadingBoard)
  const [error, setError] = useState('')
  const [fenInput, setFenInput] = useState(() => gameRef.current.fen())
  const [fenError, setFenError] = useState('')
  const [health, setHealth] = useState('unknown')

  // ── Last move highlight ─────────────────────────────────────────────────────
  // Stores { from, to } of the last move so onRender can tint those squares.
  const lastMoveRef = useRef(null)
  const [lastMove, setLastMove] = useState(null) // reactive copy for the moves table

  // ── New-game confirmation dialog ────────────────────────────────────────────
  const [confirmNewGame, setConfirmNewGame] = useState(false)

  // ── Promotion modal state ───────────────────────────────────────────────────
  const [promotionPending, setPromotionPending] = useState(null) // { from, to } | null
  const promotionResolveRef = useRef(null) // (piece | null) => void

  // ── Moves table scroll ──────────────────────────────────────────────────────
  const movesScrollRef = useMovesScroll(moves.length)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const t = TRANSLATIONS[language] || TRANSLATIONS.en

  // Keep tRef in sync so the engine hook callback always has current translations.
  useEffect(() => {
    tRef.current = TRANSLATIONS[language] || TRANSLATIONS.en
  }, [language])

  // Keep thinkingRef in sync with engine hook state.
  useEffect(() => {
    thinkingRef.current = isThinking
  }, [isThinking])

  // Sync engineError into local error state.
  useEffect(() => {
    if (engineError) {
      setError(engineError)
      setStatus(t.moveFailed)
    }
  }, [engineError])

  // Sync board theme to the 3D widget.
  const boardThemeRef = useRef(boardTheme)
  useEffect(() => {
    boardThemeRef.current = boardTheme
    if (boardRef.current) boardRef.current.position(gameRef.current.fen(), false)
    writeUrlParams({ boardTheme })
  }, [boardTheme])

  // Persist language to URL.
  useEffect(() => {
    writeUrlParams({ language })
    refreshBoardStatus()
  }, [language])

  // Persist engine + level to URL whenever they change.
  useEffect(() => { writeUrlParams({ engine: selectedEngine }) }, [selectedEngine])
  useEffect(() => { writeUrlParams({ level }) }, [level])

  // ── Debounced FEN input ─────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      const next = fenInput.trim()
      if (!next || next === gameRef.current.fen()) { setFenError(''); return }
      const ok = loadFen(next)
      if (!ok) { setFenError(t.invalidFen); return }
      cancelPending()
      setError('')
      setFenError('')
      if (boardRef.current) boardRef.current.position(gameRef.current.fen(), false)
      writeUrlParams({ fen: gameRef.current.fen() })
      refreshBoardStatus()
    }, 350)
    return () => clearTimeout(id)
  }, [fenInput])

  // Keep fenInput in sync when game state changes from outside (engine move, undo, etc.).
  useEffect(() => {
    setFenInput(fen)
    writeUrlParams({ fen })
  }, [fen])

  // ── Board initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        await ensureChessboard3Loaded()
        if (!isMounted || boardInitRef.current) return

        boardRef.current = new window.ChessBoard3(BOARD_CONTAINER_ID, {
          position: 'start',
          draggable: true,
          dropOffBoard: 'snapback',
          showNotation: true,
          notationColor: 0xffffff,
          backgroundColor: 0x0b0b0b,
          moveSpeed: 150,
          snapbackSpeed: 90,
          snapSpeed: 70,
          pieceSet: 'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/assets/chesspieces/classic/{piece}.json',
          fontData: 'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/assets/fonts/helvetiker_regular.typeface.json',
          onDrop: (source, target, _piece, _newPos, oldPos) => {
            if (thinkingRef.current) { forceRollback(oldPos); return 'snapback' }
            const result = handlePlayerDrop(source, target)
            if (result === 'snapback') forceRollback(oldPos)
            return result
          },
          onRender: (scene, squareMeshIds) => {
            const theme = BOARD_THEMES[boardThemeRef.current] || BOARD_THEMES.brownCream
            const lm = lastMoveRef.current
            for (const [square, meshId] of Object.entries(squareMeshIds)) {
              const mesh = scene.getObjectById(meshId)
              if (!mesh?.material?.color) continue
              const isHighlighted = lm && (square === lm.from || square === lm.to)
              if (isHighlighted) {
                // Blend theme color with a blue tint for the last-move squares.
                const base = isDarkSquare(square) ? theme.dark : theme.light
                const r = ((base >> 16) & 0xff) * 0.55 + 0x3b * 0.45
                const g = ((base >>  8) & 0xff) * 0.55 + 0x82 * 0.45
                const b = ( base        & 0xff) * 0.55 + 0xf6 * 0.45
                mesh.material.color.setRGB(r / 255, g / 255, b / 255)
              } else {
                mesh.material.color.setHex(isDarkSquare(square) ? theme.dark : theme.light)
              }
            }
          },
          onMoveEnd: refreshBoardStatus,
        })

        boardInitRef.current = true
        setReady(true)

        if (typeof ResizeObserver !== 'undefined') {
          const host = document.getElementById(BOARD_CONTAINER_ID)
          boardResizeObserverRef.current = new ResizeObserver(() => {
            requestAnimationFrame(() => boardRef.current?.resize?.())
          })
          if (host) boardResizeObserverRef.current.observe(host)
        }

        const initialFen = urlSeed.current.fen
        if (initialFen) {
          boardRef.current.position(gameRef.current.fen(), false)
          applyOrientation(urlSeed.current.playerColor || gameRef.current.turn())
          refreshBoardStatus()
          // If it's the engine's turn on load, let it move.
          if (gameRef.current.turn() !== (urlSeed.current.playerColor || 'w')) {
            setTimeout(() => doEngineMove(), 0)
          }
        } else {
          startNewGame(playerColor, false)
        }
      } catch (err) {
        setError(err.message || t.failedInit)
      }
    }

    initialize()
    fetchEngines()
    fetchHealth()

    return () => {
      isMounted = false
      boardResizeObserverRef.current?.disconnect()
      boardResizeObserverRef.current = null
      boardRef.current?.destroy?.()
      boardRef.current = null
      boardInitRef.current = false
      disposeAudio()
    }
  }, [])

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function fetchHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`)
      setHealth(res.ok ? 'ok' : 'degraded')
    } catch {
      setHealth('offline')
    }
  }

  async function fetchEngines() {
    try {
      const res = await fetch(`${API_BASE}/engines`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const detail = body?.error || body?.message || ''
        throw new Error(detail ? `HTTP ${res.status}: ${detail}` : `HTTP ${res.status}`)
      }
      const data = await res.json()
      setEngines(data.engines || [])
      if (data.default) setSelectedEngine(data.default)
    } catch (err) {
      setEngines(FALLBACK_ENGINES.map((name) => ({ name, healthy: true })))
      setSelectedEngine('stockfish')
      setError(t.engineUnavailable(err.message))
    }
  }

  // ── Board helpers ───────────────────────────────────────────────────────────

  function refreshBoardStatus() {
    const game = gameRef.current
    const tt = tRef.current
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? tt.black : tt.white
        setStatus(tt.checkmate(winner)); return
      }
      if (game.isDraw()) { setStatus(tt.draw); return }
      setStatus(tt.gameOver); return
    }
    const side = game.turn() === 'w' ? tt.white : tt.black
    setStatus(tt.toMove(side, game.isCheck() ? tt.check : ''))
  }

  function applyOrientation(color) {
    const board = boardRef.current
    if (!board) return
    const desired = color === 'w' ? 'white' : 'black'
    if (typeof board.orientation === 'function') {
      try {
        board.orientation(desired)
        const current = board.orientation()
        if (current === 'white' || current === 'black') {
          boardOrientationRef.current = current
          if (current === desired) return
        }
      } catch { /* Fallback to flip below. */ }
    }
    if (desired !== boardOrientationRef.current && typeof board.flip === 'function') {
      board.flip()
      boardOrientationRef.current = desired
    }
  }

  function forceRollback(oldPos) {
    if (!boardRef.current || !oldPos) return
    setTimeout(() => { boardRef.current?.position(oldPos, false) }, 0)
  }

  // ── Promotion modal (async) ─────────────────────────────────────────────────

  function isPromotionMove(from, to) {
    const piece = gameRef.current.get(from)
    if (!piece || piece.type !== 'p') return false
    return (piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1'))
  }

  /**
   * Shows the promotion modal and returns a promise that resolves with the
   * chosen piece ('q'|'r'|'b'|'n') or null if the player cancels.
   */
  function pickPromotionPiece(from, to) {
    return new Promise((resolve) => {
      promotionResolveRef.current = resolve
      setPromotionPending({ from, to })
    })
  }

  function handlePromotionChoose(piece) {
    setPromotionPending(null)
    promotionResolveRef.current?.(piece)
    promotionResolveRef.current = null
  }

  function handlePromotionCancel() {
    setPromotionPending(null)
    promotionResolveRef.current?.(null)
    promotionResolveRef.current = null
  }

  // ── Game actions ────────────────────────────────────────────────────────────

  function recordLastMove(from, to) {
    lastMoveRef.current = { from, to }
    setLastMove({ from, to })
  }

  function clearLastMove() {
    lastMoveRef.current = null
    setLastMove(null)
  }

  function startNewGame(color = playerColor, syncUrl = true) {
    setConfirmNewGame(false)
    setPlayerColor(color)
    cancelPending()
    resetGame()
    clearLastMove()
    setError('')
    clearEngineError()

    if (boardRef.current) {
      boardRef.current.position('start', false)
      applyOrientation(color)
    }

    if (syncUrl) writeUrlParams({ fen: gameRef.current.fen(), playerColor: color })
    refreshBoardStatus()

    if (color === 'b') setTimeout(() => doEngineMove(color), 0)
  }

  /**
   * Called by the board's onDrop callback.  Returns undefined (accept) or
   * 'snapback' (reject).  Async moves (promotion) are handled via the modal.
   */
  function handlePlayerDrop(source, target) {
    if (target === 'offboard') return 'snapback'
    const game = gameRef.current
    if (game.turn() !== playerColor) return 'snapback'

    if (isPromotionMove(source, target)) {
      setTimeout(async () => {
        const piece = await pickPromotionPiece(source, target)
        if (!piece) return
        const move = applyMove(source, target, piece)
        if (!move) return
        recordLastMove(source, target)
        boardRef.current?.position(gameRef.current.fen(), false)
        playMoveSound()
        refreshBoardStatus()
        writeUrlParams({ fen: gameRef.current.fen() })
        setTimeout(() => doEngineMove(), 0)
      }, 0)
      return 'snapback'
    }

    const move = applyMove(source, target)
    if (!move) return 'snapback'

    recordLastMove(source, target)
    playMoveSound()
    refreshBoardStatus()
    writeUrlParams({ fen: gameRef.current.fen() })

    // Sync the board for moves that change extra squares (castling, en-passant, promotion).
    if (['k', 'q', 'e', 'p'].some((flag) => move.flags.includes(flag))) {
      setTimeout(() => { boardRef.current?.position(gameRef.current.fen(), false) }, 120)
    }

    setTimeout(() => doEngineMove(), 0)
    return undefined
  }

  function undoLastMove() {
    const count = undoMoves()
    if (count === 0) return
    cancelPending()
    clearLastMove()
    boardRef.current?.position(gameRef.current.fen(), false)
    writeUrlParams({ fen: gameRef.current.fen() })
    refreshBoardStatus()
  }

  function flipBoard() {
    if (!boardRef.current) return
    boardRef.current.flip()
    boardOrientationRef.current = boardOrientationRef.current === 'white' ? 'black' : 'white'
  }

  // ── Engine move ─────────────────────────────────────────────────────────────

  async function doEngineMove(colorOverride) {
    const color = colorOverride ?? playerColor
    const game = gameRef.current
    if (thinkingRef.current || game.isGameOver() || game.turn() === color) return

    setStatus(tRef.current.thinking(selectedEngine))

    try {
      const moveResult = await requestMove(game.fen(), selectedEngine, level)
      if (!moveResult) return  // Aborted or superseded.

      const { from, to, san, promotion } = moveResult
      applyEngineMove(from, to, san, promotion)
      recordLastMove(from, to)
      boardRef.current?.position(gameRef.current.fen(), false)
      playMoveSound()
      writeUrlParams({ fen: gameRef.current.fen() })
    } catch {
      // Error already surfaced via engineError → local error state.
    } finally {
      refreshBoardStatus()
    }
  }

  // ── PGN / PNG ───────────────────────────────────────────────────────────────

  function buildPgnText() {
    return gameRef.current.pgn({ maxWidth: 100, newline: '\n' }).trim() || '*'
  }

  async function copyPgnToClipboard() {
    setError('')
    try {
      const canCopy = window.isSecureContext && typeof navigator.clipboard?.writeText === 'function'
      const canVerify = canCopy && typeof navigator.clipboard?.readText === 'function'
      const pgn = buildPgnText()

      if (canCopy) {
        try {
          await navigator.clipboard.writeText(pgn)
          if (canVerify) {
            const text = await navigator.clipboard.readText()
            const expected = pgn.replace(/\r\n/g, '\n').trim()
            const actual = (text || '').replace(/\r\n/g, '\n').trim()
            if (!actual || !expected.startsWith(actual.slice(0, 20))) throw new Error(t.clipboardSecure)
          }
          setStatus(t.copiedPgn)
          return
        } catch { /* Fall through to download. */ }
      }

      downloadTextFile(pgn, 'chess3d-game.pgn', 'application/x-chess-pgn;charset=utf-8')
      setStatus(t.downloadedPgnText)
    } catch (err) {
      setError(t.copyPgnFailed(err?.message || t.clipboardSecure))
    }
  }

  async function downloadPgnFile() {
    setError('')
    try {
      downloadTextFile(buildPgnText(), 'chess3d-game.pgn', 'application/x-chess-pgn;charset=utf-8')
      setStatus(t.downloadedPgnText)
    } catch (err) {
      setError(t.copyPgnFailed(err?.message || t.clipboardSecure))
    }
  }

  async function sharePosition() {
    const url = window.location.href
    try {
      if (window.isSecureContext && typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback: select a temporary input
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setStatus(t.shareCopied)
    } catch {
      setStatus(url) // Last resort: just show the URL in the status area
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const levelProfile = t[getLevelProfile(level)]
  const levelElo = getLevelElo(level)
  const levelAriaText = `${level} — ${levelProfile} (${levelElo} Elo)`
  // Index of the last half-move in the moves array (for table highlighting)
  const lastMoveIndex = moves.length - 1

  return (
    <div className="app">
      <header className="topbar">
        <div />
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <img src="/icons/icon-192.svg" alt="Logo" style={{ width: '32px', height: '32px' }} />
          {t.title}
        </h1>
        {health !== 'ok' && health !== 'unknown' && (
          <div className={`health health-${health}`} role="status">
            {t.health}: {health}
          </div>
        )}
      </header>

      <main className="layout">
        <section className="board-panel" aria-label="Chess board">
          {/* Thinking progress bar sits along the top edge of the board */}
          <div className="board-host-wrap">
            {isThinking && <div className="thinking-bar" aria-hidden="true" />}
            <div id={BOARD_CONTAINER_ID} className="board-host" />
          </div>
          {!ready && <p className="hint">{t.loadingBoard}</p>}
        </section>

        <aside className="side-panel" aria-label="Game controls">
          <div className="controls">

            {/* Engine selector */}
            <label htmlFor="engine-select">
              {t.engine}
              <select
                id="engine-select"
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
              >
                {engines.length === 0 && <option value="stockfish">stockfish</option>}
                {engines.map((eng) => (
                  <option key={eng.name} value={eng.name}>
                    {eng.name}{eng.healthy ? '' : ' (unhealthy)'}
                  </option>
                ))}
              </select>
            </label>

            {/* Level slider */}
            <label htmlFor="level-slider">
              {t.level}: {level} — {levelProfile}
              <span className="level-elo" aria-hidden="true"> ({levelElo} Elo)</span>
              <input
                id="level-slider"
                type="range"
                min="1"
                max="20"
                value={level}
                aria-valuetext={levelAriaText}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </label>

            {/* Play as */}
            <label htmlFor="color-select">
              {t.playAs}
              <select
                id="color-select"
                value={playerColor}
                onChange={(e) => startNewGame(e.target.value)}
              >
                <option value="w">{t.white}</option>
                <option value="b">{t.black}</option>
              </select>
            </label>

            {/* Board theme */}
            <label htmlFor="theme-select">
              {t.boardTheme}
              <select
                id="theme-select"
                value={boardTheme}
                onChange={(e) => setBoardTheme(e.target.value)}
              >
                <option value="brownCream">{t.themeBrownCream}</option>
                <option value="whiteGray">{t.themeWhiteGray}</option>
                <option value="skyBlue">{t.themeSkyBlue}</option>
                <option value="yellowGreen">{t.themeYellowGreen}</option>
              </select>
            </label>

            {/* Action buttons */}
            <div className="actions" role="group" aria-label="Game actions">
              <button
                type="button"
                onClick={() => moves.length > 0 ? setConfirmNewGame(true) : startNewGame()}
              >
                {t.newGame}
              </button>
              <button type="button" onClick={undoLastMove}>{t.undo}</button>
              <button type="button" onClick={flipBoard}>{t.flip}</button>
              <button type="button" onClick={copyPgnToClipboard}>{t.copyPgn}</button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => doEngineMove()}
                disabled={isThinking || gameRef.current.turn() === playerColor}
              >
                {t.engineMoveNow}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={sharePosition}
                title={t.sharePosition}
              >
                {t.sharePosition}
              </button>
            </div>

            {/* Inline new-game confirmation — no window.confirm() */}
            {confirmNewGame && (
              <div className="confirm-dialog" role="alertdialog" aria-live="assertive">
                <span>{t.newGameConfirm}</span>
                <div className="confirm-dialog-btns">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => startNewGame()}
                  >
                    {t.newGameConfirmYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmNewGame(false)}
                  >
                    {t.newGameConfirmNo}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status + thinking badge + FEN */}
          <div className="status" role="status" aria-live="polite">
            <p><strong>{t.statusLabel}:</strong> {status}</p>
            {isThinking && (
              <div className="thinking-badge" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                {tRef.current.thinking(selectedEngine)}
              </div>
            )}
            <label className="fen-field" htmlFor="fen-input">
              <span>{t.fen}:</span>
              <input
                id="fen-input"
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                spellCheck={false}
                aria-label={t.fen}
              />
            </label>
            {fenError && <p className="error" role="alert">{fenError}</p>}
            {error   && <p className="error" role="alert">{error}</p>}
          </div>

          {/* Moves table — last move row highlighted */}
          <div className="moves">
            <h2>{t.moves}</h2>
            <div className="moves-table-wrap" ref={movesScrollRef}>
              <table className="moves-table" aria-label={t.moves}>
                <thead>
                  <tr>
                    <th scope="col">{t.turn}</th>
                    <th scope="col">{t.white}</th>
                    <th scope="col">{t.black}</th>
                  </tr>
                </thead>
                <tbody>
                  {moveRows.map((row) => {
                    // Row index in half-moves: white is 2*(row.turn-1), black is 2*(row.turn-1)+1
                    const whiteIdx = (row.turn - 1) * 2
                    const blackIdx = whiteIdx + 1
                    const isLastRow = blackIdx === lastMoveIndex || whiteIdx === lastMoveIndex
                    const lastIsBlack = blackIdx === lastMoveIndex
                    return (
                      <tr key={row.turn} className={isLastRow ? 'last-move-row' : ''}>
                        <td>{row.turn}</td>
                        <td className={isLastRow && !lastIsBlack ? 'last-move-cell' : ''}>{row.white}</td>
                        <td className={isLastRow && lastIsBlack  ? 'last-move-cell' : ''}>{row.black}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Language picker */}
          <div className="language-picker">
            <label htmlFor="lang-select">
              {t.language}
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="it">Italiano</option>
              </select>
            </label>
          </div>
        </aside>
      </main>

      {/* Promotion modal */}
      <PromotionModal
        open={promotionPending !== null}
        color={promotionPending ? gameRef.current.get(promotionPending.from)?.color : 'w'}
        onChoose={handlePromotionChoose}
        onCancel={handlePromotionCancel}
        t={t}
      />
    </div>
  )
}
