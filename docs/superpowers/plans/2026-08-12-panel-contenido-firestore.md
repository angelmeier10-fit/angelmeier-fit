# Panel de contenido Instagram con Firestore — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el panel de contenido de Instagram (hoy un Artifact que persiste en `localStorage`, con sync manual por copy-paste) a una página `contenido.html` en el mismo proyecto que `index.html`, con login admin y estado sincronizado en vivo vía Firestore, para que funcione igual entre PC y celular.

**Architecture:** `contenido.html` nuevo, mismo Firebase project (`angelmeier-fit`) que `index.html`. Reusa el patrón de login (email/password + Google) de `index.html`. El contenido visual completo (marca, calendario, prompts, stickers, publicaciones) se copia tal cual desde el Artifact fuente. El único cambio funcional: el script de estado deja de usar `localStorage`/`TOPICS_KEY` y pasa a usar un doc único `contentPanel/state` en Firestore, con `onSnapshot` para reflejar cambios en vivo entre dispositivos. Se elimina la sección `#sync` (workaround manual, obsoleto con Firestore).

**Tech Stack:** HTML/CSS/JS vanilla (mismo estilo que `index.html`, sin build), Firebase Auth + Firestore (mismo proyecto y SDKs que `index.html`), Firebase Hosting.

**Fuente del contenido a migrar:** el HTML completo del Artifact actual está guardado en:
`C:\Users\meier\.claude\projects\C--Users-meier-OneDrive-Documentos-App-masajes-mano-a-mano-1-Entrenamiento-angelmeier-fit-main-angelmeier-fit-main\996dfe79-fb86-4da5-8c72-30efc38d66aa\tool-results\artifact-bf946d38-1785432611-5687.html`
Este archivo es la fuente de verdad para todo el HTML/CSS de contenido (secciones Marca, Calendario, Prompts, Stickers, Publicaciones) — no hay que reescribirlo a mano, se copia. Las líneas 1-9 de ese archivo son scaffolding del visor de Artifacts de Claude (el bloque `<!-- frame-runtime -->` con `window.__FRAME_PREAMBLE` y todo el script minificado antes de `<title>`) y **no se copian** — son específicas del iframe de claude.ai, no tienen sentido en una página propia servida por Firebase Hosting.

## Global Constraints

- Español en todo texto visible al usuario — coherente con el resto del proyecto.
- No agregar dependencias nuevas ni build step.
- Reusar el patrón de auth de `index.html` (mismos imports de Firebase Auth, mismo flujo de login/logout), no reinventar uno nuevo.
- No tocar `index.html` salvo, opcionalmente, agregar un link de navegación a `contenido.html` (fuera de alcance salvo pedido explícito).
- Cada commit debe dejar `contenido.html` cargando sin errores de sintaxis (abrir en navegador y revisar consola antes de cada commit).

---

### Task 1: Armar `contenido.html` — HTML/CSS migrado + login admin

**Files:**
- Create: `contenido.html`
- Consume como referencia (no modificar): `index.html:1104` (imports de Firebase Auth), `index.html:1195` (`signInWithEmailAndPassword`), `index.html:1211` (`signInWithPopup`+`GoogleAuthProvider`), `index.html:1494` (`onAuthStateChanged`)
- Consume como fuente de contenido: el archivo HTML del Artifact listado arriba en "Fuente del contenido a migrar"

**Interfaces:**
- Produce: `contenido.html` con toda la estructura visual del panel (nav lateral, barra de progreso, secciones Marca/Calendario/Prompts/Stickers/Publicaciones) y un gate de login que oculta `<main>` hasta que `onAuthStateChanged` confirme una sesión con el email admin.
- No produce todavía persistencia real (Task 2 la agrega) — en este task el estado puede quedar simplemente en memoria (sin guardar), el objetivo es la estructura y el login.

- [ ] **Step 1: Leer el archivo fuente completo**

Leer con la herramienta de archivos el HTML completo en la ruta indicada arriba en "Fuente del contenido a migrar" (2085 líneas). Identificar:
- El `<title>` y el bloque `<style>` (CSS del panel, variables de tema claro/oscuro incluidas) — empieza después del `</head>` del scaffolding de Artifacts.
- El `<nav class="rail">` con los links del sidebar.
- El `<main>` completo con las 5 secciones (`#marca`, `#calendario`, `#prompts`, `#stickers`, `#publicaciones`) y la sección `#sync` (que se excluye, ver Task 2).
- El `<footer>`.
- El bloque `<script>` final (líneas 1841-2083) — se usa como referencia para Task 2, no se copia literal en este Task 1.

