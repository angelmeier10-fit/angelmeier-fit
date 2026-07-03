# Campanita de notificaciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bell-icon notification center to the trainer's nav in `index.html`, surfacing pending anamnesis requests, recently added students, and upcoming plan expirations — computed on the fly from data already loaded in memory.

**Architecture:** All logic lives in `index.html` (the app is a single-file SPA, no build step, no test runner). A `buildNotifications()` function derives an in-memory `notifications` array from the existing `solicitudes` and `planes` globals; a small set of render/toggle functions keep a badge and dropdown panel in sync. No new Firestore collections, no new fields, no new files.

**Tech Stack:** Vanilla JS, Firebase v10 modular SDK (already imported in `index.html`), inline CSS using existing `--ac2`/`--rd`/`--s1`/`--bd` custom properties.

## Global Constraints

- Single file `index.html` only — no new files, no build step (spec: "Fuera de alcance ... nuevas colecciones Firestore").
- No `firestore.rules` changes (spec: "No se tocan firestore.rules").
- No leído/no-leído persistence — notifications are recomputed from live data each time (spec: "No se persiste estado leído/no-leído").
- `member.addedAt` format: `DD/MM/YYYY` (`toLocaleDateString('es-AR')`, set in `addMember()` at `index.html:2892`).
- `member.expiry` format: ISO `YYYY-MM-DD` (`toISOString().split('T')[0]`, set in `addMember()` at `index.html:2903` and `renewMember()` at `index.html:2935`) — **note this differs from the spec's stated format; the spec's `DD/MM/YYYY` claim for `expiry` was wrong, this plan uses the actual ISO format.**
- This project has **no automated test suite** (no package.json test runner, no jest/mocha config). Verification steps in this plan are manual: open `index.html` in a browser, log in, and use DevTools console + visual inspection. Every task still ends with an explicit, checkable verification step.

---

## File Structure

Single file touched:
- Modify: `index.html`
  - CSS: add `.notif-item` hover style near existing `.badge` rules (~line 62).
  - HTML: add bell button + panel markup inside `#main-nav` (~line 346-362).
  - JS: add `notifications` state, `parseARDate()`, `buildNotifications()`, `renderNotifBadge()`, `renderNotifPanel()`, `toggleNotifPanel()`, `goToNotification()`, and a document-level click-outside listener, placed near the existing `solicitudes` section (~line 3580, before `loadSolicitudes()`).
  - JS: add `buildNotifications()` calls at the end of `init()` (~line 1060), `loadSolicitudes()` (~line 3593), `loadPlanes()` (~line 2646), `addMember()` (~line 2917), `renewMember()` (~line 2938), `removeMember()` (~line 2957).

---

### Task 1: Notification data logic (`buildNotifications`)

**Files:**
- Modify: `index.html` — insert new code block immediately before `let solicitudes=[];` at line 3580.

**Interfaces:**
- Consumes: global `solicitudes` array (`{status?, estado?, nombre?, name?}` per doc), global `planes` array (`{id, name, members:[{id,name,status,expiry,addedAt}]}`) — both already populated elsewhere in the file.
- Produces: global `notifications` array of `{tipo, texto, fecha, targetView, order}` objects, sorted `order` ascending (0=vencimiento, 1=anamnesis, 2=alumno). Function name `buildNotifications()`, callable with no arguments, returns the array and also assigns it to the global. Later tasks call `buildNotifications()` and read `notifications`.

- [ ] **Step 1: Add the state variable and helper functions**

Insert this block directly above line 3580 (`let solicitudes=[];`):

