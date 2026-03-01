import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { ensureChessboard3Loaded } from './lib/loadChessboard3'

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
  whiteGray: { light: 0xf8fafc, dark: 0x6b7280 },
  skyBlue: { light: 0x93c5fd, dark: 0x1d4ed8 },
  yellowGreen: { light: 0xfef08a, dark: 0x65a30d },
}
const SUPPORTED_LANGS = ['en', 'es', 'pt', 'it']
const URL_FEN_PARAM = 'fen'
const TRANSLATIONS = {
  en: {
    title: 'Chess 3D Online',
    health: 'health',
    loadingBoard: 'Loading board...',
    engine: 'Engine',
    level: 'Level',
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
    invalidPromotion: 'Invalid promotion piece. Use q, r, b, or n.',
  },
  es: {
    title: 'Chess 3D Online',
    health: 'salud',
    loadingBoard: 'Cargando tablero...',
    engine: 'Motor',
    level: 'Nivel',
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
    invalidPromotion: 'Promocion invalida. Usa q, r, b o n.',
  },
  pt: {
    title: 'Chess 3D Online',
    health: 'saude',
    loadingBoard: 'Carregando tabuleiro...',
    engine: 'Motor',
    level: 'Nivel',
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
    invalidPromotion: 'Promocao invalida. Use q, r, b ou n.',
  },
  it: {
    title: 'Chess 3D Online',
    health: 'salute',
    loadingBoard: 'Caricamento scacchiera...',
    engine: 'Motore',
    level: 'Livello',
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
    invalidPromotion: 'Promozione non valida. Usa q, r, b o n.',
  },
}

function parseUciMove(move) {
  if (!move || move.length < 4) {
    return null
  }
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.length >= 5 ? move.slice(4, 5).toLowerCase() : undefined,
  }
}

function getFenFromUrl() {
  if (typeof window === 'undefined') {
    return null
  }
  const params = new URLSearchParams(window.location.search)
  return params.get(URL_FEN_PARAM) || params.get('position')
}

function updateFenUrl(fen) {
  if (typeof window === 'undefined') {
    return
  }
  const url = new URL(window.location.href)
  url.searchParams.set(URL_FEN_PARAM, fen)
  url.searchParams.delete('position')
  try {
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    // Ignore history API restrictions (e.g. file:// or embedded contexts).
  }
}

function safelyLoadFen(game, fen) {
  try {
    game.load(fen)
    return true
  } catch {
    return false
  }
}

function isDarkSquare(square) {
  const file = square.charCodeAt(0) - 97 // a=0 ... h=7
  const rank = Number(square[1]) // 1 ... 8
  return (file + rank) % 2 === 1
}

