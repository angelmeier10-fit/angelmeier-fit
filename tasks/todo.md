# Plan: Macrociclo de Abdominales (3 mesociclos x 4 semanas) — EN CURSO

## Estructura general
- 12 semanas totales, `totalWeeks:12`, `mesoWeeks:4`.
- 3 días/semana, 20-30 min por sesión (5' entrada en calor + 15-20' bloque principal).
- Cada día tiene un rol fijo para dar variedad sin perder continuidad:
  - **Día 1 – Control/Fuerza**: bloque `gym` (series rectas, isométricos, tempo).
  - **Día 2 – Metabólico**: bloque `cf` tipo EMOM o CIRCUITO.
  - **Día 3 – Explosivo/Resistencia**: bloque `cf` tipo AMRAP o TABATA/HIIT.

## Mesociclos
1. **Semanas 1-4 (Adaptación)**: activación y control motor, volumen moderado, isométricos, RPE bajo-medio. Formatos: straight sets + circuito suave.
2. **Semanas 5-8 (Acumulación)**: sube densidad y dificultad (ejercicios dinámicos/unilaterales), aparecen EMOM y AMRAP.
3. **Semanas 9-12 (Intensificación)**: mayor intensidad, TABATA/HIIT, combinaciones, semana 12 = deload (-40% volumen).

Dentro de cada mesociclo, semana a semana sube reps/rondas/tiempo (progresión lineal), manteniendo los mismos ejercicios base la mayor parte del mesociclo para permitir progresión real, y cambiando de mesociclo para variar estímulo.

## Ejercicios a usar del banco existente (categoría Abdomen/Core)
Plancha, Plancha lateral, Abdominal superior, Abdominal inferior, Abdominal tijera, Abdominal en bicicleta, Oblícuos con mancuerna, Abdominal tipo remo, Abdominal inferior en paralelas, Press palloff en polea, Bird dog, Superman extensión lumbar, toes to bar estricto, Crunch abdominal, GHD situp, Mountain climbers.

## Ejercicios nuevos a agregar al banco (sin duplicar, video vacío para completar después)
Dead bug, Hollow hold, Hollow rocks, V-ups, Elevación de piernas colgado, Flutter kicks, Ab wheel rollout, Russian twist, Reverse crunch, Plancha con toque de hombro, Plancha lateral con rotación, Windshield wipers, Sit-up con disco.

## Implementación técnica
- Agregar botón temporal "🏗️ Cargar plan Abdominales" en Banco de Ejercicios (mismo patrón que `dedupeExercises`).
- La función:
  1. Crea (si no existen) los ejercicios nuevos en `exercises` con `cat:"Abdomen"`.
  2. Arma `weeks["1"]`..`weeks["12"]`, 3 días cada una, con bloques `gym`/`cf` según el rol del día y la progresión del mesociclo.
  3. Crea el documento en `planes` vía `setDoc(doc(db,'planes',id), plan)` con `name:"Abdominales — Macrociclo 12 semanas"`, `cat:"Abdomen"`, `totalWeeks:12`, `mesoWeeks:4`.
- Después de cargarlo, se puede sacar el botón temporal (queda como plan fijo reutilizable en la app).

## Confirmación pendiente
Esperando OK del usuario para escribir el código con esta estructura.

## Revisión
Código escrito en `index.html`: botón "🏗️ Cargar plan Abdominales" + función `seedAbsPlan()`. Falta: probar en la app (crea ejercicios nuevos + plan en Firestore), y commitear/pushear si funciona bien.

---

# Suscripción mensual de pago — MVP

## Contexto
Convertir la app de entrenamiento en producto de suscripción mensual, con mantenimiento mínimo (sin atención 1 a 1, sin generación de contenido por usuario). Planes fijos por categoría (GAP, musculación, casa sin elementos, adultos mayores). Plan personalizado queda fuera. Alumnos con cuenta propia (Firebase Auth). Cobro con MercadoPago Checkout Pro (pago único +30 días, no Preapproval). Corte de acceso en frontend + reglas de Firestore.

