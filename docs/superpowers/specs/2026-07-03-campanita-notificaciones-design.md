# Campanita de notificaciones — Panel del Entrenador

## Contexto

`index.html` es una SPA monolítica (Firebase Auth + Firestore) para el entrenador Angel Meier. Ya existe la pestaña **📬 Solicitudes** que muestra anamnesis pendientes (colección `solicitudes`) con un contador en el propio botón de la nav (`loadSolicitudes()`, línea ~3582).

El pedido es agregar una campanita de notificaciones centralizada en el header, visible al entrar a la app, que agrupe distintos eventos relevantes para el entrenador (no solo solicitudes).

## Alcance

Tipos de notificación (calculados al vuelo, sin nuevas colecciones ni campos en Firestore):

1. **Anamnesis pendientes** — de `solicitudes`, mismo criterio que ya usa el badge de la pestaña: `!status && !estado`, o `status === 'pendiente'`, o `estado === 'pendiente'`.
2. **Alumnos nuevos** — miembros (`plan.members[]`) cuyo `addedAt` cae dentro de las últimas 48hs. `addedAt` se guarda como string `toLocaleDateString('es-AR')` (`DD/MM/YYYY`), sin hora.
3. **Vencimientos próximos** — miembros con `status === 'active'` cuyo `expiry` (mismo formato `DD/MM/YYYY`) cae dentro de los próximos 3 días (desde hoy hasta +3 días; vencidos se ignoran para esta notificación).

Fuera de alcance: notificaciones push/sonido, persistencia de leído/no-leído, nuevas colecciones Firestore, notificaciones de clientes individuales (no grupales).

## Diseño

### UI

- Botón 🔔 en `#main-nav`, entre `nav-tabs` y el botón de tema, con badge numérico (círculo rojo) si `notifications.length > 0`. Oculto si es 0.
- Click en 🔔 despliega/oculta un panel `<div id="notif-panel">` (dropdown posicionado bajo el botón), listando las notificaciones agrupadas por tipo con ícono, texto corto y fecha/dato relevante.
- Click en un ítem del panel: cierra el panel y navega con `showView()` a la pestaña correspondiente (`solicitudes` para anamnesis, `planes` para alumnos nuevos/vencimientos).
- Click fuera del panel lo cierra (listener en `document`).
- Si no hay notificaciones, el panel muestra un estado vacío ("Sin novedades").

### Lógica

- Función `buildNotifications()`:
  - Recorre el array `solicitudes` (ya cargado en memoria por `loadSolicitudes()`) y filtra pendientes.
  - Recorre el array de `planes` (ya cargado en memoria) y sus `members[]`, parseando `addedAt`/`expiry` con un helper `parseARDate(str)` (`DD/MM/YYYY` → `Date`).
  - Devuelve un array unificado de objetos `{tipo, texto, fecha, targetView}`, ordenado por urgencia (vencimientos primero, luego anamnesis, luego alumnos nuevos).
  - Actualiza el badge (`#notif-badge`) con `notifications.length` y re-renderiza el panel si está abierto.
- Se llama a `buildNotifications()`:
  - Al final de `init()`, después de cargar `planes` y `solicitudes`.
  - Al final de `loadSolicitudes()`.
  - Al final de la carga de `planes` (donde se hace `getDocsSafe(collection(db,'planes'))`, línea ~2644).

### Manejo de fechas

`parseARDate('DD/MM/YYYY')` → `new Date(year, month-1, day)`. Comparaciones por diferencia de días con `Date.now()` normalizado a medianoche, evitando falsos negativos por horas.

### Testing

- Verificación manual en el navegador (no hay test suite en este proyecto):
  1. Con una `solicitud` pendiente en Firestore → aparece en el panel y el badge suma 1.
  2. Agregar un alumno a un plan → aparece como "alumno nuevo" durante 48hs.
  3. Editar el `expiry` de un miembro a "mañana" → aparece como vencimiento próximo.
  4. Sin datos pendientes → badge oculto, panel dice "Sin novedades".
  5. Click en cada tipo de ítem navega a la pestaña correcta.

## Fuera de alcance / decisiones explícitas

- No se persiste estado leído/no-leído: las notificaciones desaparecen solas cuando se resuelve la condición subyacente (se marca la solicitud como vista, pasan las 48hs, o se renueva/vence el plan).
- No se tocan `firestore.rules` ni se crean colecciones nuevas.
