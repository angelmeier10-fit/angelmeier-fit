# Lecciones

## 2026-10-07 — Panel de contenido equivocado
- **Error:** agregué los reels de la guía +50 al artifact viejo de claude.ai en vez de al panel real.
- **Regla:** el panel de contenido de Instagram es `contenido.html` (angelmeier-fit.web.app/contenido.html). Ante "panel de contenido", buscar primero en el repo antes de usar una URL guardada en memoria; si hay dos candidatos, confirmar cuál.

## 2026-10-09 — Fix de timer dado por bueno sin reproducir en el entorno real
- **Error:** encontré una causa posible (banner de instalar tapando el timer) en Chrome headless y la di por resuelta; en el celular del usuario seguía fallando.
- **Regla:** en bugs táctiles/móviles, antes de arreglar confirmar dispositivo y si es app instalada o navegador; no asumir que una repro en Chrome de escritorio es la del usuario.

## 2026-10-10 — Feature nueva en un botón aparte mientras el viejo seguía rechazando
- **Error:** armé "Cortar video largo" como botón nuevo en el banco, pero el usuario siguió usando "Subir video" del editor, que rechazaba los videos de más de 40 MB con "recortalo antes".
- **Regla:** cuando una feature nueva resuelve el límite de un flujo existente, conectar ese flujo a la feature (el error lleva a la solución), no solo agregar una entrada aparte.

## 2026-10-14 — Carrusel armado en Canva en vez de en el panel de contenido
- **Error:** el usuario pidió un carrusel de presentación y lo armé en Canva (con la paleta de mano-a-mano), cuando sus piezas de Instagram se cargan en `contenido.html` con la identidad violeta #7B4FE0.
- **Regla:** cualquier pieza de Instagram (post, carrusel, reel, historia) va primero como tema en `SEED_TOPICS` de `contenido.html` (copy + slides + prompt `pieza()`), salvo que pida explícitamente otra herramienta. No confundir la paleta de mano-a-mano con la de @angelmasaje.fit.

## 2026-10-15 — Guía de principiantes armada como si fuera para +50
- **Error:** el usuario pidió una guía para gente que quiere empezar a entrenar y la armé con variantes de adulto mayor (sentadilla a silla, flexiones contra pared, plancha con rodillas), arrastrado por el público 55+ de los anuncios.
- **Regla:** "principiante" no es "adulto mayor". Si el público no está dicho, preguntar o asumir joven/adulto y usar ejercicios estándar (sentadilla, flexiones, búlgaras, peso muerto a una pierna, aislados de brazos y hombros); las regresiones van solo para el público +50.

## 2026-10-15 — Guía nueva con diseño inventado en vez del de las guías existentes
- **Error:** armé el PDF de la guía Empezá a entrenar con un diseño nuevo (A4 claro) sin mirar `guia-50.pdf` ni `guia-gluteos.pdf`.
- **Regla:** antes de crear una pieza de una serie que ya existe (guía, carrusel, landing), abrir las anteriores y copiar formato y estructura. Las guías: 1080×1350, fondo oscuro, franja diagonal violeta, Barlow Condensed itálica + Inter, portada, bienvenida, índice, capítulos con "A practicar", plan de 4 semanas y "¿Y después?".

## 2026-10-28 — Modo entrenamiento tapado por la vista de alumno
- **Error:** el overlay nuevo (z-index 9990) quedó debajo de `#view-alumno` (fixed, z-index 9998); en la página de prueba no apareció porque no reproducía ese contenedor. También el contenido centrado con flex se cortaba arriba al crecer (video).
- **Regla:** antes de agregar un overlay fijo en index.html, buscar los z-index de los contenedores fijos donde se va a usar (`#view-alumno` 9998, timers 9999, modales 10000). En columnas flex con scroll, usar `min-height:0` y no `justify-content:center` (corta el contenido de arriba).