Plan detallado completo en: `C:\Users\meier\.claude\plans\velvety-orbiting-karp.md`

## Fuera de alcance (explícito)
Multi-tenant robusto, generación dinámica/personalizada de planes, migración a Preapproval, recordatorios automáticos de vencimiento, panel de soporte/chat, cambio de categoría self-service post-alta, roles vía custom claims.

## Estado actual (para retomar en otra sesión)
- Servidor local de prueba: `npx serve .` desde la carpeta del proyecto → http://localhost:3000 (hay que volver a correrlo cada vez, no queda corriendo entre sesiones).
- Dominio `localhost` ya autorizado en Firebase Console → Authentication → Authorized domains.
- `firestore.rules` ya está actualizado en el repo Y publicado en Firebase Console (incluye fix de la colección `meta` y saca `businessInfo`, que no existe en esta app). Login con Google como admin (`angelmeier10@gmail.com`) probado y funcionando en localhost.
- Cambios de código (`firestore.rules`, `firebase.json`, `index.html`) están en el working tree, **todavía no commiteados ni pusheados**.
- Planes existentes en Firestore: "GLÚTEOS, PIERNAS Y ABS", "Entrená en casa 🏠", "ENTRENAMIENTO SIN ELEMENTOS EN CASA". Ninguno está marcado como categoría GAP ni hay uno de adultos mayores. Angel los está terminando de armar — el mapeo en "Planes fijos" se completa cuando estén listos, no bloquea seguir con el paso 3.

## Pasos

- [x] 1. Crear `firestore.rules` (nuevo) + sección `firestore` en `firebase.json`
  - `subscribers/{uid}`: alumno lee/escribe su doc (excepto status/expiry/lastPaymentId, solo webhook)
  - `planes/{planId}`: requiere auth + `get()` verificando `subscribers/{uid}.status == 'active'` y planId coincide
  - Admin: por email de Angel (`angelmeier10@gmail.com`), no UID
  - Planes grupales existentes: siguen públicos por defecto (`public != false`); nuevo checkbox "🔒 privado" en el form de plan para marcar `public:false`
  - Probado en navegador: login Google admin funciona, lectura/escritura de clients/exercises/planes/meta OK
- [ ] 2. UI de "Planes fijos" ya está lista (pestaña 🔔 en Planes Grupales, escribe `planesFijos/{categoria}`). Falta: Angel termina de armar/completar los 4 planes (GAP, musculación, casa sin elementos, adultos mayores) y los mapea desde esa pestaña.
- [x] 3. Registro/login de alumno + selector de categoría en `index.html`
  - Entry point `?alumno=1`, reutiliza Auth existente (email/password + Google) sin tocar el login del entrenador
  - Si el email autenticado es el de Angel, redirige al panel normal
  - Selector de 5 categorías (GAP, musculación, casa sin elementos, adultos mayores, suscripción global) → alta de `subscribers/{uid}` con status `pending`
  - Pantallas placeholder para pending/active/expired (se conectan de verdad en pasos 4, 6 y 7)
  - Plan personalizado queda fuera de este flujo, sigue coordinándose por WhatsApp/panel de clientes como hoy
  - Probado en navegador con cuenta de alumno de prueba: funciona bien. De paso se arregló un bug preexistente en `doLogout` (no volvía a la pantalla de login tras cerrar sesión).
- [x] 4. Modificar `crearPago` (functions/index.js) para aceptar `subscriberId` → `external_reference: 'sub:'+uid`
  - Código escrito y con sintaxis verificada, pero **sin deployar ni usar**: al intentar deployar functions se descubrió que la API de Cloud Functions nunca se activó en este proyecto (requiere plan Blaze). Angel decidió no pasar a Blaze por ahora.
  - **Pivot de diseño:** en vez de automatizar el pago con Cloud Functions + webhook de MercadoPago, se usa el mismo mecanismo manual que ya usan los planes grupales (`plan.mpLink`): Angel pega a mano un link de pago de MercadoPago por categoría (campo `planesFijos/{categoria}.mpLink`, editable en la pestaña "🔔 Planes fijos"), y activa el acceso a mano desde el panel de Suscriptores (paso 6) cuando confirma el pago. `crearPago`/`mpWebhook` quedan en el código sin usar, por si en el futuro se quiere automatizar pasando a Blaze.
