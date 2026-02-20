# Chess3DOnline

Cliente web **Vite + React** para jugar ajedrez 3D contra motores de ajedrez usando **Chess Engine API**.

## Caracteristicas

- Tablero 3D con `chessboard3.js`.
- Integracion con API de motores:
  - `GET /api/engines`
  - `GET /api/health`
  - `POST /api/move`
- Seleccion de motor (Stockfish, Crafty, etc.) y nivel (`1-20`).
- Jugar como blancas o negras.
- Soporte de reglas especiales:
  - enroque
  - en passant
  - promocion de peon con seleccion de pieza (`dama`, `torre`, `alfil`, `caballo`)
- Undo completo (deshace turno completo: jugador + motor cuando aplica).
- FEN editable: al cambiar un FEN valido se recarga posicion y estado.
- Historial de jugadas en tabla por turnos (columna blancas/negras).
- Exportar tablero como PNG al portapapeles.
- Selector de temas del tablero:
  - cafe / crema
  - blanco / gris
  - celeste / azul
  - amarillo claro / verde
- Interfaz multilenguaje:
  - ingles
  - espanol
  - portugues
  - italiano
- PWA:
  - `manifest.webmanifest`
  - service worker (`public/sw.js`)
  - instalable en navegador compatible
- Soporte LAN para abrir desde otra laptop (host `0.0.0.0`).

## Stack

- React 18
- Vite 5
- chess.js
- chessboard3.js (cargado por CDN)

## Requisitos

- Node.js 18+
- npm
- Navegador con WebGL habilitado

## Configuracion

1. Copia variables de entorno:

```bash
cp .env.example .env
```

2. Instala dependencias:

```bash
npm install
```

3. Ejecuta en desarrollo:

```bash
npm run dev
```

El servidor Vite levanta en `0.0.0.0:5173`.

## Acceso desde otra laptop

Abre en otra maquina del mismo laboratorio/red:

```text
http://<IP_DE_TU_PC>:5173
```

Si usas firewall:

```bash
sudo ufw allow 5173/tcp
```

## API / Proxy

Por defecto el frontend usa `VITE_CHESS_API_BASE=/api` y Vite hace proxy a:

`https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io`

Puedes sobreescribir `VITE_CHESS_API_BASE` en `.env`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## PWA (prueba local)

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Luego abre:

```text
http://<IP_DE_TU_PC>:4173
```

Instala la app desde el navegador (si el navegador lo permite).

## Publicar en GitHub

Repositorio objetivo:

`https://github.com/daviszinho/Chess3DOnline`

Comandos (si el repo ya existe en GitHub):

```bash
git push -u origin main
```
