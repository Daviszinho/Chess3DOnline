# Chess3DOnline

Cliente web **Vite + React** para jugar ajedrez 3D contra motores de ajedrez usando **Chess Engine API**.

## Caracteristicas

- Tablero 3D con `chessboard3.js`.
- Integracion con API de motores:
  - `GET /api/engines`
  - `GET /api/health`
  - `POST /api/move`
- Seleccion de motor y nivel (`1-20`).
- Juego contra IA eligiendo color inicial (`blancas` o `negras`).
- Reglas especiales soportadas:
  - enroque
  - en passant
  - promocion de peon con seleccion de pieza (`dama`, `torre`, `alfil`, `caballo`)
- Undo completo (deshace turno completo cuando aplica).
- Campo FEN editable con recarga de posicion.
- Historial de jugadas en tabla (turno / blancas / negras).
- Exportacion de partida en **PGN**:
  - boton visible: **Copy PGN**
  - si el clipboard falla, hace fallback automatico a descarga `.pgn`
- Temas de tablero:
  - cafe / crema
  - blanco / gris
  - celeste / azul
  - amarillo claro / verde
- Interfaz multilenguaje:
  - ingles
  - espanol
  - portugues
  - italiano
- Diseño responsive para desktop y moviles.
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

El proyecto esta preparado para Azure:

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
npm run test
npm run coverage
npm run security:zap
```

## Deploy en Azure Free

### Opcion recomendada: Azure Static Web Apps (Free)

1. Sube el repo a GitHub (`daviszinho/Chess3DOnline`).
2. En Azure Portal crea un recurso **Static Web App** (plan Free).
3. Conecta el repo y rama `main`.
4. Configura build:

- App location: `/`
- Output location: `dist`
- Build command: `npm run build`

5. En Configuration agrega:

- `NODE_VERSION=22`

`public/staticwebapp.config.json` ya esta incluido para fallback SPA y headers.

### Opcion alternativa: Azure App Service (F1)

Si usas App Service Linux (Code), despliega `dist` y configura startup command:

```bash
pm2 serve /home/site/wwwroot --no-daemon --spa
```

## Publicar en GitHub

Repositorio objetivo:

`https://github.com/daviszinho/Chess3DOnline`

Si el repo ya existe:

```bash
git push -u origin main
```

## Seguridad (OWASP ZAP)

Escaneo baseline automatizado con OWASP ZAP para detectar alertas de seguridad en la app publicada localmente.

### Remediaciones aplicadas

Se agregaron cabeceras de seguridad para mitigar hallazgos de ZAP:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

Archivos donde se configuran:

- `vite.config.js` (desarrollo local y `vite preview`)
- `public/staticwebapp.config.json` (Azure Static Web Apps)
- `scripts/secure-preview.mjs` (servidor local para escaneo ZAP)

Directivas CSP activas (resumen):

- `default-src 'self'`
- `form-action 'self'`
- `frame-ancestors 'none'` (anti-clickjacking moderno)
- `script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com`
- `style-src 'self'` (sin `unsafe-inline`)
- `connect-src 'self' https://chessengineapi.calmdesert-d6fcfdbe.centralus.azurecontainerapps.io`

Requisitos locales:

- Docker
- curl

Ejecucion local:

```bash
npm run security:zap
```

Reportes generados en:

- `zap-reports/zap-report.html`
- `zap-reports/zap-report.json`
- `zap-reports/zap-report.md`

Variables opcionales:

- `ZAP_PORT` (default: `4173`)
- `ZAP_TARGET_URL` (default: `http://127.0.0.1:<PORT>`)
- `ZAP_REPORT_DIR` (default: `zap-reports`)
- `ZAP_IMAGE` (default: `ghcr.io/zaproxy/zaproxy:stable`)

CI:

- Workflow: `.github/workflows/security-zap.yml`
- Se ejecuta en `push` y `pull_request` a `main`.

Verificacion recomendada:

1. Ejecutar `npm run security:zap`.
2. Abrir `zap-reports/zap-report.html`.
3. Confirmar que ya no aparezcan:
- `Content Security Policy (CSP) Header Not Set`
- `Missing Anti-clickjacking Header`

Nota de despliegue:

- En **Azure Static Web Apps**, aplica `public/staticwebapp.config.json`.
- En **Azure App Service**, debes configurar estos headers en servidor/proxy de App Service tambien.
