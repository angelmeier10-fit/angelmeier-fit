# Historial global de máximos por ejercicio

**Fecha:** 2026-08-11
**Estado:** Aprobado, pendiente de implementación

## Problema

Cada plan de entrenamiento tiene su propio objeto `progress:{}`, que se resetea
a vacío cada vez que se crea o duplica un plan (`copy.progress={}` al
duplicar, `progress:{}` al asignar plan nuevo). El alumno ve un "Último: Xkg"
en el input de registro, pero ese dato solo existe **dentro del mismo plan**.
Si se le arma un plan nuevo (semana siguiente, otro programa, otro desafío),
pierde todo rastro de lo que hizo antes con ese ejercicio — ni el peso máximo
ni notas de la última vez.

## Solución

Historial global por alumno y por ejercicio, independiente de los planes,
alimentado automáticamente por los registros del alumno y complementable con
una nota manual del entrenador.

## Estructura de datos

**Corrección tras investigar el código:** el progreso hoy se guarda por
*tres caminos distintos* según el tipo de alumno, cada uno en un documento
que se resetea o es específico de un plan:

1. Alumno normal → `clients/{id}.progress` (se resetea al asignar plan nuevo).
2. Alumna de suscripción / Desafío → `subscribers/{uid}.progress` (mismo
   problema, se resetea al cambiar de plan).
3. Miembro de un plan grupal → `planes/{planId}/progreso/{memberId}`. Acá es
   peor: `memberId` se genera de nuevo (`'m'+Date.now()+...`) cada vez que
   se agrega a alguien a un plan grupal, así que la misma persona en dos
   planes grupales distintos ni siquiera comparte id.

Ningún doc actual identifica a la persona de forma estable entre planes. Por
eso el historial global va en una **colección nueva, independiente de
clients/subscribers/planes**:

```
exHistory/{personKey}
```

donde `personKey = (name+'|'+(email||'')).toLowerCase()` — mismo criterio ya
usado en el código para detectar si una persona ya está en un plan
(`renderEcAddPlanOptions`, `index.html:4872`: `(c.name+'|'+(c.email||'')).toLowerCase()`).
Usar nombre+email como clave evita depender del id de cliente/subscriber/miembro,
que varía según el camino.

Forma del documento:

```js
// doc en exHistory/{personKey}
{
  ex: {
    "sentadilla": {                 // clave = norm(nombre del ejercicio),
                                     // mismo criterio que ya usa exDB
                                     // (norm() existente en el código)
      max:  { weight: 45, reps: 10, date: "2026-08-05" },
      last: { weight: 40, reps: 10, date: "2026-08-11" },
      note: "le cuesta la profundidad, ir con cuidado"   // manual, opcional
    }
    // ...una entrada por ejercicio distinto que la persona haya registrado
  }
}
```

- Vive fuera de `clients`/`subscribers`/`planes` → sobrevive a que
  `progress` se resetee y a que cambie de plan grupal.
- La clave de ejercicio es el nombre normalizado (`norm(name).trim()`),
  igual al patrón ya usado en
  `exDB.find(e=>norm(e.name).trim()===norm(name).trim())` (línea ~2782 de
  `index.html`). No requiere que el ejercicio del plan tenga un `id` de
  biblioteca — alcanza con el texto del nombre.
- `max` y `last` solo tienen sentido para ejercicios con peso. Ejercicios de
  tiempo/cardio (detectados igual que hoy con el regex
  `/\d+\s*(min|s$|seg|km)/i` sobre `reps`) no generan entrada de `max`/`last`,
  pero sí pueden tener `note` manual.

## Captura automática