```javascript
// ══ NOTIFICATIONS ══
let notifications=[];

function parseARDate(str){
  if(!str)return null;
  const parts=str.split('/');
  if(parts.length!==3)return null;
  const d=Number(parts[0]),m=Number(parts[1]),y=Number(parts[2]);
  if(!d||!m||!y)return null;
  return new Date(y,m-1,d);
}

function buildNotifications(){
  const notifs=[];
  const today=new Date();today.setHours(0,0,0,0);

  // Vencimientos próximos (hoy hasta +3 días)
  planes.forEach(plan=>{
    (plan.members||[]).forEach(m=>{
      if(m.status!=='active'||!m.expiry)return;
      const exp=new Date(m.expiry+'T00:00:00');
      const diff=Math.round((exp-today)/86400000);
      if(diff>=0&&diff<=3){
        const label=diff===0?'vence hoy':diff===1?'vence mañana':`vence en ${diff} días`;
        notifs.push({tipo:'vencimiento',texto:`⏰ ${m.name} (${plan.name}) ${label}`,fecha:exp,targetView:'planes',order:0});
      }
    });
  });

  // Anamnesis pendientes
  solicitudes.forEach(s=>{
    const pendiente=(!s.status&&!s.estado)||s.status==='pendiente'||s.estado==='pendiente';
    if(pendiente){
      notifs.push({tipo:'anamnesis',texto:`📬 Nueva anamnesis: ${s.nombre||s.name||'Sin nombre'}`,fecha:null,targetView:'solicitudes',order:1});
    }
  });

  // Alumnos nuevos (últimas 48hs, granularidad de día ya que addedAt no tiene hora)
  planes.forEach(plan=>{
    (plan.members||[]).forEach(m=>{
      const added=parseARDate(m.addedAt);
      if(!added)return;
      const diffDays=Math.round((today-added)/86400000);
      if(diffDays>=0&&diffDays<=2){
        notifs.push({tipo:'alumno',texto:`🏋️ Nuevo alumno: ${m.name} en "${plan.name}"`,fecha:added,targetView:'planes',order:2});
      }
    });
  });

  notifs.sort((a,b)=>a.order-b.order);
  notifications=notifs;
  if(typeof renderNotifBadge==='function')renderNotifBadge();
  if(typeof notifPanelOpen!=='undefined'&&notifPanelOpen&&typeof renderNotifPanel==='function')renderNotifPanel();
  return notifs;
}
window.buildNotifications=buildNotifications;
```

- [ ] **Step 2: Verify in browser console**

Open the app in a browser (e.g. `npx serve .` from the project root, or open `index.html` directly), log in, then in DevTools console run:

```javascript
planes=[{id:'p1',name:'Plan Test',members:[
  {id:'m1',name:'Vence Hoy',status:'active',expiry:new Date().toISOString().split('T')[0],addedAt:'01/01/2020'},
  {id:'m2',name:'Recién Agregado',status:'active',expiry:'2099-01-01',addedAt:new Date().toLocaleDateString('es-AR')}
]}];
solicitudes=[{_docId:'s1',nombre:'Juan Pendiente',estado:'pendiente'}];
console.log(buildNotifications());
```

Expected: an array of 3 objects — one `tipo:'vencimiento'` for "Vence Hoy", one `tipo:'anamnesis'` for "Juan Pendiente", one `tipo:'alumno'` for "Recién Agregado" — in that order.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add buildNotifications() data logic for notification bell"
```

---

### Task 2: Bell button + panel markup and styles

**Files:**
- Modify: `index.html` — CSS near line 62, HTML inside `#main-nav` (line 346-362).

**Interfaces:**
- Consumes: nothing new (pure markup/CSS).
- Produces: DOM elements `#notif-bell-btn`, `#notif-badge`, `#notif-panel` that Task 3's render functions target by these exact ids.

- [ ] **Step 1: Add badge/item CSS**

Insert after the existing `.badge{...}` rule at line 62:

```css
.notif-item{padding:10px 14px;border-bottom:1px solid var(--bd);cursor:pointer;font-size:.82rem;line-height:1.4}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:var(--s2)}
```

- [ ] **Step 2: Add the bell button and panel to the nav**

Replace lines 346-362 (the full `<nav id="main-nav">...</nav>` block) with:

```html
<nav id="main-nav">
  <div>
    <div class="nav-logo">💪 Angel Meier</div>
    <div class="nav-sub">angelmasaje.fit</div>
  </div>
  <div class="nav-tabs">
    <button class="tab-btn active" onclick="showView('trainer',this)">🏋️ Entrenador</button>
    <button class="tab-btn" onclick="showView('client',this)">👤 Cliente</button>
    <button class="tab-btn" onclick="showView('exdb',this)">📚 Ejercicios</button>
    <button class="tab-btn" onclick="showView('tracking',this)">📊 Seguimiento</button>
    <button class="tab-btn" onclick="showView('planes',this)">👥 Planes Grupales</button>
    <button class="tab-btn" onclick="showView('solicitudes',this)" id="tab-solicitudes">📬 Solicitudes</button>

  </div>
  <div style="position:relative;flex-shrink:0">
    <button id="notif-bell-btn" onclick="toggleNotifPanel()" style="background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:9px;padding:6px 12px;cursor:pointer;font-size:1rem;transition:all .2s;position:relative" title="Notificaciones">
      🔔<span id="notif-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:var(--rd);color:#fff;border-radius:50%;min-width:16px;height:16px;font-size:.62rem;font-weight:700;align-items:center;justify-content:center;padding:0 3px;line-height:1"></span>
    </button>
    <div id="notif-panel" style="display:none;position:absolute;top:calc(100% + 6px);right:0;width:280px;max-height:360px;overflow-y:auto;background:var(--s1);border:1px solid var(--bd);border-radius:var(--ra);box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:100"></div>
  </div>
  <button id="theme-btn" onclick="toggleTheme()" style="background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:9px;padding:6px 12px;cursor:pointer;font-size:1rem;transition:all .2s;flex-shrink:0" title="Cambiar tema">🌙</button>
  <button onclick="doLogout()" style="background:var(--s2);border:1px solid var(--bd);color:var(--tx);border-radius:9px;padding:6px 12px;cursor:pointer;font-size:.85rem;transition:all .2s;flex-shrink:0" title="Cerrar sesión">🚪 Salir</button>
</nav>
```

