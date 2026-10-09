# Lecciones

## 2026-10-07 — Panel de contenido equivocado
- **Error:** agregué los reels de la guía +50 al artifact viejo de claude.ai en vez de al panel real.
- **Regla:** el panel de contenido de Instagram es `contenido.html` (angelmeier-fit.web.app/contenido.html). Ante "panel de contenido", buscar primero en el repo antes de usar una URL guardada en memoria; si hay dos candidatos, confirmar cuál.

## 2026-10-09 — Fix de timer dado por bueno sin reproducir en el entorno real
- **Error:** encontré una causa posible (banner de instalar tapando el timer) en Chrome headless y la di por resuelta; en el celular del usuario seguía fallando.
- **Regla:** en bugs táctiles/móviles, antes de arreglar confirmar dispositivo y si es app instalada o navegador; no asumir que una repro en Chrome de escritorio es la del usuario.
