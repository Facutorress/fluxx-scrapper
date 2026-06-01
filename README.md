# Fluxx Dashboard

Dashboard interno de Fluxx para gestionar la prospección de gimnasios. Lee y escribe sobre Supabase. No toca el scraper de n8n.

## Stack

- **Next.js 14** (App Router) + **TypeScript** estricto
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI debajo)
- **Supabase** (Postgres + Auth con Google OAuth)
- **Lucide** para iconos (stroke 1.5, currentColor)
- Tipografías: **Syne** (headings), **DM Sans** (body), **JetBrains Mono** (data)
- ESLint + Prettier

## Estructura

```
app/
  layout.tsx                # fonts + Toaster + html.dark
  globals.css               # CSS vars de marca + Tailwind v3
  page.tsx                  # redirect → /dashboard
  login/                    # login con Google
  auth/callback/            # handler post-Supabase
  (app)/                    # rutas protegidas (Header + Nav)
    layout.tsx
    dashboard/              # métricas + tabla + sheet + dialog
    conversaciones/
      page.tsx
      conversaciones-list.tsx
      nueva/                # form dedicado
    estrategias/            # CRUD
  actions/                  # Server Actions (gimnasios, conversaciones, estrategias, auth)
components/
  ui/                       # shadcn primitives
  header.tsx, nav.tsx
  metric-card.tsx           # card "signature" con borde izq violeta
  status-chip.tsx           # select inline para cambiar status
  gimnasios-table.tsx       # tabla + filtros + tabs Activos/Histórico
  gimnasio-sheet.tsx        # panel lateral con detalle + notas
  conversacion-dialog.tsx   # modal para cargar conversación
lib/
  supabase/{server,client,middleware}.ts
  database.types.ts         # types manuales del schema
  auth.ts                   # whitelist
  utils.ts                  # cn() de shadcn
middleware.ts               # auth gate + whitelist
```

## Cómo correr local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear `.env.local`

Copiá `.env.example` y completá con tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # opcional, no se usa en runtime
```

Los conseguís en **Supabase Dashboard → Project Settings → API**.

### 3. Configurar Site URL en Supabase

Para que el callback funcione en local:

- **Supabase Dashboard → Authentication → URL Configuration**
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** (whitelist): agregá `http://localhost:3000/auth/callback`

Cuando deployees a producción, agregá ahí también `https://<tu-dominio>/auth/callback`.

### 4. Levantar dev server

```bash
npm run dev
```

Abrí http://localhost:3000 — te redirige a `/login`.

### Whitelist de mails

La lista de mails autorizados está en [lib/auth.ts](lib/auth.ts) (`ALLOWED_EMAILS`). Si el mail con el que entrás no está, el middleware hace `signOut()` y vuelve a `/login?error=not_allowed`. Editá esa constante para agregar gente.

## Scripts

| Script | Acción |
| --- | --- |
| `npm run dev` | Dev server con hot reload en `:3000` |
| `npm run build` | Build de producción (genera `.next/standalone`) |
| `npm run start` | Corre el build de producción |
| `npm run lint` | ESLint con config de Next |
| `npm run format` | Prettier — escribe |
| `npm run format:check` | Prettier — chequea sin escribir |

## Flujo de OAuth con Google (importante)

Hay dos URIs distintos involucrados en el flujo y suele confundirse:

### El URI registrado en Google Cloud Console apunta a Supabase

En **Google Cloud Console → APIs & Services → Credentials → Tu OAuth Client → Authorized redirect URIs**, el URI registrado debe ser:

```
https://<tu-proyecto>.supabase.co/auth/v1/callback
```

**No** apunta al Next.js. Apunta a Supabase. Supabase es quien recibe el code de Google y emite la sesión.

### `/auth/callback` del Next.js es interno

La ruta [app/auth/callback/route.ts](app/auth/callback/route.ts) **no se registra en Google Cloud Console**. Es el destino al que Supabase redirige *después* de su propio callback, pasando el `code` que Next intercambia por sesión vía `exchangeCodeForSession`.

### Flujo completo paso a paso

1. Usuario clickea "Iniciar sesión con Google" en `/login`.
2. Next dispara `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })`.
3. El browser navega a Supabase, que redirige a Google con sus credenciales.
4. Google muestra el consent screen, usuario aprueba.
5. Google redirige a `https://<tu-proyecto>.supabase.co/auth/v1/callback?code=...` (el URI de Google Cloud).
6. Supabase recibe ese code, emite tokens internos, y redirige al `redirectTo` que pasamos en el paso 2: `<origin>/auth/callback?code=...` (el URI de Next).
7. El handler [app/auth/callback/route.ts](app/auth/callback/route.ts) intercambia ese code por sesión, valida la whitelist de mails, y redirige a `/dashboard`.

### Whitelist enforcement

El check de whitelist corre en dos lugares (defense in depth):

- **[app/auth/callback/route.ts](app/auth/callback/route.ts)** — apenas se establece la sesión, antes de redirigir al dashboard.
- **[middleware.ts](middleware.ts)** — en cada request a una ruta protegida.

En ambos lugares, si el email no está en `ALLOWED_EMAILS`, hacemos `supabase.auth.signOut()` **antes** de redirigir a `/login?error=not_allowed`. Es importante el orden: si no se hace `signOut`, el próximo request encuentra una sesión válida con email no autorizado y entra en loop.