- [ ] **Step 2: Verify visually**

Open the app in a browser, log in. Confirm: a 🔔 button appears in the nav between "📬 Solicitudes" and the 🌙 theme button; clicking it does nothing yet (no JS wired) but produces no console errors; no layout break in the nav row.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add notification bell button and dropdown markup to nav"
```

---

### Task 3: Render, toggle, and navigation behavior

**Files:**
- Modify: `index.html` — insert after the `buildNotifications()` block added in Task 1 (i.e. directly above `let solicitudes=[];`, so the new functions sit right after `buildNotifications` and before the `solicitudes`-related code).

**Interfaces:**
- Consumes: `notifications` array and `buildNotifications()` from Task 1; `#notif-badge`, `#notif-panel`, `#notif-bell-btn` DOM elements from Task 2; existing global `showView(v, btn)` function.
- Produces: `notifPanelOpen` boolean global, `renderNotifBadge()`, `renderNotifPanel()`, `toggleNotifPanel()` (exposed as `window.toggleNotifPanel`), `goToNotification(i)` (exposed as `window.goToNotification`). `buildNotifications()` (Task 1) already calls `renderNotifBadge()`/`renderNotifPanel()` by name, so these must be defined before `buildNotifications()` is first *called* (not before it's defined — function declarations hoist, so order in the file doesn't matter for `function` statements).

- [ ] **Step 1: Add render/toggle/navigation functions**

Insert immediately after the `window.buildNotifications=buildNotifications;` line added in Task 1:

```javascript
let notifPanelOpen=false;

function renderNotifBadge(){
  const badge=document.getElementById('notif-badge');
  if(!badge)return;
  if(notifications.length>0){
    badge.textContent=notifications.length>9?'9+':String(notifications.length);
    badge.style.display='flex';
  } else {
    badge.style.display='none';
  }
}

function renderNotifPanel(){
  const panel=document.getElementById('notif-panel');
  if(!panel)return;
  if(!notifications.length){
    panel.innerHTML='<div style="padding:20px;text-align:center;color:var(--mu);font-size:.85rem">Sin novedades</div>';
    return;
  }
  panel.innerHTML=notifications.map((n,i)=>`<div class="notif-item" onclick="goToNotification(${i})">${n.texto}</div>`).join('');
}

function toggleNotifPanel(){
  notifPanelOpen=!notifPanelOpen;
  const panel=document.getElementById('notif-panel');
  if(!panel)return;
  if(notifPanelOpen){
    renderNotifPanel();
    panel.style.display='block';
  } else {
    panel.style.display='none';
  }
}
window.toggleNotifPanel=toggleNotifPanel;

function goToNotification(i){
  const n=notifications[i];
  if(!n)return;
  toggleNotifPanel();
  const btn=document.querySelector(`.tab-btn[onclick*="showView('${n.targetView}'"]`);
  if(btn)showView(n.targetView,btn);
}
window.goToNotification=goToNotification;

document.addEventListener('click',(e)=>{
  if(!notifPanelOpen)return;
  const panel=document.getElementById('notif-panel');
  const btn=document.getElementById('notif-bell-btn');
  if(panel&&!panel.contains(e.target)&&btn&&!btn.contains(e.target)){
    toggleNotifPanel();
  }
});
```

- [ ] **Step 2: Verify in browser**

Reload the app, log in, then in DevTools console re-run the Task 1 Step 2 seed script (`planes=[...]; solicitudes=[...]; buildNotifications();`). Confirm:
1. The bell badge shows `3`.
2. Clicking the bell opens a panel with 3 rows, ordered: vencimiento, anamnesis, alumno.
3. Clicking a row closes the panel and switches to the expected tab (`planes` for vencimiento/alumno rows, `solicitudes` for the anamnesis row).
4. Clicking outside the open panel closes it.
5. After running `notifications=[];renderNotifBadge();renderNotifPanel();`, the badge disappears and re-opening the panel shows "Sin novedades".

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire notification bell rendering, toggle, and navigation"
```

---

### Task 4: Hook `buildNotifications()` into data load/mutation points

**Files:**
- Modify: `index.html` at the 6 call sites listed below.

**Interfaces:**
- Consumes: `buildNotifications()` from Task 1.
- Produces: nothing new; this task only adds call sites so the badge/panel stay accurate as data loads or changes.

- [ ] **Step 1: Call after initial data load in `init()`**

In `index.html`, find (around line 1059-1060):

```javascript
  // Load solicitudes
  await loadSolicitudes();
