# Historial global de máximos por ejercicio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el alumno (y el entrenador) vean el peso máximo y el último registro de cada ejercicio, aunque ese ejercicio aparezca en un plan nuevo distinto del que se usó para registrarlo, más una nota manual opcional que el entrenador puede dejarle a un alumno puntual sobre un ejercicio puntual.

**Architecture:** Colección Firestore nueva `exHistory/{personKey}` (personKey = nombre+email normalizados), independiente de `clients`/`subscribers`/`planes`. Se escribe automáticamente cada vez que se guarda un peso (`logGym`, en sus tres variantes: cliente normal, alumna de suscripción/Desafío, miembro de plan grupal) y se lee con cache en memoria + carga perezosa para pintar un renglón de "🏆 Máx / Último" y una nota opcional debajo del nombre de cada ejercicio, en las tres vistas (admin, alumno propio, alumno de grupo).

**Tech Stack:** Vanilla JS embebido en `index.html` (sin build, sin bundler), Firebase Firestore (modular SDK ya importado en el archivo), Firebase Hosting.

**Todo el trabajo es en un único archivo:** `index.html`, más `firestore.rules`. No hay test runner en este proyecto (no hay `package.json`) — la verificación de cada paso es manual: abrir `index.html` en el navegador (o `firebase serve`/`firebase deploy` si hace falta probar reglas), usar la consola de devtools para llamar funciones con datos de prueba, y recorrer el flujo real en la UI.

## Global Constraints

- Español en todo texto visible al usuario (toasts, labels, prompts) — coherente con el resto de la app.
- No agregar dependencias nuevas ni build step.
- No tocar el comportamiento actual de `progress` por plan (logs, `deleteLog`, tabla de series) — esto se suma.
- Seguir el estilo del archivo: funciones sueltas, `window.fn=` para lo invocado desde `onclick`, sin frameworks.
- Cada commit debe dejar `index.html` cargando sin errores de sintaxis (verificar abriendo el archivo y mirando la consola del navegador antes de cada commit).

---

### Task 1: Helpers de identidad y cache de `exHistory` + reglas de Firestore

**Files:**
- Modify: `index.html:1853` (junto a `norm()`, agregar helpers nuevos)
- Modify: `firestore.rules` (agregar regla para `exHistory`)

**Interfaces:**
- Produce: `exPersonKey(name, email)` → string. Usada por Task 2, 3 y 4.
- Produce: `exHistoryCache` (objeto global `{[personKey]: {ex:{...}}}`). Leída por Task 3 y 4.
- Produce: `ensureExHistory(personKey, onLoaded)` → Promise, resuelve y cachea el doc; llama `onLoaded()` si se pasó. Usada por Task 3.
- Produce: `recordExMax(personKey, exName, weight, reps)` → Promise, actualiza `max`/`last` en Firestore y en `exHistoryCache`. Usada por Task 2.
- Produce: `saveExNote(personKey, exName, note)` → Promise, actualiza `note` en Firestore y en `exHistoryCache`. Usada por Task 4.
- Consume: `norm(s)` ya existente en `index.html:1853`. `db`, `doc`, `getDoc`, `setDoc` ya importados/inicializados (usados en el resto del archivo, ej. `index.html:3963`).

- [ ] **Step 1: Agregar regla de Firestore para `exHistory`**

En `firestore.rules`, antes del cierre final (`}` que cierra `service cloud.firestore { match /databases/... }`), agregar junto a las otras `match`:

```
    // Historial global de máximos/últimos por ejercicio, por persona
    // (personKey = nombre+email normalizados, no por uid: la misma persona
    // puede existir en clients, subscribers o un plan grupal con ids
    // distintos — ver docs/superpowers/specs/2026-08-11-historial-maximos-ejercicio-design.md).
    // Dato de baja sensibilidad (pesos/repeticiones), por eso cualquier
    // request autenticado puede leer y escribir, no solo el dueño.
    match /exHistory/{personKey} {
      allow read, write: if isAdmin() || request.auth != null;
    }
```

- [ ] **Step 2: Deployar solo las reglas para verificar que compilan**

Run: `firebase deploy --only firestore:rules`
Expected: termina sin errores ("Deploy complete!").

- [ ] **Step 3: Agregar `exPersonKey` junto a `norm()`**

En `index.html`, inmediatamente después de la línea de `norm()` (`index.html:1853`):

```js
function exPersonKey(name,email){return((name||'')+'|'+(email||'')).toLowerCase().trim()}
```

- [ ] **Step 4: Agregar el cache y `ensureExHistory`**

