# Chess3D Client (Vite + React)

Cliente web para `Chess Engine API`, usando `chessboard3.js` para el tablero 3D.

## Requisitos

- Node.js 18+
- NPM
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

El servidor de Vite levanta en `0.0.0.0:5173` y usa proxy local:

- Frontend: `http://<IP_DE_TU_PC>:5173`
- API desde frontend: `/api/*` (redirigido a `https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io/api/*`)

## API utilizada

- `GET /engines`
- `GET /health`
- `POST /move`

Base URL por defecto: `/api` (via proxy de Vite).

Se puede sobreescribir con `VITE_CHESS_API_BASE`.

## PWA

La app ya incluye:

- `manifest.webmanifest`
- `service worker` (`public/sw.js`)
- Iconos en `public/icons/`

Para probar instalacion y cache offline usa build de produccion:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Luego abre `http://<IP_DE_TU_PC>:4173`, instala la app desde el navegador y verifica en DevTools > Application > Service Workers.
