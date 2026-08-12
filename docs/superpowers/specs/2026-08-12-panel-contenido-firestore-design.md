# Panel de contenido Instagram con Firestore

**Fecha:** 2026-08-12
**Estado:** Aprobado, pendiente de implementación

## Problema

El panel de contenido de Instagram (marca, calendario de posteos, prompts
para ChatGPT, stickers de historias, publicaciones agrupadas por tema) hoy
es un Artifact publicado en claude.ai que persiste su estado (checks
tildados, temas agregados) en `localStorage`. Los Artifacts de esta cuenta
solo tienen disponibles las capabilities `downloads` y `mcp` — no hay
capability de estado compartido/en vivo — así que `localStorage` es la
única opción de persistencia, y por eso el estado no sincroniza entre PC y
celular (cada navegador tiene su propio storage).

## Solución

Página nueva `contenido.html`, en el mismo proyecto/repo que `index.html`
(Firebase `angelmeier-fit`), reusando el mismo login admin y persistiendo
en Firestore en vez de `localStorage`. El contenido visual/estructura del
panel se migra tal cual desde el Artifact actual — no se recorta ni
reordena nada.

## Autenticación

Reusa exactamente el mismo patrón que `index.html`:
- Firebase Auth con `signInWithEmailAndPassword` y `signInWithPopup` +
  `GoogleAuthProvider` (imports ya usados en `index.html:1104`).
- `onAuthStateChanged` (patrón de `index.html:1494`) decide si mostrar el
  panel o el formulario de login.
- No hay rol "alumno" acá — cualquiera logueado ve y edita el panel
  (destino final: reglas de Firestore restringen a `isAdmin()`, ver abajo),
  así que no hace falta portar la lógica de roles/alumno de `index.html`,
  solo la de login.

## Estructura de datos

Un único documento en Firestore:

```
contentPanel/state
```

```js
{
  checks: {
    "m1": true, "m2": false, /* ...un booleano por cada checkbox existente
                                  en el panel: piezas de marca (m1-m8),
                                  prompts (p1-p5), stickers de imagen
                                  (stk-e-img, stk-m-img, stk-c-img) */
  },
  topics: [
    {
      id: "topic-<timestamp>",
      title: "Nombre del tema",
      promptText: "texto del prompt para ChatGPT",
      done: false
    }
    // ...uno por cada tema agregado en la sección "Publicaciones"
  ]
}
```

- `checks`: mapa plano `id del checkbox -> boolean`. Los ids son los mismos
  que ya usa el HTML del panel actual (`m1`..`m8`, `p1`..`p5`,
  `stk-e-img`, `stk-m-img`, `stk-c-img`, y cualquier checkbox de tema
  agregado dinámicamente).
- `topics`: array de temas agregados a mano en la sección "Publicaciones"
  (hoy viven en memoria/localStorage en el Artifact). Cada uno tiene su
  propio `done` para el estado de "hecho/pendiente" de esa publicación.
- Solo estado actual, sin historial de quién tildó qué ni cuándo (decisión
  tomada en brainstorming): cada cambio sobreescribe el campo
  correspondiente con `setDoc(...,{merge:true})`.

## Sync en vivo

En vez de leer una vez al cargar y escribir sin más, la página se
suscribe con `onSnapshot(doc(db,'contentPanel','state'), cb)` (patrón ya
usado en otras partes de `index.html` para casos de progreso en vivo). Un
cambio hecho desde el celular se refleja en la PC sin recargar, si la
tiene abierta al mismo tiempo.

Cada interacción del usuario (tildar un checkbox, agregar/borrar un tema)
dispara un `setDoc(doc(db,'contentPanel','state'),{...cambio},{merge:true})`
inmediato — no hay botón "Guardar" aparte, igual que el resto de la app.

## Reglas de Firestore

```
match /contentPanel/{docId} {
  allow read, write: if isAdmin();
}
```

Mismo criterio que `clients`/`exercises` — colección de uso exclusivo del
entrenador, sin acceso de alumnos.

## Migración de contenido

Todo el HTML/CSS del Artifact actual (secciones Marca, Calendario, Prompts,
Stickers, Publicaciones, más el nav lateral y la barra de progreso) se
copia tal cual a `contenido.html`. Lo único que cambia es:
- Los checkboxes dejan de leer/escribir `localStorage` y pasan a reflejar
  `checks[id]` desde el snapshot de Firestore, escribiendo con
  `setDoc(...,{merge:true})` en el evento `change`.
- La lista de "temas" (sección Publicaciones) deja de vivir en un array de
  JS en memoria y pasa a reflejar `topics` desde el snapshot, con
  agregar/borrar escribiendo el array completo actualizado (no hay
  operación atómica de array-append necesaria dado el volumen bajo de
  temas esperado).
- La barra de progreso general y los contadores (`count-prompts`,
  `count-topics`) se recalculan a partir del estado de Firestore en vez
  del DOM/localStorage.

## Alcance / fuera de alcance

- No se migra el Artifact existente automáticamente — si el usuario ya
  tildó cosas ahí, las vuelve a tildar en `contenido.html` (dato ya
  desactualizado entre dispositivos, no vale la pena migrar).
- No se agrega ningún control de acceso más granular que "cualquier admin
  logueado" — coherente con que hoy es una sola persona quien administra.
- No se toca `index.html` más que (opcionalmente) un link de navegación
  hacia `contenido.html`, si el usuario lo pide en la implementación.
- El Artifact publicado en claude.ai queda como está (no se borra), pero
  deja de ser la herramienta de uso diario una vez migrado.

## Testing

- Tildar un checkbox de "Marca" en un navegador, confirmar que aparece
  tildado en Firestore (consola de Firebase) y, si se recarga la página
  en otro navegador/dispositivo, aparece tildado ahí también.
- Con dos pestañas/dispositivos abiertos al mismo tiempo, tildar algo en
  uno y confirmar que el otro lo refleja sin recargar (onSnapshot).
- Agregar un tema nuevo en "Publicaciones", confirmar que persiste y se
  ve en otro dispositivo.
- Borrar un tema, confirmar que desaparece en ambos dispositivos.
- Entrar a `contenido.html` sin sesión iniciada: debe pedir login, no
  mostrar el panel.
- Recargar la página con la sesión ya iniciada: debe mostrar el estado
  actual sin parpadeos de "todo destildado" antes de que llegue el
  snapshot.