```

Change to:

```javascript
  // Load solicitudes
  await loadSolicitudes();
  buildNotifications();
```

- [ ] **Step 2: Call at the end of `loadSolicitudes()`**

Find (around line 3590-3593, inside `loadSolicitudes()`):

```javascript
  const tabBtn=document.getElementById('tab-solicitudes');
  if(tabBtn) tabBtn.textContent=pendientes>0?`📬 Solicitudes (${pendientes})`:'📬 Solicitudes';
}
```

Change to:

```javascript
  const tabBtn=document.getElementById('tab-solicitudes');
  if(tabBtn) tabBtn.textContent=pendientes>0?`📬 Solicitudes (${pendientes})`:'📬 Solicitudes';
  buildNotifications();
}
```

- [ ] **Step 3: Call at the end of `loadPlanes()`**

Find (around line 2643-2646):

```javascript
async function loadPlanes(){
  const snap=await getDocsSafe(collection(db,'planes'));
  planes=snap.docs.map(d=>({id:d.id,...d.data()}));
}
```

Change to:

```javascript
async function loadPlanes(){
  const snap=await getDocsSafe(collection(db,'planes'));
  planes=snap.docs.map(d=>({id:d.id,...d.data()}));
  buildNotifications();
}
```

- [ ] **Step 4: Call after `addMember()` mutates `planes` in memory**

Find (around line 2916-2917):

```javascript
  toast('✅ Alumno agregado a: '+planNames);
  renderMembersList(activePlanId);
```

Change to:

```javascript
  toast('✅ Alumno agregado a: '+planNames);
  renderMembersList(activePlanId);
  buildNotifications();
```

- [ ] **Step 5: Call after `renewMember()` mutates `planes` in memory**

Find (around line 2937-2939):

```javascript
  await setDoc(doc(db,'planes',planId),plan);
  toast('✅ Acceso renovado por '+plan.durationDays+' días');
  renderMembersList(planId);
```

Change to:

```javascript
  await setDoc(doc(db,'planes',planId),plan);
  toast('✅ Acceso renovado por '+plan.durationDays+' días');
  renderMembersList(planId);
  buildNotifications();
```

- [ ] **Step 6: Call after `removeMember()` mutates `planes` in memory**

Find (around line 2955-2957):

```javascript
  await setDoc(doc(db,'planes',planId),plan);
  toast('🗑️ Alumno eliminado');
  renderMembersList(planId);
```

Change to:

```javascript
  await setDoc(doc(db,'planes',planId),plan);
  toast('🗑️ Alumno eliminado');
  renderMembersList(planId);
  buildNotifications();
```

- [ ] **Step 7: End-to-end manual verification against real data**

Open the app in a browser, log in with real credentials.
1. If there's at least one pending solicitud in Firestore, confirm the bell badge count includes it on page load (no console seeding needed).
2. Go to "👥 Planes Grupales", add a new test member to any plan. Confirm the badge count increases by 1 immediately (no page reload) and the panel shows a "🏋️ Nuevo alumno" row for it.
3. Edit that member's plan `expiry` in Firestore console to today's date + 2 days, reload the page, confirm a "⏰ ... vence en 2 días" row appears.
4. Delete the test member via "✕" in the UI. Confirm the badge count decreases and the corresponding rows disappear without a page reload.
5. Confirm no JavaScript errors appear in the DevTools console throughout.
6. Clean up: delete any test plan/member data created for this verification from Firestore.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: refresh notification bell on data load and member changes"
```

---

## Self-Review Notes

- **Spec coverage:** anamnesis pendientes → Task 1 (`tipo:'anamnesis'`); alumnos nuevos 48hs → Task 1 (`tipo:'alumno'`, day-based 48hs); vencimientos próximos 3 días → Task 1 (`tipo:'vencimiento'`); bell + badge + dropdown UI → Task 2; click navigation + click-outside close → Task 3; recompute on load/mutation, no persistence → Task 4. All spec sections covered.
- **Correction from spec:** the design doc stated `expiry` uses `DD/MM/YYYY` like `addedAt`; verified against `addMember()`/`renewMember()` source and it's actually ISO `YYYY-MM-DD`. This plan uses the correct format and documents the discrepancy in Global Constraints.
- **Type consistency:** `notifications` array shape `{tipo, texto, fecha, targetView, order}` is identical across Task 1 (producer) and Tasks 3/4 (consumers). Function names (`buildNotifications`, `renderNotifBadge`, `renderNotifPanel`, `toggleNotifPanel`, `goToNotification`) are consistent everywhere they're referenced.
- **No placeholders:** every step has complete, runnable code and exact line anchors from the current file.