Justo debajo de `exPersonKey`:

```js
let exHistoryCache={};
async function ensureExHistory(personKey,onLoaded){
  if(exHistoryCache[personKey])return exHistoryCache[personKey];
  let data={ex:{}};
  try{
    const snap=await getDoc(doc(db,'exHistory',personKey));
    if(snap.exists())data=snap.data();
  }catch(e){/* sin conexión: se muestra sin historial, no bloquea */}
  exHistoryCache[personKey]=data;
  if(onLoaded)onLoaded();
  return data;
}
```

- [ ] **Step 5: Agregar `recordExMax` y `saveExNote`**

```js
async function recordExMax(personKey,exName,weight,reps){
  const w=parseFloat(weight);
  if(!w||w<=0)return; // sin peso no hay máximo que registrar
  const key=norm(exName).trim();
  const cur=exHistoryCache[personKey]||{ex:{}};
  const prevMax=cur.ex?.[key]?.max;
  const today=new Date().toLocaleDateString('es-AR');
  const entry={weight:w,reps:reps||'',date:today};
  const update={};
  update.last=entry;
  if(!prevMax||w>prevMax.weight)update.max=entry;
  if(!cur.ex)cur.ex={};
  cur.ex[key]={...cur.ex[key],...update};
  exHistoryCache[personKey]=cur;
  await setDoc(doc(db,'exHistory',personKey),{ex:{[key]:update}},{merge:true});
}
async function saveExNote(personKey,exName,note){
  const key=norm(exName).trim();
  const cur=exHistoryCache[personKey]||{ex:{}};
  if(!cur.ex)cur.ex={};
  cur.ex[key]={...cur.ex[key],note};
  exHistoryCache[personKey]=cur;
  await setDoc(doc(db,'exHistory',personKey),{ex:{[key]:{note}}},{merge:true});
}
```

- [ ] **Step 6: Verificar en consola del navegador**

Abrir la app logueado como admin, abrir devtools console y correr:

```js
await recordExMax('test|test@test.com','Sentadilla',40,10);
await recordExMax('test|test@test.com','Sentadilla',35,8);
await recordExMax('test|test@test.com','Sentadilla',45,6);
console.log(exHistoryCache['test|test@test.com']);
```

Expected: `ex.sentadilla.max` queda en `{weight:45,reps:6,date:...}` (el mayor de los tres), `ex.sentadilla.last` queda en `{weight:45,reps:6,date:...}` (el último llamado). Recargar la página, correr `await ensureExHistory('test|test@test.com')` y confirmar que trae los mismos datos desde Firestore (persistieron).

- [ ] **Step 7: Commit**

