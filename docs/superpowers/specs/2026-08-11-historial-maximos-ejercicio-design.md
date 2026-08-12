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

Nuevo campo en el documento del cliente (`clients/{id}`):

```js
exHistory: {
  "sentadilla": {                 // clave = norm(nombre del ejercicio), mismo
                                   // criterio de normalización que ya usa
                                   // exDB (norm() existente en el código)
    max:  { weight: 45, reps: 10, date: "2026-08-05" },
    last: { weight: 40, reps: 10, date: "2026-08-11" },
    note: "le cuesta la profundidad, ir con cuidado"   // manual, opcional
  },
  // ...una entrada por ejercicio distinto que el alumno haya registrado
}
```

- Vive en el documento del cliente, no en el plan → sobrevive a que
  `progress` se resetee.
- La clave es el nombre normalizado (`norm(name).trim()`), igual al patrón ya
  usado en `exDB.find(e=>norm(e.name).trim()===norm(name).trim())` (línea
  ~2782 de `index.html`). No requiere que el ejercicio del plan tenga un
  `id` de biblioteca — alcanza con el texto del nombre.
- `max` y `last` solo tienen sentido para ejercicios con peso. Ejercicios de
  tiempo/cardio (detectados igual que hoy con el regex
  `/\d+\s*(min|s$|seg|km)/i` sobre `reps`) no generan entrada de `max`/`last`,
  pero sí pueden tener `note` manual.

## Captura automática

Los puntos donde hoy ya se persiste un registro de peso/reps son `logGym` y
`toggleSerie`. En ambos, además de escribir el log del plan como hasta ahora:

1. Normalizar el nombre del ejercicio (`norm(ex.name)`).
2. Si el peso registrado en este log es mayor al `max.weight` guardado (o no
   existe `max` todavía), reemplazar `exHistory[nombre].max`.
3. `exHistory[nombre].last` se pisa siempre con el registro más reciente
   (weight, reps, date de hoy).
4. Persistir junto con el mismo `setDoc`/`updateDoc` que ya guarda el
   `progress` del cliente — no se agrega una llamada extra a Firestore.

Si el registro no incluye peso (solo reps, ej. ejercicios de tiempo), no se
toca `max`/`last`.

## Nota manual del entrenador

En la pantalla de edición de ejercicio de la biblioteca (donde ya están
`openEditEx` / `openEditExFromPlan`), se agrega un campo de texto "Nota para
el alumno". Escribe directo en `exHistory[nombreNormalizado].note`. Es
independiente de `max`/`last`: se puede editar en cualquier momento, no
requiere que el alumno haya registrado nada todavía.

Si el ejercicio nunca fue registrado por el alumno (no existe la entrada en
`exHistory`), guardar la nota debe crear la entrada con solo `note`, sin
`max`/`last`.

## Visualización para el alumno

En `renderGymBlock` y `renderFuncBlock`, debajo del nombre del ejercicio
(`cv-ex-name`) y antes de la tabla de series / inputs de registro, se agrega
un renglón nuevo que resuelve `exHistory[norm(ex.name)]` del cliente actual:

```
🏆 Máx: 45kg × 10  ·  Último: 40kg × 10 (11/08)
📝 le cuesta la profundidad, ir con cuidado
```

Reglas de armado:
- Si no hay entrada en `exHistory` para ese ejercicio, no se muestra nada
  (no rompe ejercicios nuevos sin historial).
- Si hay `max`/`last` pero no `note`, se muestra solo la primera línea.
- Si hay `note` pero no `max`/`last` (nota puesta a mano antes de que el
  alumno registre nada), se muestra solo la segunda línea.
- El input de registro (`pw-...`, placeholder "Último: Xkg") sigue mostrando
  el último peso, pero ahora resuelto desde `exHistory` en vez del log local
  del plan — así el placeholder también sobrevive entre planes.

## Alcance / fuera de alcance

- No se migran logs de planes ya cerrados/pasados. El historial global
  arranca desde que se implemente esto en adelante; lo guardado en planes
  viejos no se retroactivea.
- No aplica a ejercicios de tiempo/cardio en cuanto a `max`/`last` (solo
  nota manual).
- No cambia el comportamiento actual de los logs por plan (`logs`,
  `deleteLog`, tabla de series tildadas) — esto se suma, no reemplaza nada.

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
