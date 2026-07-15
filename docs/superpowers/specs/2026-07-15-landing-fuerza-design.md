# Landing "Fuerza / CrossFit / Funcional / Estética" — Diseño

## Contexto

La landing existente (`landing.html`) habla exclusivamente a adultos +50 que buscan recuperar movilidad y postura. Angel también entrena fuerza, CrossFit, funcional, y composición corporal/estética (mujeres y hombres). Ese público tiene objetivos, miedos y lenguaje distintos — mezclarlo en la misma página diluiría ambos mensajes.

## Decisión de alcance

Una sola landing nueva para fuerza/CrossFit/funcional/estética, no una landing por sub-público. Estos objetivos no son excluyentes entre sí (alguien que busca estética también hace fuerza y funcional), así que se resuelve con una sección "Elegí tu objetivo" en vez de 3-4 páginas separadas.

## Archivo y hosting

- Archivo: `landing-fuerza.html`, en la raíz del proyecto (mismo nivel que `landing.html`).
- Se sirve automáticamente vía Firebase Hosting (`firebase.json` ya sirve `public: "."` sin filtros que excluyan HTML nuevos).
- URL en producción: `https://angelmeier-fit.web.app/landing-fuerza.html`.
- Standalone: no depende de `shared/`, `index.html` ni build step — HTML/CSS/JS inline, igual que `landing.html`.

## Estilo visual (distinto del de +50)

- Paleta: negro casi puro (`#141414`) para hero y CTA final, blanco cálido (`#faf8f5`) para el resto del fondo, acento naranja intenso (`#ff5a1f`) para botones, números y highlights. Sin verde salvia (eso queda reservado a la identidad +50).
- Tipografía: una display bold condensada tipo grotesk (ej. "Archivo Black" o "Oswald", vía Google Fonts import igual que hace `landing.html` hoy) para títulos, Inter para cuerpo de texto (mismo body font que el resto del proyecto, sin sumar una tercera familia).
- Tono: directo, de resultados, sin la cautela/ternura de la landing +50.

## Estructura de secciones

1. **Nav**: logo "Angel Meier" + links a anclas (`#objetivos`, `#programa`, `#modalidades`, `#sobre-mi`, `#faq`) + botón "Hablemos" (WhatsApp, mismo número `541172399988`).
2. **Hero**: tag ("Fuerza · CrossFit · Funcional"), título de impacto, bajada corta, CTA doble (WhatsApp "Quiero entrenar" + botón secundario "Ya sé qué quiero — suscribirme" → `https://angelmeier-fit.web.app/suscripcion`), imagen de stock de entrenamiento de fuerza/CrossFit.
3. **"Elegí tu objetivo"** (`#objetivos`): grid de 4 tarjetas — Fuerza, CrossFit/Funcional, Tonificación y composición corporal, Rendimiento general. Cada una con ícono, título y 1-2 líneas.
4. **El programa** (`#programa`): 4 pilares — fuerza progresiva, entrenamiento funcional, composición corporal, seguimiento y ajuste continuo. Mismo layout de `.pillars-grid` que la landing +50 (reutilizar patrón CSS, no el contenido).
5. **Modalidades** (`#modalidades`): 2 tarjetas — Programa General (online, app con seguimiento) y Programa Personalizado (evaluación + ajuste, destacado) — mismo modelo de negocio que ya existe, mismo layout `.mod-grid`.
6. **Sobre mí** (`#sobre-mi`): mismo bio/credenciales que la landing +50, reacomodado hacia este público (énfasis en fuerza/composición corporal en vez de posturología).
7. **Proceso** (3 pasos, mismo layout `.steps` que la otra landing).
8. **FAQ** (`#faq`): preguntas específicas de este público, por ejemplo:
   - "¿Voy a hincharme/agrandarme si entreno fuerza?" (pensada para el miedo típico de mujeres al arrancar fuerza)
   - "¿Cuánto tiempo hasta ver cambios en mi composición corporal?"
   - "Nunca hice CrossFit, ¿es seguro para mí?"
   - "¿Las sesiones son presenciales o virtuales?"
   - "¿Qué necesito para empezar?"
9. **CTA final**: fondo negro, título de cierre, mismo CTA doble (WhatsApp + suscribirme).
10. **Footer**: logo, año/ubicación, y un link discreto ("¿Buscás recuperar movilidad después de los 50? → Ver ese programa") a `landing.html`. Simétricamente, se agrega el mismo tipo de link discreto en el footer de `landing.html` apuntando a `landing-fuerza.html` ("¿Buscás fuerza, CrossFit o mejorar tu composición corporal? → Ver ese programa").

Sin sección de testimonios — mismo criterio que se aplicó en `landing.html`: no se inventan reseñas, se agrega cuando haya testimonios reales para cualquiera de las dos landings.

## Fuera de alcance

- No se toca `index.html` ni la app de suscripción.
- No se arma un nav compartido/global entre ambas landings — cada una es independiente, con un único link cruzado discreto en el footer.
- No se agregan analytics ni tracking de conversión (no se pidió).