- [x] 5. Modificar `mpWebhook` (functions/index.js) para bifurcar por prefijo `sub:` y actualizar `subscribers/{uid}`
  - Mismo estado que el paso 4: código escrito pero no deployado ni usado, reemplazado por la activación manual del panel de Suscriptores.
- [x] 6. Adaptar render de plan/progreso del alumno para leer desde `subscribers` + `planesFijos` (reusa el mismo motor que `renderGroupCV`/`renderGroupDay`: `renderWarmupBlock`/`renderGymBlock`/`renderFuncBlock`/`renderCFBlock`)
  - Nuevo `renderAlumnoPlanView`/`renderAlumnoCV`/`renderAlumnoDay` en `index.html`, progreso guardado en `subscribers/{uid}.progress` (en vez de `plan.members[].progress`)
  - `toggleSerie`/`logGym` reconocen el prefijo `alu-{uid}` y persisten ahí
  - Categoría "global": selector de categorías arriba del plan (elección solo de vista, no se persiste); `firestore.rules` ajustado para que un suscriptor global pueda leer cualquiera de los planes fijos
  - Categorías ahora dinámicas (ya no una lista fija de 4 en el código): se leen de la colección `planesFijos`. En la pestaña "🔔 Planes fijos" hay botón "➕ Agregar categoría" (crea `planesFijos/{slug}` con `label`) y "🗑️" para eliminarlas; el registro del alumno y el panel de Suscriptores reflejan la lista automáticamente
  - Corte de acceso también en frontend: si `expiry` ya pasó, se muestra la pantalla de vencido aunque Firestore todavía diga `status:'active'` (el webhook no corre proactivamente)
  - Si `planesFijos/{categoria}` todavía no tiene `planId` asignado (Angel no terminó de armar esa categoría), pantalla "tu plan todavía no está listo" en vez de romper
  - Nuevo panel admin **🔔 Suscriptores** (Entrenador → Suscriptores): lista de alumnos suscriptos con buscador (orden alfabético), activación manual eligiendo fecha de vencimiento con calendario (para pagos por link de MercadoPago pegado a mano), botón para desactivar, y selector para cambiar la categoría/plan de un suscriptor (recalcula `planId` automáticamente). También permite elegir la semana de inicio del plan en la primera activación (si el plan tiene varias semanas), igual que ya se puede con clientes normales.
  - Cada categoría (y "global") tiene un campo `mpLink` editable en la pestaña "Planes fijos" — el alumno ve un botón "💳 Pagar ahora" en su pantalla de pendiente/vencido apuntando a ese link.
  - `firestore.rules` con el bypass de "global" **ya publicado en Firebase Console** (`firebase deploy --only firestore:rules`, 2026-07-13) — no quedó pendiente para el deploy final
  - Probado en navegador con suscripción activada manualmente desde el panel de Suscriptores: funciona para categoría individual y para "global" (con las 4 categorías)
  - La pantalla de "vencido" (frontend) ya quedó resuelta acá mismo, así que el paso 7 original queda cubierto
- [x] 7. Pantalla de estado pending/expired reutilizando UI existente — cubierto dentro del paso 6 (ver arriba)
- [x] 8. Prueba end-to-end: alta alumno → alumno ve el link de pago (MercadoPago) y/o datos de transferencia de su categoría → Angel confirma el pago y activa a mano en Suscriptores → acceso al plan → simular vencimiento y confirmar corte real (no solo frontend)
  - Ya no depende de Cloud Functions/sandbox de MP (ver paso 4/5) — reemplazado por el flujo manual
  - Sumada opción de pago por **transferencia**: campo de texto libre (alias/CBU/titular) en "Planes fijos" (`planesFijos/_config.transferInfo`, colección ya pública de lectura), se muestra junto al botón de MercadoPago en la pantalla de pendiente/vencido del alumno
  - Probado en navegador: aparece el botón de pago y los datos de transferencia correctamente para la categoría del suscriptor de prueba, tanto en pending como en expired
