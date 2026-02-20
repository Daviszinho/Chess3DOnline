# Chess3DOnline

Cliente web **Vite + React** para jugar ajedrez 3D contra motores de ajedrez usando **Chess Engine API**.

## Caracteristicas

- Tablero 3D con `chessboard3.js`.
- Integracion con API de motores:
  - `GET /api/engines`
  - `GET /api/health`
  - `POST /api/move`
- Seleccion de motor y nivel (`1-20`).
- Jugar como blancas o negras.
- Reglas especiales soportadas:
  - enroque
  - en passant
  - promocion de peon con seleccion de pieza (`dama`, `torre`, `alfil`, `caballo`)
- Undo completo (deshace turno completo cuando aplica).
- FEN editable con recarga de posicion.
- Historial de jugadas en tabla (blancas / negras).
- Exportar tablero como PNG al portapapeles.
- Temas de tablero:
  - cafe / crema
  - blanco / gris
  - celeste / azul
  - amarillo claro / verde
- Multilenguaje: ingles, espanol, portugues, italiano.
- PWA (manifest + service worker).

## Stack

- React 18
- Vite 5
- chess.js
- chessboard3.js (CDN)

## Requisitos

- Node.js **22.x**
- npm
- Navegador con WebGL habilitado

## Variables de entorno

Este proyecto ya viene preparado para Azure:

- Desarrollo local: `.env.development` usa `VITE_CHESS_API_BASE=/api` (proxy Vite).
- Produccion: `.env.production` usa la URL publica del backend.

Ejemplo base: `.env.example`

## Desarrollo local

```bash
npm install
npm run dev
```

Acceso en red local:

```text
http://<IP_DE_TU_PC>:5173
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Deploy en Azure Free (recomendado: Static Web Apps)

Esta app es frontend estatico, por lo que **Azure Static Web Apps Free** es la opcion mas directa.

1. Sube el repo a GitHub (`daviszinho/Chess3DOnline`).
2. En Azure Portal crea un recurso **Static Web App** (plan Free).
3. Conecta el repositorio y rama `main`.
4. Configura build:

- App location: `/`
- Output location: `dist`
- Build command: `npm run build`

5. En Configuration agrega:

- `NODE_VERSION=22`

El archivo `public/staticwebapp.config.json` ya esta incluido para fallback SPA y headers.

## Deploy alternativo en App Service Free (B1/F1)

Si prefieres App Service, publica el contenido de `dist/` como sitio estatico.
Aun asi, para este proyecto es mas simple y barato usar Static Web Apps Free.

## Publicar en GitHub

Repositorio objetivo:

`https://github.com/daviszinho/Chess3DOnline`

Si el repo ya existe:

```bash
git push -u origin main
```