## Deploy en EasyPanel

### 1. Subir el repo a GitHub

```bash
git remote add origin git@github.com:<tu-org>/fluxx-dashboard.git
git push -u origin main
```

### 2. Crear app en EasyPanel

- Source: GitHub repo
- Build method: **Dockerfile**
- Port: **3000**

### 3. Variables de entorno

En EasyPanel → tu app → Environment, agregá:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # opcional
```

**Importante**: las `NEXT_PUBLIC_*` también deben pasarse como **build args** (no solo runtime), porque Next las inlinea durante el build. En EasyPanel, configurá la app con esas variables marcadas como "build-time".

### 4. Configurar el dominio en Supabase

- **Supabase Dashboard → Authentication → URL Configuration**
- Agregá `https://<tu-dominio-easypanel>` a Site URL (o como Redirect URL adicional).
- Agregá `https://<tu-dominio-easypanel>/auth/callback` a Redirect URLs.

### 5. Verificar el OAuth client en Google Cloud

El URI registrado en Google Cloud Console **sigue siendo** `https://<tu-proyecto>.supabase.co/auth/v1/callback`. **No** hay que registrar el dominio de EasyPanel ahí.

## Schema de Supabase

Las 4 tablas (`gimnasios`, `estrategias`, `conversaciones`, `analisis_ia`) se asume que ya están creadas en Supabase con su RLS y trigger de `updated_at`. Este dashboard solo lee/escribe — no corre migrations. Los types TS están manualmente declarados en [lib/database.types.ts](lib/database.types.ts) — mantenelos en sync con el schema real.

### Columnas que el scraper popula

`nombre, tipo, ciudad, direccion, telefono, whatsapp_link, web, instagram, google_maps_url, rating, cantidad_reviews, lat, lng, fecha_scrapeo`.

### Columnas que el dashboard maneja

`status_prospeccion`, `fecha_ultimo_contacto`, `notas`. El scraper no las pisa.

### Status

```
no_contactado | en_conversacion | prospectado | descartado
```

Activos = `no_contactado | en_conversacion`. Histórico = `prospectado | descartado`.

## Testing manual end-to-end

Después de seguir los pasos de "Cómo correr local" y tener `.env.local` configurado, validá la app contra Supabase real con esta lista:

### Auth
1. Abrí http://localhost:3000 sin sesión → debe redirigir a `/login`.
2. En `/login` clickeá "Iniciar sesión con Google" → flujo OAuth completo → llega a `/dashboard`.
3. Probá con un mail que **no** esté en `ALLOWED_EMAILS` → vuelve a `/login?error=not_allowed` con el mensaje de error visible.
4. Logueado, click en "Salir" del header → vuelve a `/login`.

### Dashboard
5. Las 4 cards de métricas suman correcto. Verificá en Supabase con:
   ```sql
   select status_prospeccion, count(*) from gimnasios group by 1;
   ```
6. Tab "Activos" muestra solo `no_contactado` y `en_conversacion`. Tab "Histórico" muestra `prospectado` y `descartado`.
7. Búsqueda por nombre filtra en tiempo real.
8. Selects de Ciudad / Tipo se llenan automáticamente con los valores del dataset.
9. Click en una fila (no sobre el chip ni el botón) → abre el Sheet con detalle del gimnasio.
10. Cambiar el chip de status inline → toast confirma + verificá en Supabase que `status_prospeccion` y `updated_at` se actualizaron.
11. En el Sheet, escribir notas + setear fecha → click "Guardar cambios" → toast + verificar en Supabase.
12. Click en "Cargar conversación" → modal con form pre-cargado → completar y guardar → status del gimnasio pasa a `prospectado`, conversación queda registrada.

### Conversaciones
13. `/conversaciones` lista todas las cargadas, ordenadas por fecha desc.
14. Filtro de estrategia funciona.
15. Click en una fila o en "Ver" → Sheet con la transcripción completa en monospace.
16. `/conversaciones/nueva` solo muestra gimnasios sin conversación previa (filtra por LEFT JOIN en JS). Cargar una nueva → redirect a `/conversaciones` con la nueva visible.

### Estrategias
17. `/estrategias` muestra las 3 cargadas en Supabase con su contador de conversaciones.
18. "Nueva estrategia" abre Dialog → crear una → aparece en la grilla.
19. Editar una estrategia (lápiz) → Dialog con datos pre-cargados → guardar → cambios reflejados.
20. Toggle "Activar/Desactivar" → cambia el badge.
21. Borrar una estrategia **sin conversaciones** → desaparece. Borrar una **con conversaciones** → toast con error "No se puede borrar...".

### Build standalone (deploy-ready)

Verificá que el bundle standalone se genera correcto:
```bash
npm run build
ls .next/standalone/server.js
```

Para probar el bundle como lo va a correr Docker:
```bash
node .next/standalone/server.js
```
(Va a fallar al hacer queries si no exportaste las env vars al shell — eso es esperado. Para test completo usar `docker build . && docker run -p 3000:3000 --env-file .env.local fluxx-dashboard`.)

## Lo que no incluye este MVP

- Análisis con Claude API (Etapa 3, no implementado).
- Vista de comparación entre estrategias (Etapa 3, no implementado).
- Analytics, telemetry, tracking — nada.
- i18n — solo español.