```bash
git add index.html firestore.rules
git commit -m "Agregar helpers y reglas para historial global de maximos por ejercicio

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Captura automática al guardar peso (las tres variantes de `logGym`)

**Files:**
- Modify: `index.html:3788` (onclick del botón de guardar en `renderFuncBlock`)
- Modify: `index.html:3855` (onclick del botón de guardar en `renderGymBlock`)
- Modify: `index.html:4002-4022` (`window.logGym` original, cliente normal)
- Modify: `index.html:6133-6194` (override de `window.logGym`, ramas `alu-` y `grp::`)

**Interfaces:**
- Consume: `exPersonKey`, `recordExMax` de Task 1.
- Produce: `logGym(cId, ekey, exName)` — firma nueva con tercer parámetro `exName`. Los call sites deben pasarlo.

- [ ] **Step 1: Agregar `exName` a los dos call sites de `logGym` en los templates**

En `index.html:3788` (dentro de `renderFuncBlock`, variable `ex` ya disponible en ese scope):

```html
<!-- antes -->
<button class="btn bgr sm" onclick="logGym('${c.id}','${ekey}')">✓</button>
<!-- después -->
<button class="btn bgr sm" onclick="logGym('${c.id}','${ekey}','${ex.name.replace(/'/g,"\\'")}')">✓</button>
```

En `index.html:3855` (dentro de `renderGymBlock`, variable `activeEx` es el ejercicio activo — usar ese nombre, no `ex.name`, para que el máximo se registre bajo la variante que efectivamente se hizo):

```html
<!-- antes -->
<button class="btn bgr sm" onclick="logGym('${c.id}','${ekey}')">✓ Guardar pesos</button>
<!-- después -->
<button class="btn bgr sm" onclick="logGym('${c.id}','${ekey}','${activeEx.name.replace(/'/g,"\\'")}')">✓ Guardar pesos</button>
```

- [ ] **Step 2: Actualizar la firma de `window.logGym` original (cliente normal)**

En `index.html:4002`, cambiar:

```js
// antes
window.logGym=async function(cId,ekey){
  const c=clients.find(cl=>cl.id===cId);
```

```js
// después
window.logGym=async function(cId,ekey,exName){
  const c=clients.find(cl=>cl.id===cId);
```

Y después de la línea `await updateDoc(doc(db,'clients',cId),{progress:c.progress});` (`index.html:4016`), antes de limpiar los inputs, agregar:

```js
  if(exName)recordExMax(exPersonKey(c.name,c.email||''),exName,singleW||weights.filter(w=>w).slice(-1)[0]||'',r);
```

- [ ] **Step 3: Actualizar la rama `alu-` del override de `logGym`**

En `index.html:6133`, cambiar la firma:

```js
// antes
window.logGym=async function(cId,ekey){
  if(cId.startsWith('alu-')){
```

```js
// después
window.logGym=async function(cId,ekey,exName){
  if(cId.startsWith('alu-')){
```

Después de `await persistAlumnoProgress();` dentro de esa rama (`index.html:6150`), agregar:

```js
    if(exName)recordExMax(exPersonKey(alumnoState.sub.name,alumnoState.sub.email||''),exName,singleW||weights.filter(w=>w).slice(-1)[0]||'',r);
```

- [ ] **Step 4: Actualizar la rama `grp::` del override de `logGym`**

Después de `await setDoc(doc(db,'planes',planId,'progreso',memberId),{progress:member.progress});` en esa rama (`index.html:6185`), agregar:

```js
    if(exName)recordExMax(exPersonKey(member.name,member.email||''),exName,singleW||weights.filter(w=>w).slice(-1)[0]||'',r);
```

Y asegurarse de que la llamada final a `origLogGym(cId,ekey);` (`index.html:6193`, fallback si `cId` no matchea ningún prefijo) pase también `exName`:

```js
  origLogGym(cId,ekey,exName);
```

- [ ] **Step 5: Verificar manualmente en la UI**

Como admin: abrir la ficha de un cliente con un ejercicio con peso, cargar un peso y guardar. En devtools, correr `exHistoryCache[exPersonKey(c.name,c.email||'')]` (con el cliente real) y confirmar que aparece la entrada con `max`/`last` actualizados. Repetir logueado como alumno de suscripción y como miembro de un plan grupal (si hay uno de prueba), confirmando que cada rama actualiza el mismo tipo de dato sin romper el guardado del log de siempre (que sigue viéndose en la lista de "Últimos registros" como antes).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Registrar automaticamente el maximo/ultimo peso al guardar en logGym

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Mostrar el renglón de máximo/último y precargar el cache en las tres vistas

**Files:**
- Modify: `index.html:3681` (`renderDay`, vista admin)
- Modify: `index.html:6033` (`renderGroupDay`)
- Modify: `index.html:6433` (`renderAlumnoDay`)
- Modify: `index.html:3779-3792` (`renderFuncBlock`, agregar renglón)
- Modify: `index.html:3832-3835` (`renderGymBlock`, agregar renglón)

**Interfaces:**
- Consume: `exPersonKey`, `exHistoryCache`, `ensureExHistory` de Task 1.
- Produce: `exHistoryRowHtml(personKey, exName)` → string HTML del renglón (o `''`). Usada dentro de `renderFuncBlock`/`renderGymBlock`.

- [ ] **Step 1: Agregar el helper de render del renglón**

Cerca de `exPersonKey` (Task 1), agregar:

```js
function exHistoryRowHtml(personKey,exName){
  const h=exHistoryCache[personKey];
  if(!h)return'';
  const e=h.ex?.[norm(exName).trim()];
  if(!e)return'';
  const parts=[];
  if(e.max)parts.push(`🏆 Máx: ${e.max.weight}kg${e.max.reps?' × '+e.max.reps:''}`);
  if(e.last)parts.push(`Último: ${e.last.weight}kg${e.last.reps?' × '+e.last.reps:''} (${e.last.date})`);
  let html='';
  if(parts.length)html+=`<div style="font-size:.76rem;color:var(--ac2);font-weight:700;margin:2px 0 4px">${parts.join(' · ')}</div>`;
  if(e.note)html+=`<div style="font-size:.76rem;color:var(--mu);font-style:italic;margin-bottom:4px">📝 ${e.note}</div>`;
  return html;
}
```

- [ ] **Step 2: Precargar el cache al entrar a cada vista**

En `index.html:3681`, al inicio de `renderDay(clientId,dIdx)` (antes de cualquier otra cosa que use `c`):

```js
function renderDay(clientId,dIdx){
  const c=clients.find(cl=>cl.id===clientId);
  if(c){
    const pk=exPersonKey(c.name,c.email||'');
    if(!exHistoryCache[pk])ensureExHistory(pk,()=>renderDay(clientId,dIdx));
  }
  // ... resto de la función sin cambios
```

En `index.html:6033`, al inicio de `renderGroupDay(plan,member,dIdx)`:

```js
function renderGroupDay(plan,member,dIdx){
  const pk=exPersonKey(member.name,member.email||'');
  if(!exHistoryCache[pk])ensureExHistory(pk,()=>renderGroupDay(plan,member,dIdx));
  // ... resto de la función sin cambios
```

En `index.html:6433`, al inicio de `renderAlumnoDay(plan,member,dIdx,uid)`:

```js
function renderAlumnoDay(plan,member,dIdx,uid){
  const pk=exPersonKey(member.name,member.email||'');
  if(!exHistoryCache[pk])ensureExHistory(pk,()=>renderAlumnoDay(plan,member,dIdx,uid));
  // ... resto de la función sin cambios
```

- [ ] **Step 3: Insertar el renglón en `renderFuncBlock`**

En `index.html:3779-3781`, después de la línea del nombre del ejercicio y antes de `${vidHtml}`:

```js
      inner+=`<div class="cv-ex">
        <div class="cv-ex-name">${ex.name}${ex.reps?' <span style="color:var(--ac2);font-size:.78rem">× '+ex.reps+'</span>':''}</div>
        ${exHistoryRowHtml(exPersonKey(c.name,c.email||''),ex.name)}
        ${vidHtml}
```

- [ ] **Step 4: Insertar el renglón en `renderGymBlock`**

En `index.html:3832-3835`, después de la línea del nombre del ejercicio activo y antes de `${variantChips}`. Notar que `renderGymBlock` no tiene `c.email` garantizado como los otros — usa el mismo patrón `c.name`/`c.email||''` que ya usa el resto del bloque:

```js
    inner+=`<div class="cv-ex">
      <div class="cv-ex-name">${activeEx.name}${activeEx.video?` <a href="${activeEx.video}" target="_blank" style="font-size:.7rem;color:var(--ac2);text-decoration:none">▶</a>`:''}</div>
      ${exHistoryRowHtml(exPersonKey(c.name,c.email||''),activeEx.name)}
      ${variantChips}
      ${ex.obs?`<div class="cv-obs">📝 ${ex.obs}</div>`:''}`;
```

- [ ] **Step 5: Adaptar `renderGymBlock`/`renderFuncBlock` para las vistas de alumno/grupo**

`renderGymBlock` y `renderFuncBlock` reciben `c` como primer parámetro en la vista admin. Si las vistas de alumno (`renderAlumnoDay`) y grupo (`renderGroupDay`) arman su HTML con las mismas funciones pasando `member` en el lugar de `c` (confirmar mirando cómo `renderAlumnoDay`/`renderGroupDay` arman los bloques de cada día — deben usar `member.name`/`member.email` de la misma forma), el `exPersonKey(c.name,c.email||'')` de los Steps 3-4 ya cubre los tres casos sin cambios adicionales, porque `member` trae `name`/`email` con las mismas keys. Verificar esto leyendo `renderAlumnoDay`/`renderGroupDay` antes de dar este paso por terminado; si en cambio arman el HTML de los ejercicios con lógica propia (no reusan `renderGymBlock`/`renderFuncBlock`), replicar los Steps 3-4 en esa lógica propia con `member.name`/`member.email` en vez de `c.name`/`c.email`.

- [ ] **Step 6: Verificar manualmente**

Repetir el Step 6 de Task 2 (cargar un peso y guardar) y confirmar visualmente que, al re-renderizar el día, aparece el renglón "🏆 Máx / Último" debajo del nombre del ejercicio, en las tres vistas (admin, alumno propio, grupo). Crear un plan nuevo con el mismo ejercicio para ese mismo alumno y confirmar que el renglón sigue apareciendo (esto es lo que valida el fix del bug original).

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "Mostrar renglon de maximo/ultimo del historial global en la ficha del ejercicio

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Nota manual del entrenador

**Files:**
- Modify: `index.html:3832-3835` (`renderGymBlock`)
- Modify: `index.html:3779-3781` (`renderFuncBlock`)

**Interfaces:**
- Consume: `exPersonKey`, `saveExNote` de Task 1, `exHistoryRowHtml` de Task 3.
- Produce: `window.editExNote(personKey, exName, dIdx)` — invocado desde `onclick`, pide el texto y guarda.

- [ ] **Step 1: Agregar `window.editExNote`**

Cerca de `saveExNote` (Task 1):

```js
window.editExNote=async function(personKey,exName,dIdx){
  const cur=exHistoryCache[personKey]?.ex?.[norm(exName).trim()]?.note||'';
  const txt=prompt('Nota para este alumno sobre "'+exName+'":',cur);
  if(txt===null)return; // canceló
  await saveExNote(personKey,exName,txt.trim());
  toast('📝 Nota guardada');
  if(typeof isClientMode!=='undefined'&&editingId)renderDay(editingId,dIdx);
};
```

- [ ] **Step 2: Agregar el botón "📝" solo en la vista admin, en `renderGymBlock`**

En `index.html:3832-3835`, junto al renglón de historial agregado en Task 3 (solo se agrega en `renderGymBlock`/`renderFuncBlock` cuando se renderizan para `renderCV`/`renderDay` — es decir, cuando `c` viene de la lista `clients`, no de `member`. Usar el mismo patrón condicional que ya usa el archivo para distinguir vista admin de vista alumno, si existe una variable de contexto; si no existe, agregar un parámetro `isAdminView` a `renderGymBlock`/`renderFuncBlock` que Task 3 setea `true` solo al llamarlas desde `renderDay`):

```js
      ${exHistoryRowHtml(exPersonKey(c.name,c.email||''),activeEx.name)}
      ${isAdminView?`<button type="button" onclick="editExNote('${exPersonKey(c.name,c.email||'')}','${activeEx.name.replace(/'/g,"\\'")}',${/* dIdx disponible en el scope de renderDay, pasar como parámetro adicional a renderGymBlock si no lo está ya */0})" style="background:none;border:none;color:var(--mu);cursor:pointer;font-size:.72rem;padding:0 0 4px">✏️ nota</button>`:''}
```

Repetir el mismo patrón en `renderFuncBlock` con `ex.name` en vez de `activeEx.name`.

Nota para quien implemente: el `dIdx` (índice del día) hace falta para poder re-renderizar después de guardar la nota — revisar la firma actual de `renderGymBlock(c,bkey,blk,bi)`/`renderFuncBlock(c,bkey,blk,bi)` y de quien las llama (buscar `renderGymBlock(` y `renderFuncBlock(` en `index.html`) para confirmar si `dIdx` ya está disponible en ese scope o si hay que agregarlo como parámetro extra, propagándolo desde el llamador.

- [ ] **Step 3: Verificar manualmente**

Como admin, en la ficha de un cliente, clickear "✏️ nota" en un ejercicio, escribir un texto, guardar. Confirmar que aparece "📝 [texto]" debajo del nombre del ejercicio. Recargar la página y confirmar que persiste. Loguearse como ese alumno (si es de suscripción) o abrir la vista de alumno correspondiente y confirmar que la nota se ve ahí también, mientras que el botón "✏️ nota" NO aparece en esa vista.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Agregar nota manual del entrenador por alumno y ejercicio

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Recorrido final end-to-end

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Deploy a un entorno de prueba (o local con `firebase serve`) y recorrer el checklist del spec**

Del spec (`docs/superpowers/specs/2026-08-11-historial-maximos-ejercicio-design.md`, sección Testing):

1. Registrar un peso en un ejercicio, crear un plan nuevo con el mismo ejercicio (mismo nombre normalizado) y verificar que el renglón de máximo/último se siga mostrando.
2. Registrar un peso menor al máximo guardado y verificar que `max` no cambia, pero `last` sí.
3. Registrar un peso mayor al máximo guardado y verificar que `max` se actualiza.
4. Poner una nota manual en un ejercicio sin registros previos y verificar que aparece en el plan del alumno sin romper nada.
5. Ejercicio de tiempo/cardio: verificar que no aparece `max`/`last` pero sí la nota si se cargó una.
6. Confirmar que un alumno de plan grupal (`grp::`) y una alumna de suscripción/Desafío (`alu-`) también generan y ven su propio historial.

- [ ] **Step 2: Deploy real**

Run: `firebase deploy --only hosting,firestore:rules`

(Recordar: `git push` no actualiza `angelmeier-fit.web.app` — hace falta este deploy explícito.)

- [ ] **Step 3: Commit final si hubo ajustes durante la verificación**

```bash
git add -A
git commit -m "Ajustes tras verificacion end-to-end del historial de maximos

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