- [x] 9. (extra, no estaba en el plan original) Link amigable + alta manual del alumno
  - `firebase.json`: rewrite de hosting `/suscripcion` → `/index.html`. **Solo funciona después de `firebase deploy --only hosting`** (o en producción); en el servidor local `npx serve .` no aplica rewrites de Firebase, ahí seguís probando con `?alumno=1`.
  - `location.href=location.pathname` (redirección del admin fuera del flujo de alumno) se cambió a `location.href='/'` — con el rewrite nuevo, redirigir al mismo pathname (`/suscripcion`) hubiera causado un loop infinito.
  - Nuevo formulario "➕ Dar de alta un alumno vos mismo" en el panel de Suscriptores: crea la cuenta de Firebase Auth con una instancia secundaria (no pisa la sesión de admin en la pestaña), crea `subscribers/{uid}` con `status:'pending'`, y le manda un email de "restablecer contraseña" para que el alumno defina la suya.
  - `firestore.rules`: `subscribers/{uid}` → `allow create` ahora también permite `isAdmin()` (antes solo el propio dueño podía crear su doc, lo cual bloqueaba el alta manual). **Ya publicado** (`firebase deploy --only firestore:rules`, 2026-07-13).
  - Probado en navegador: funciona.
  - Además: desde una anamnesis (Solicitudes) hay botón "🔔 Dar de alta como suscriptor" que precarga nombre/email en el formulario de alta manual.
  - Selector de "semana de inicio" en Suscriptores ahora editable en cada activación (no solo la primera vez), reinicia `startDate` cuando se usa.
- [x] 10. (extra, no estaba en el plan original) Plantillas de bloque para armar planificaciones más rápido
  - Botón 💾 en cada bloque (calentamiento/ejercicio/actividad funcional/WOD) para guardarlo como plantilla reusable (`meta/bloqueTemplates`, admin-only)
  - Botón "📥 Insertar plantilla" en cada día para agregar un bloque guardado a cualquier plan/cliente
  - Pendiente de probar en navegador
- [ ] 11. (extra) Unificar seguimiento de alumnos — Paso A: plan en `C:\Users\meier\.claude\plans\robust-painting-moore.md`
  - Nueva subtab "👤 Alumnos (nuevo)" (`panel-alumnosuni` → `renderAlumnosUnificado`) que junta clientes + planes grupales + suscriptores en una sola lista por persona, con progreso de entrenamiento (reusa `buildProgressSummary`/`renderProgressDetailBlock`) y acciones contextuales por tipo de programa. Convive con las 4 pantallas viejas (Seguimiento, Ver por alumno, Planes Grupales→Seguimiento, Suscriptores) sin tocarlas.
  - `altaManualAlumno` ahora acepta ids configurables para reusarse desde ambos formularios de alta manual (viejo y nuevo)
  - `activarSuscriptorManual`/`desactivarSuscriptorManual`/`cambiarCategoriaSuscriptorManual` ahora refrescan cualquiera de los dos paneles que esté visible (`refreshSuscriptorPanels()`)
  - Pendiente de probar en navegador; Paso B (borrar las 4 pantallas viejas) queda para después de que Angel confirme que la nueva cubre todo

## Pendiente a confirmar
- ¿Los links públicos de planes grupales por WhatsApp deben seguir 100% sin login? (asumido que sí, vía flag `public:true`)
- ¿Angel quiere en algún momento pasar a Blaze para automatizar el pago con `crearPago`/`mpWebhook` (ya escritos, sin usar)? Por ahora se descartó por el costo/trámite de habilitar Cloud Functions.

## Firebase CLI
El login de la CLI funciona (arreglado 2026-07-13 actualizando `firebase-tools`). Se puede deployar `firestore.rules` con `firebase deploy --only firestore:rules --project angelmeier-fit` normalmente. **Cloud Functions no están habilitadas en este proyecto** (requiere plan Blaze) — no intentar `firebase deploy --only functions` hasta que Angel decida pasar a Blaze.

## Revisión
(completar al terminar la implementación)