- [ ] **Step 2: Crear `contenido.html` con el scaffolding de Firebase (sin scaffolding de Artifacts)**

Estructura base, siguiendo el patrón de imports/inicialización de Firebase que ya usa `index.html` (mismo `firebaseConfig`, mismo proyecto `angelmeier-fit` — buscar el bloque de `initializeApp`/`getFirestore`/`getAuth` cerca de los imports de `index.html:1104` y replicarlo tal cual, mismas credenciales):

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Angel Meier — Panel de contenido</title>
<style>
/* pegar acá TODO el <style> del archivo fuente, sin cambios */
</style>
</head>
<body>

<div id="login-gate" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px">
  <form id="login-form" style="max-width:340px;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:28px;display:flex;flex-direction:column;gap:12px">
    <h2 style="margin:0 0 8px">Panel de contenido</h2>
    <input type="email" id="login-email" placeholder="Email" required style="padding:9px 11px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--ink)">
    <input type="password" id="login-pass" placeholder="Contraseña" required style="padding:9px 11px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--ink)">
    <button type="submit" style="background:var(--accent);color:var(--accent-ink);border:none;border-radius:8px;padding:10px;font-weight:700;cursor:pointer">Entrar</button>
    <button type="button" id="login-google" style="background:none;border:1px solid var(--border);color:var(--ink);border-radius:8px;padding:10px;font-weight:600;cursor:pointer">Entrar con Google</button>
    <p id="login-error" style="color:#c0392b;font-size:0.82rem;margin:0"></p>
  </form>
</div>

<nav class="rail" id="app-rail" style="display:none">
  <!-- pegar acá el contenido de <nav class="rail"> del archivo fuente, sin cambios -->
</nav>

<main id="app-main" style="display:none">
  <!-- pegar acá el <div class="top-progress"> y las secciones #marca, #calendario,
       #prompts, #stickers, #publicaciones del archivo fuente, sin cambios.
       NO pegar la sección #sync (ver nota en Task 2). -->
</main>

<footer id="app-footer" style="display:none">Angel Meier — panel privado de contenido.</footer>

<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// pegar acá el mismo firebaseConfig que usa index.html (buscar la constante
// firebaseConfig cerca de initializeApp en index.html y copiarla tal cual —
// mismo proyecto, mismas credenciales)
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    errEl.textContent = 'No se pudo iniciar sesión. Revisá el email y la contraseña.';
  }
});

document.getElementById('login-google').addEventListener('click', async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    document.getElementById('login-error').textContent = 'No se pudo iniciar sesión con Google.';
  }
});

onAuthStateChanged(auth, (user) => {
  const gate = document.getElementById('login-gate');
  const rail = document.getElementById('app-rail');
  const main = document.getElementById('app-main');
  const footer = document.getElementById('app-footer');
  if (user) {
    gate.style.display = 'none';
    rail.style.display = '';
    main.style.display = '';
    footer.style.display = '';
    window.__contenidoReady && window.__contenidoReady(db, doc, onSnapshot, setDoc);
  } else {
    gate.style.display = 'flex';
    rail.style.display = 'none';
    main.style.display = 'none';
    footer.style.display = 'none';
  }
});
</script>

</body>
</html>
```

`window.__contenidoReady` es el gancho que Task 2 define — se llama recién cuando hay sesión, para no intentar leer/escribir Firestore antes de estar logueado (las reglas del Task 3 lo rechazarían igual, pero evita el error innecesario en consola).

- [ ] **Step 3: Pegar el CSS y el HTML de las 5 secciones**

Copiar textualmente del archivo fuente (ver Step 1):
- Todo el bloque `<style>` (variables de tema, `.rail`, `.card`, `.task`, `details.block`, `table.cal`, `.topic`, etc.) — sin cambios.
- El `<nav class="rail">` completo (con sus `<a href="#marca">`, etc.) — sin cambios, salvo quitar el `<li><a href="#sync">Sincronizar</a></li>` (la sección se elimina en Task 2, así que el link no debe quedar apuntando a nada).
- El `<div class="top-progress">` y las secciones `#marca`, `#calendario`, `#prompts`, `#stickers`, `#publicaciones` completas, tal cual — todo el contenido de piezas de marca, tabla de calendario, los 5 `details.block` de prompts, los 4 cards de stickers, y los 2 `<div class="topic">` fijos (lanzamiento de la app, TikTok "empezar acá") más el `<div id="dynamic-topics">` y el formulario `#new-topic-form`.
- **No copiar** la sección `<section id="sync">...</section>` completa (líneas ~1822-1836 del archivo fuente) ni la línea del footer que menciona "Usá Sincronizar..." — reemplazar el footer por el texto simple `Angel Meier — panel privado de contenido.` (ya en el Step 2).