Solo `logGym` persiste peso (el checkmark de `toggleSerie` solo marca la
serie como hecha; el peso por serie se guarda cuando se aprieta "Guardar
pesos", que dispara `logGym`). Hay tres implementaciones de `window.logGym`
en `index.html` — la original (`clients`, ~línea 4002) y dos overrides que
la envuelven para los otros dos caminos (rama `alu-` y rama `grp::`, ambas
dentro del override en ~línea 6133). Las tres reciben `cId` y `ekey`, pero
ninguna recibe hoy el **nombre del ejercicio** — hay que agregarlo como
parámetro nuevo `exName` en la firma y en cada call site (`onclick="logGym(...)"`,
líneas ~3788 y ~3855, y el equivalente en las vistas de alumno/grupo si
difiere).

En cada una de las tres ramas, después de guardar el log como hasta ahora:

1. Calcular `personKey` con los datos de esa rama (cliente: `c.name`/`c.email`;
   suscripción: `alumnoState.sub.name`/`alumnoState.sub.email`; grupal:
   `member.name`/`member.email`).
2. Normalizar el nombre del ejercicio (`norm(exName)`).
3. Si el peso registrado es mayor al `max.weight` guardado para esa persona+
   ejercicio (o no existe `max` todavía), reemplazar `max`.
4. `last` se pisa siempre con el registro más reciente (weight, reps, date
   de hoy).
5. Persistir con `setDoc(doc(db,'exHistory',personKey),{ex:{[nombre]:{max,last}}},{merge:true})`
   — llamada aparte a Firestore, independiente del `updateDoc`/`persistAlumnoProgress`/
   `setDoc` que ya guarda el progreso del plan.

Si el registro no incluye peso (solo reps, ej. ejercicios de tiempo), no se
toca `max`/`last`.

## Nota manual del entrenador

**Corrección:** la edición de ejercicio de la biblioteca (`openEditEx` /
`openEditExFromPlan`) edita la definición global del ejercicio (`exDB`),
compartida por todos los alumnos — no es el lugar para una nota específica
de un alumno con un ejercicio. Esa pantalla ya tiene su propio campo
`ex.notes` genérico y no se toca.

La nota manual va en la vista del entrenador cuando mira el detalle de un
alumno (`renderCV`/`renderDay`, y las funciones equivalentes para alumnas de
suscripción y miembros de grupo), como un botón "📝" chico al lado del
nombre del ejercicio (`cv-ex-name`), visible solo ahí (no en la vista del
propio alumno). Al clickear, pide el texto (mismo patrón que ya usa el
código con `confirm()` en `deleteAlumnoNote`, línea ~6489) y guarda con
`setDoc(doc(db,'exHistory',personKey),{ex:{[nombre]:{note:texto}}},{merge:true})`.

Es independiente de `max`/`last`: se puede editar en cualquier momento, no
requiere que el alumno haya registrado nada todavía. Firestore con
`merge:true` mergea el mapa anidado sin pisar `max`/`last` existentes de ese
mismo ejercicio, ni otras entradas de `ex`.

## Visualización

`renderGymBlock`/`renderFuncBlock` (y sus equivalentes de alumno/grupo) son
funciones síncronas que hoy reciben todos sus datos ya en memoria. El doc de
`exHistory` hay que traerlo de Firestore, así que se resuelve con un cache
en memoria (`exHistoryCache`, mapa `personKey -> {ex:{...}}`) más una carga
perezosa:

- Al entrar a la vista de detalle de un alumno (`renderCV`, y los
  equivalentes de alumna de suscripción / miembro de grupo), si
  `exHistoryCache[personKey]` no existe, se dispara
  `getDoc(doc(db,'exHistory',personKey))`, se guarda en el cache
  (`{}` si no existe el doc) y se vuelve a renderizar la vista una vez
  resuelta — mismo patrón que ya usa `renderCV` con `verified-` en
  localStorage/`getDoc` (línea ~3484).
- Mientras no está cacheado, el renglón de historial simplemente no se
  muestra (no bloquea el resto del render).

Con el cache ya resuelto, en `renderGymBlock`/`renderFuncBlock`, debajo del
nombre del ejercicio (`cv-ex-name`) y antes de la tabla de series / inputs
de registro, se agrega un renglón nuevo que resuelve
`exHistoryCache[personKey].ex[norm(ex.name)]`:

```
🏆 Máx: 45kg × 10  ·  Último: 40kg × 10 (11/08)
📝 le cuesta la profundidad, ir con cuidado
```

Reglas de armado:
- Si no hay entrada para ese ejercicio, no se muestra nada (no rompe
  ejercicios nuevos sin historial).
- Si hay `max`/`last` pero no `note`, se muestra solo la primera línea.
- Si hay `note` pero no `max`/`last` (nota puesta a mano antes de que la
  persona registre nada), se muestra solo la segunda línea.
- El input de registro (`pw-...`, placeholder "Último: Xkg") sigue mostrando
  el último peso, pero ahora resuelto desde `exHistoryCache` en vez del log
  local del plan — así el placeholder también sobrevive entre planes.
- El renglón de máximo/último y la nota se muestran en TODAS las vistas
  (entrenador y la del propio alumno/grupo) — es justamente lo que pidió el
  alumno: ver su máximo/nota al abrir el ejercicio. El botón "📝" para
  editar la nota se muestra solo en la vista del entrenador; el alumno la
  ve de solo lectura.

## Reglas de Firestore

`exHistory` es colección nueva → necesita reglas en `firestore.rules`. Las
reglas actuales condicionan acceso por `request.auth.uid` (`isOwner`,
`memberId==auth.uid`), pero `personKey` se arma con nombre+email, no con uid
— no hay forma de validar en las reglas que quien escribe es realmente esa
persona sin el nombre disponible en el token. Simplificación deliberada
(dato de baja sensibilidad — pesos y repeticiones, no datos de contacto ni
pagos): cualquier request autenticado puede leer y escribir, igual que
`isAdmin()`:

```
match /exHistory/{personKey} {
  allow read, write: if isAdmin() || request.auth != null;
}
```

Esto cubre tanto al entrenador (siempre autenticado como admin) como al
alumno logueado (subscriber) registrando su propio progreso. Los alumnos
que acceden sin login (planes grupales `public:true`, o clientes sin cuenta
propia) no podrán escribir su `exHistory` automáticamente — para esos
casos el registro automático de peso seguirá guardándose en su documento de
progreso de siempre, pero el historial global no se actualizará hasta que
el entrenador cargue el dato a mano o hasta que ese alumno tenga login. Se
documenta como limitación conocida, no se resuelve en esta iteración.

## Alcance / fuera de alcance

- No se migran logs de planes ya cerrados/pasados. El historial global
  arranca desde que se implemente esto en adelante; lo guardado en planes
  viejos no se retroactivea.
- No aplica a ejercicios de tiempo/cardio en cuanto a `max`/`last` (solo
  nota manual).
- No cambia el comportamiento actual de los logs por plan (`logs`,
  `deleteLog`, tabla de series tildadas) — esto se suma, no reemplaza nada.
- Si dos alumnos distintos comparten exactamente el mismo nombre y (falta
  de) email, compartirían `personKey` y por lo tanto historial. Riesgo
  aceptado: mismo criterio de identidad que ya usa `renderEcAddPlanOptions`
  para detectar duplicados en planes grupales.

## Testing

- Registrar un peso en un ejercicio, crear un plan nuevo con el mismo
  ejercicio (mismo nombre normalizado) y verificar que el renglón de
  máximo/último se siga mostrando.
- Registrar un peso menor al máximo guardado y verificar que `max` no
  cambia, pero `last` sí.
- Registrar un peso mayor al máximo guardado y verificar que `max` se
  actualiza.
- Poner una nota manual en un ejercicio sin registros previos y verificar
  que aparece en el plan del alumno sin romper nada.
- Ejercicio de tiempo/cardio: verificar que no aparece `max`/`last` pero sí
  la nota si se cargó una.