export default function App() {
  const boardRef = useRef(null)
  const boardInitRef = useRef(false)
  const boardOrientationRef = useRef('white')
  const audioContextRef = useRef(null)
  const gameRef = useRef(new Chess())
  const thinkingRef = useRef(false)
  const engineRequestRef = useRef(0)
  const playerColorRef = useRef('w')
  const selectedEngineRef = useRef('stockfish')
  const levelRef = useRef(5)
  const languageRef = useRef('en')
  const boardThemeRef = useRef('brownCream')
  const initialFenRef = useRef(null)

  if (initialFenRef.current === null) {
    const fenFromUrl = getFenFromUrl()
    if (fenFromUrl) {
      const tempGame = new Chess()
      if (safelyLoadFen(tempGame, fenFromUrl)) {
        gameRef.current.load(tempGame.fen())
        playerColorRef.current = tempGame.turn()
        initialFenRef.current = tempGame.fen()
      } else {
        initialFenRef.current = ''
      }
    } else {
      initialFenRef.current = ''
    }
  }

  const [ready, setReady] = useState(false)
  const [engines, setEngines] = useState([])
  const [selectedEngine, setSelectedEngine] = useState('stockfish')
  const [level, setLevel] = useState(5)
  const [playerColor, setPlayerColor] = useState(playerColorRef.current)
  const [boardTheme, setBoardTheme] = useState('brownCream')
  const [language, setLanguage] = useState('en')
  const [status, setStatus] = useState(TRANSLATIONS.en.loadingBoard)
  const [error, setError] = useState('')
  const [fenInput, setFenInput] = useState(gameRef.current.fen())
  const [fenError, setFenError] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [moves, setMoves] = useState([])
  const [health, setHealth] = useState('unknown')

  const t = TRANSLATIONS[language]
  const moveRows = useMemo(() => {
    const rows = []
    for (let i = 0; i < moves.length; i += 2) {
      rows.push({
        turn: rows.length + 1,
        white: moves[i]?.san || '',
        black: moves[i + 1]?.san || '',
      })
    }
    return rows
  }, [moves])

  useEffect(() => {
    selectedEngineRef.current = selectedEngine
  }, [selectedEngine])

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    playerColorRef.current = playerColor
  }, [playerColor])

  useEffect(() => {
    boardThemeRef.current = boardTheme
    syncBoardWithGame()
  }, [boardTheme])

  useEffect(() => {
    const userLang = (navigator.language || 'en').slice(0, 2)
    if (SUPPORTED_LANGS.includes(userLang)) {
      setLanguage(userLang)
      languageRef.current = userLang
    }
  }, [])

  useEffect(() => {
    languageRef.current = language
    refreshBoardStatus()
  }, [language])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextFen = fenInput.trim()
      if (!nextFen || nextFen === gameRef.current.fen()) {
        setFenError('')
        return
      }

      const loaded = safelyLoadFen(gameRef.current, nextFen)
      if (!loaded) {
        setFenError(tt().invalidFen)
        return
      }

      engineRequestRef.current += 1
      setIsThinking(false)
      thinkingRef.current = false
      setMoves([])
      setError('')
      setFenError('')
      if (boardRef.current) {
        boardRef.current.position(gameRef.current.fen(), false)
      }
      syncFenState()
      refreshBoardStatus()
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [fenInput])

  function tt() {
    return TRANSLATIONS[languageRef.current] || TRANSLATIONS.en
  }

  function syncFenState(syncUrl = true) {
    const fen = gameRef.current.fen()
    setFenInput(fen)
    if (syncUrl) {
      updateFenUrl(fen)
    }
  }

  function syncBoardWithGame() {
    if (boardRef.current) {
      boardRef.current.position(gameRef.current.fen(), false)
    }
  }

  function playPieceMoveSound() {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

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

      for (let i = 0; i < frameCount; i += 1) {
        const decay = 1 - (i / frameCount)
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

  function isPromotionMove(from, to) {
    const piece = gameRef.current.get(from)
    if (!piece || piece.type !== 'p') {
      return false
    }
    return (piece.color === 'w' && to.endsWith('8')) || (piece.color === 'b' && to.endsWith('1'))
  }

  function normalizePromotionChoice(raw) {
    if (!raw) {
      return null
    }
    const value = raw.trim().toLowerCase()
    if (['q', 'queen', 'dama', 'donna'].includes(value)) return 'q'
    if (['r', 'rook', 'torre'].includes(value)) return 'r'
    if (['b', 'bishop', 'alfil', 'bispo', 'alfiere'].includes(value)) return 'b'
    if (['n', 'knight', 'caballo', 'cavalo', 'cavallo'].includes(value)) return 'n'
    return null
  }

  function pickPromotionPiece() {
    const choice = window.prompt(tt().promotionPrompt, 'q')
    const normalized = normalizePromotionChoice(choice)
    if (!normalized) {
      setError(tt().invalidPromotion)
      return null
    }
    return normalized
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        await ensureChessboard3Loaded()
        if (!isMounted) {
          return
        }

        if (boardInitRef.current) {
          return
        }

        boardRef.current = new window.ChessBoard3(BOARD_CONTAINER_ID, {
          position: 'start',
          draggable: true,
          dropOffBoard: 'snapback',
          showNotation: true,
          backgroundColor: 0x0b0b0b,
          moveSpeed: 150,
          snapbackSpeed: 90,
          snapSpeed: 70,
          pieceSet: 'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/assets/chesspieces/classic/{piece}.json',
          fontData: 'https://cdn.jsdelivr.net/gh/jtiscione/chessboard3js/assets/fonts/helvetiker_regular.typeface.json',
          onDrop: (source, target, piece, newPos, oldPos) => {
            if (thinkingRef.current) {
              forceRollback(oldPos)
              return 'snapback'
            }
            const dropResult = handlePlayerMove(source, target)
            if (dropResult === 'snapback') {
              forceRollback(oldPos)
            }
            return dropResult
          },
          onRender: (scene, squareMeshIds) => {
            const theme = BOARD_THEMES[boardThemeRef.current] || BOARD_THEMES.brownCream
            Object.entries(squareMeshIds).forEach(([square, meshId]) => {
              const mesh = scene.getObjectById(meshId)
              if (!mesh || !mesh.material || !mesh.material.color) {
                return
              }
              mesh.material.color.setHex(isDarkSquare(square) ? theme.dark : theme.light)
            })
          },
          onMoveEnd: refreshBoardStatus,
        })

        boardInitRef.current = true
        setReady(true)
        if (initialFenRef.current) {
          syncBoardWithGame()
          applyOrientation(playerColorRef.current)
          syncFenState()
          refreshBoardStatus()
        } else {
          startNewGame(playerColorRef.current, false)
        }
      } catch (err) {
        setError(err.message || tt().failedInit)
      }
    }

    initialize()
    fetchEngines()
    fetchHealth()

    return () => {
      isMounted = false
      if (boardRef.current && boardRef.current.destroy) {
        boardRef.current.destroy()
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
      boardRef.current = null
      boardInitRef.current = false
      audioContextRef.current = null
    }
  }, [])

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
        let detail = ''
        try {
          const body = await res.json()
          detail = body?.error || body?.message || ''
        } catch {
          // Ignore parse errors and keep status-only message.
        }
        throw new Error(detail ? `HTTP ${res.status}: ${detail}` : `HTTP ${res.status}`)
      }
      const data = await res.json()
      const list = data.engines || []
      setEngines(list)
      if (data.default) {
        setSelectedEngine(data.default)
      }
    } catch (err) {
      setEngines(FALLBACK_ENGINES.map((name) => ({ name, healthy: true })))
      setSelectedEngine('stockfish')
      setError(tt().engineUnavailable(err.message))
    }
  }

  function refreshBoardStatus() {
    const game = gameRef.current
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? tt().black : tt().white
        setStatus(tt().checkmate(winner))
        return
      }
      if (game.isDraw()) {
        setStatus(tt().draw)
        return
      }
      setStatus(tt().gameOver)
      return
    }

    const side = game.turn() === 'w' ? tt().white : tt().black
    const check = game.isCheck() ? tt().check : ''
    setStatus(tt().toMove(side, check))
  }

  function applyOrientation(color) {
    const board = boardRef.current
    if (!board) {
      return
    }

    const desired = color === 'w' ? 'white' : 'black'
    if (typeof board.orientation === 'function') {
      try {
        board.orientation(desired)
        const current = board.orientation()
        if (current === 'white' || current === 'black') {
          boardOrientationRef.current = current
          if (current === desired) {
            return
          }
        }
      } catch {
        // Fallback to flip if this build does not support orientation().
      }
    }

    if (desired !== boardOrientationRef.current && typeof board.flip === 'function') {
      board.flip()
      boardOrientationRef.current = desired
    }
  }

  function startNewGame(color = playerColorRef.current, syncUrl = true) {
    playerColorRef.current = color
    setPlayerColor(color)
    gameRef.current.reset()
    setMoves([])
    setError('')
    setIsThinking(false)
    thinkingRef.current = false
    engineRequestRef.current += 1

    if (boardRef.current) {
      boardRef.current.position('start', false)
      applyOrientation(color)
    }

    syncFenState(syncUrl)
    refreshBoardStatus()

    if (color === 'b') {
      window.setTimeout(() => {
        requestEngineMove()
      }, 0)
    }
  }

  function handlePlayerMove(source, target) {
    if (target === 'offboard') {
      return 'snapback'
    }

    const game = gameRef.current
    if (game.turn() !== playerColorRef.current) {
      return 'snapback'
    }

    let promotion
    if (isPromotionMove(source, target)) {
      promotion = pickPromotionPiece()
      if (!promotion) {
        return 'snapback'
      }
    }

    const move = game.move({ from: source, to: target, promotion })
    if (!move) {
      return 'snapback'
    }

    setMoves((prev) => [...prev, { color: move.color, san: move.san }])
    syncFenState()
    playPieceMoveSound()
    refreshBoardStatus()

    // Avoid forcing a full position sync during onDrop for normal moves,
    // because it can hide the dragged piece in some chessboard3 builds.
    // Sync only for special rules where extra pieces move/remove.
    if (['k', 'q', 'e', 'p'].some((flag) => move.flags.includes(flag))) {
      window.setTimeout(() => {
        syncBoardWithGame()
      }, 120)
    }

    window.setTimeout(() => {
      requestEngineMove()
    }, 0)

    return undefined
  }

  function forceRollback(oldPos) {
    if (!boardRef.current || !oldPos) {
      return
    }
    // Force widget state back to pre-drag layout if internal snapback fails.
    window.setTimeout(() => {
      if (boardRef.current) {
        boardRef.current.position(oldPos, false)
      }
    }, 0)
  }

  async function requestEngineMove() {
    const game = gameRef.current
    if (thinkingRef.current || game.isGameOver() || game.turn() === playerColorRef.current) {
      return
    }

    const engineToUse = selectedEngineRef.current
    const levelToUse = levelRef.current
    const requestId = ++engineRequestRef.current

    setIsThinking(true)
    thinkingRef.current = true
    setError('')
    setStatus(tt().thinking(engineToUse))

    try {
      const payload = {
        fen: game.fen(),
        engine: engineToUse,
        level: levelToUse,
      }

      const res = await fetch(`${API_BASE}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      if (requestId !== engineRequestRef.current) {
        return
      }

      const from = data?.response?.from
      const to = data?.response?.to
      const promotion = data?.response?.promotion
      if (!from || !to) {
        const parsed = parseUciMove(data?.response?.move)
        if (!parsed) {
          throw new Error(tt().invalidEngineMove)
        }
        applyEngineMove(parsed.from, parsed.to, data?.response?.san, parsed.promotion)
      } else {
        applyEngineMove(from, to, data?.response?.san, promotion)
      }
    } catch (err) {
      setError(tt().engineRequestFailed(err.message))
      setStatus(tt().moveFailed)
    } finally {
      if (requestId !== engineRequestRef.current) {
        return
      }
      setIsThinking(false)
      thinkingRef.current = false
      refreshBoardStatus()
    }
  }

  function applyEngineMove(from, to, sanFromApi, promotion) {
    const game = gameRef.current
    const move = game.move({ from, to, promotion })
    if (!move) {
      throw new Error(`Engine returned invalid move: ${from}${to}`)
    }

    syncBoardWithGame()
    setMoves((prev) => [...prev, { color: move.color, san: sanFromApi || move.san }])
    syncFenState()
    playPieceMoveSound()
  }

  function undoLastMove() {
    let undoneCount = 0
    for (let i = 0; i < 2; i += 1) {
      const undone = gameRef.current.undo()
      if (!undone) {
        break
      }
      undoneCount += 1
    }

    if (undoneCount === 0) {
      return
    }

    engineRequestRef.current += 1
    setIsThinking(false)
    thinkingRef.current = false
    setMoves((prev) => prev.slice(0, Math.max(0, prev.length - undoneCount)))
    syncBoardWithGame()
    syncFenState()
    refreshBoardStatus()
  }

  function flipBoard() {
    if (boardRef.current) {
      boardRef.current.flip()
      boardOrientationRef.current = boardOrientationRef.current === 'white' ? 'black' : 'white'
    }
  }

  function buildPgnText() {
    const pgn = gameRef.current.pgn({ maxWidth: 100, newline: '\n' }).trim()
    return pgn || '*'
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

  async function downloadPgnFile() {
    setError('')
    try {
      const pgn = buildPgnText()
      downloadTextFile(pgn, 'chess3d-game.pgn', 'application/x-chess-pgn;charset=utf-8')
      setStatus(tt().downloadedPgnText)
    } catch (err) {
      setError(tt().copyPgnFailed(err?.message || tt().clipboardSecure))
    }
  }

  async function copyPgnToClipboard() {
    setError('')

    try {
      const canCopy =
        window.isSecureContext
        && !!navigator.clipboard
        && typeof navigator.clipboard.writeText === 'function'
      const canVerifyClipboard =
        window.isSecureContext
        && !!navigator.clipboard
        && typeof navigator.clipboard.readText === 'function'
      const pgn = buildPgnText()

      if (canCopy) {
        try {
          await navigator.clipboard.writeText(pgn)

          if (canVerifyClipboard) {
            const text = await navigator.clipboard.readText()
            const normalizedExpected = pgn.replace(/\r\n/g, '\n').trim()
            const normalizedActual = (text || '').replace(/\r\n/g, '\n').trim()
            if (!normalizedActual || !normalizedExpected.startsWith(normalizedActual.slice(0, 20))) {
              throw new Error(tt().clipboardSecure)
            }
            setStatus(tt().copiedPgn)
            return
          } else {
            setStatus(tt().copiedPgn)
            return
          }
        } catch {
          // Fall through to file download when clipboard copy is blocked/incompatible.
        }
      }

      downloadTextFile(pgn, 'chess3d-game.pgn', 'application/x-chess-pgn;charset=utf-8')
      setStatus(tt().downloadedPgnText)
    } catch (err) {
      setError(tt().copyPgnFailed(err?.message || tt().clipboardSecure))
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div />
        <h1>{t.title}</h1>
        {health !== 'ok' && health !== 'unknown' && (
          <div className={`health health-${health}`}>{t.health}: {health}</div>
        )}
      </header>

      <main className="layout">
        <section className="board-panel">
          <div id={BOARD_CONTAINER_ID} className="board-host" />
          {!ready && <p className="hint">{t.loadingBoard}</p>}
        </section>

        <aside className="side-panel">
          <div className="controls">
            <label>
              {t.engine}
              <select value={selectedEngine} onChange={(e) => setSelectedEngine(e.target.value)}>
                {engines.length === 0 && <option value="stockfish">stockfish</option>}
                {engines.map((engine) => (
                  <option key={engine.name} value={engine.name}>
                    {engine.name} {engine.healthy ? '' : '(unhealthy)'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.level}: {level}
              <input
                type="range"
                min="1"
                max="20"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </label>

            <label>
              {t.playAs}
              <select value={playerColor} onChange={(e) => startNewGame(e.target.value)}>
                <option value="w">{t.white}</option>
                <option value="b">{t.black}</option>
              </select>
            </label>

            <label>
              {t.boardTheme}
              <select value={boardTheme} onChange={(e) => setBoardTheme(e.target.value)}>
                <option value="brownCream">{t.themeBrownCream}</option>
                <option value="whiteGray">{t.themeWhiteGray}</option>
                <option value="skyBlue">{t.themeSkyBlue}</option>
                <option value="yellowGreen">{t.themeYellowGreen}</option>
              </select>
            </label>

            <div className="actions">
              <button type="button" onClick={() => startNewGame()}>{t.newGame}</button>
              <button type="button" onClick={undoLastMove}>{t.undo}</button>
              <button type="button" onClick={flipBoard}>{t.flip}</button>
              <button type="button" onClick={copyPgnToClipboard}>{t.copyPgn}</button>
              <button type="button" onClick={requestEngineMove} disabled={isThinking || gameRef.current.turn() === playerColor}>
                {t.engineMoveNow}
              </button>
            </div>
          </div>

          <div className="status">
            <p><strong>{t.statusLabel}:</strong> {status}</p>
            <label className="fen-field">
              <span>{t.fen}:</span>
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                spellCheck={false}
              />
            </label>
            {fenError && <p className="error">{fenError}</p>}
            {error && <p className="error">{error}</p>}
          </div>

          <div className="moves">
            <h2>{t.moves}</h2>
            <div className="moves-table-wrap">
              <table className="moves-table">
                <thead>
                  <tr>
                    <th>{t.turn}</th>
                    <th>{t.white}</th>
                    <th>{t.black}</th>
                  </tr>
                </thead>
                <tbody>
                  {moveRows.map((row) => (
                    <tr key={row.turn}>
                      <td>{row.turn}</td>
                      <td>{row.white}</td>
                      <td>{row.black}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="language-picker">
            <label>
              {t.language}
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="es">Espanol</option>
                <option value="pt">Portugues</option>
                <option value="it">Italiano</option>
              </select>
            </label>
          </div>
        </aside>
      </main>
    </div>
  )
}