- [ ] **Step 4: Verificar visualmente**

Abrir `contenido.html` en el navegador. Sin login, debe verse solo el formulario. Con credenciales de admin válidas, debe mostrarse el panel completo con el mismo aspecto visual que el Artifact (nav lateral, secciones, cards, prompts colapsables). Los checkboxes todavía no persisten nada (Task 2) — es esperable que al recargar se pierda el estado en este punto.

- [ ] **Step 5: Commit**

```bash
git add contenido.html
git commit -m "Crear contenido.html con el panel de contenido migrado y login admin

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Persistencia en Firestore con sync en vivo (reemplaza `localStorage`)

**Files:**
- Modify: `contenido.html` (agregar el script de estado, reemplazando el `<script>` de líneas 1841-2083 del archivo fuente adaptado a Firestore)

**Interfaces:**
- Consume: `db`, `doc`, `onSnapshot`, `setDoc` pasados por `window.__contenidoReady(db, doc, onSnapshot, setDoc)` desde Task 1.
- Produce: doc `contentPanel/state` en Firestore con forma `{checks: {...}, topics: [...]}` (ver spec para el detalle exacto del schema, incluyendo que cada tema dinámico genera sus propios ids de checkbox `${id}-post-chk`/`${id}-stories-chk`/`${id}-slides-chk`).

- [ ] **Step 1: Portar la lógica del archivo fuente, cambiando la persistencia**

Tomar como base el script de líneas 1841-2083 del archivo fuente (ver Task 1 para la ruta) y adaptarlo. La lógica de UI (armar el HTML de cada tema, aplicar status "Hecho"/"Pendiente", contar prompts, copiar al portapapeles) se mantiene idéntica — solo cambia de dónde sale y adónde va el estado.

Reemplazar:
```js
const STORAGE_KEY = "am-content-hub-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
```
```js
const TOPICS_KEY = "am-content-hub-topics-v1";
let topics = JSON.parse(localStorage.getItem(TOPICS_KEY) || "[]");
function saveTopics(){ localStorage.setItem(TOPICS_KEY, JSON.stringify(topics)); }
```

por (dentro de `window.__contenidoReady = function(db, doc, onSnapshot, setDoc){ ... }`, que es lo que Task 1 invoca tras el login):

```js
window.__contenidoReady = function(db, doc, onSnapshot, setDoc){
  const stateRef = doc(db, 'contentPanel', 'state');
  let state = {};
  let topics = [];
  let ready = false; // true recién cuando llegó el primer snapshot

  function saveState(){ setDoc(stateRef, { checks: state }, { merge: true }).catch(()=>{}); }
  function saveTopics(){ setDoc(stateRef, { topics }, { merge: true }).catch(()=>{}); }

  onSnapshot(stateRef, (snap) => {
    const data = snap.exists() ? snap.data() : {};
    state = data.checks || {};
    topics = data.topics || [];
    ready = true;
    applyAllChecks();
    renderTopics();
    updateCounts();
  });

  // ... resto de las funciones (applyStatus, updateCounts, copyText, bindCheckbox,
  // bindCopyBtn, blockHTML, renderTopics, el listener de new-topic-form) van
  // ACÁ ADENTRO, sin cambios de lógica salvo lo indicado en los steps
  // siguientes — porque necesitan cerrar sobre `state`/`topics`/`saveState`/
  // `saveTopics` definidos arriba, y antes de este task esas variables no
  // existían hasta que había sesión.
};
```

- [ ] **Step 2: Reescribir el binding inicial de checkboxes fijos para no depender del orden de carga**

El archivo fuente hace `document.querySelectorAll('input[type="checkbox"]').forEach(box => { if (state[box.id]) box.checked = true; ... })` una sola vez al final del `<script>`, asumiendo que `state` ya está poblado sincrónicamente desde `localStorage`. Con Firestore, `state` llega async (recién en el callback de `onSnapshot`). Extraer esa lógica a una función reusable:

```js
function applyAllChecks(){
  document.querySelectorAll('main input[type="checkbox"]').forEach(box => {
    box.checked = !!state[box.id];
    const details = box.closest('details.block');
    if (details) applyStatus(details);
    const task = box.closest('.task');
    if (task) task.classList.toggle('done', box.checked);
  });
}
```

y llamarla tanto desde el callback de `onSnapshot` (Step 1) como, una sola vez, para adjuntar los listeners de `change` (que sí se hacen una sola vez al cargar, no en cada snapshot — solo el valor `checked` se resetea en cada snapshot, no los listeners):

```js
document.querySelectorAll('main input[type="checkbox"]').forEach(box => {
  box.addEventListener('change', () => {
    state[box.id] = box.checked;
    saveState();
    const details = box.closest('details.block');
    if (details) applyStatus(details);
    const task = box.closest('.task');
    if (task) task.classList.toggle('done', box.checked);
    updateCounts();
  });
});
```

(este bloque reemplaza al `document.querySelectorAll('input[type="checkbox"]').forEach(box => {...})` original de líneas 1868-1881 del archivo fuente — mismo cuerpo del listener, solo que ya no hace `if (state[box.id]) box.checked = true` acá, porque eso ahora lo hace `applyAllChecks()` por separado).

- [ ] **Step 3: Portar `renderTopics`, `bindCheckbox`, `blockHTML`, el form de nuevo tema, y `copyText`/`bindCopyBtn` sin cambios de lógica**

Copiar tal cual del archivo fuente (líneas 1886-1926, 1928-1958, 1965-2012, 2014-2033) — estas funciones no tocan `localStorage` directamente salvo a través de `saveState`/`saveTopics`, que ya están redefinidas en el Step 1. El único cambio real es dentro del listener de `form.addEventListener('submit', ...)` (línea 2018-2033 del archivo fuente): sigue igual, solo que `saveTopics()` ahora escribe a Firestore.

- [ ] **Step 4: Eliminar la lógica de `#sync` (líneas 2037-2082 del archivo fuente)**

No portar el bloque de `syncMsg`/`flashMsg`/`sync-copy-btn`/`sync-apply-btn` — la sección HTML ya se excluyó en Task 1, así que este bloque de JS quedaría refiriéndose a elementos que no existen. Confirmar que no queda ningún `document.getElementById('sync-...')` en el `contenido.html` final.

- [ ] **Step 5: Verificar sync en vivo**

Abrir `contenido.html` en dos pestañas del mismo navegador (o dos navegadores), logueado en ambas. Tildar un checkbox en una pestaña, confirmar que la otra lo refleja tildado sin recargar (gracias a `onSnapshot`). Agregar un tema nuevo en una, confirmar que aparece en la otra. Borrar un tema, confirmar que desaparece en ambas.

- [ ] **Step 6: Commit**

```bash
git add contenido.html
git commit -m "Persistir el panel de contenido en Firestore con sync en vivo, quitar sync manual

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Reglas de Firestore + deploy + verificación cross-device

**Files:**
- Modify: `firestore.rules`

**Interfaces:**
- Ninguna nueva — cierra el ciclo de lo que Task 1 y 2 ya construyeron.

- [ ] **Step 1: Agregar la regla de Firestore**

En `firestore.rules`, junto a las otras `match` (ej. cerca de `match /clients/{clientId}`), agregar:

```
    // Panel de contenido de Instagram: uso exclusivo del entrenador.
    match /contentPanel/{docId} {
      allow read, write: if isAdmin();
    }
```

- [ ] **Step 2: Deployar reglas y hosting**

Run: `firebase deploy --only hosting,firestore:rules`
Expected: "Deploy complete!" sin errores, y `contenido.html` accesible en `https://angelmeier-fit.web.app/contenido.html`.

- [ ] **Step 3: Verificación cross-device real**

Con la app ya en producción: abrir `contenido.html` en la PC, tildar un par de checkboxes y agregar un tema de prueba. Abrir la misma URL en el celular, loguearse, confirmar que se ve exactamente el mismo estado (checks tildados, tema agregado). Borrar el tema de prueba desde el celular y confirmar que desaparece también en la PC al recargar (o en vivo, si la tenías abierta).

- [ ] **Step 4: Commit final si hubo ajustes durante la verificación**

```bash
git add -A
git commit -m "Ajustes tras verificacion cross-device del panel de contenido

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
