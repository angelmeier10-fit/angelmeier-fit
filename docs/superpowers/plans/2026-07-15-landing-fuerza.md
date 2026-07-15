# Landing Fuerza/CrossFit/Estética Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `landing-fuerza.html`, a standalone marketing page for fuerza/CrossFit/funcional/estética, and cross-link it with the existing `landing.html` (+50 audience).

**Architecture:** Single self-contained HTML file (inline `<style>` + tiny inline `<script>` for the FAQ accordion), same pattern as `landing.html`. No build step, no shared JS/CSS imports, served as a static file by Firebase Hosting from the project root.

**Tech Stack:** Plain HTML5, CSS custom properties, vanilla JS (no framework). Google Fonts `<link>` import, same mechanism `landing.html` already uses.

## Global Constraints

- Palette: `--bg:#faf8f5; --dark:#141414; --ac:#ff5a1f; --tx:#141414; --mu:#6b6258; --border:#e5e0d8` (near-black hero/CTA sections, warm off-white elsewhere, single orange accent).
- Fonts: a bold condensed display face for headings (Google Fonts "Oswald", weights 600/700) + "Inter" (weights 400/500/600/700) for body — same body font family `landing.html` uses, don't add a third family.
- WhatsApp number: `541172399988` (same as `landing.html`), prefilled message: `Hola Angel, vi tu página y quiero entrenar fuerza/CrossFit.` (URL-encoded).
- Suscripción link: `https://angelmeier-fit.web.app/suscripcion`.
- No testimonials section — do not invent reviews.
- File must be reachable at `https://angelmeier-fit.web.app/landing-fuerza.html` after deploy (Firebase Hosting serves `public: "."` with no extension filtering, confirmed in `firebase.json`).

---

### Task 1: Scaffold + Hero + Nav

**Files:**
- Create: `landing-fuerza.html`

**Interfaces:**
- Produces: CSS custom properties (`--bg`, `--dark`, `--ac`, `--tx`, `--mu`, `--border`, `--ra`), reused by every later task.
- Produces: `.btn-wa`, `.btn-app`, `.cta-row` classes (copy verbatim from `landing.html`'s equivalents, same visual contract, different color values).

- [ ] **Step 1: Create the file with doctype, head, and base CSS reset/tokens**

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Angel Meier — Fuerza, CrossFit y Composición Corporal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #faf8f5; --dark: #141414; --s1: #ffffff; --warm: #f0ede8; --tx: #141414;
  --mu: #6b6258; --ac: #ff5a1f; --ac2: #e0480f;
  --wa: #25d366; --wa2: #1da851; --border: #e5e0d8;
}
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--tx); line-height: 1.6; }
h1, h2, h3 { font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: -0.01em; }
</style>
</head>
<body>
</body>
</html>
```

- [ ] **Step 2: Add nav, WhatsApp/btn-app CTA styles, hero section**

Append inside `<style>` (before `</style>`):

```css
nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(250,248,245,0.94); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { font-family: 'Oswald', sans-serif; font-size: 1.15rem; font-weight: 700; color: var(--tx); text-transform: uppercase; }
.nav-links { display: flex; gap: 28px; align-items: center; }
.nav-links a { text-decoration: none; color: var(--mu); font-size: .85rem; transition: color .2s; }
.nav-links a:hover { color: var(--tx); }
.nav-cta { background: var(--dark); color: #fff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-size: .85rem; font-weight: 600; transition: background .2s; }
.nav-cta:hover { background: var(--ac); }

.btn-wa { display: inline-flex; align-items: center; gap: 9px; background: var(--wa); color: #fff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1rem; transition: all .2s; }
.btn-wa:hover { background: var(--wa2); transform: translateY(-2px); }
.btn-app { display: inline-flex; align-items: center; gap: 9px; background: transparent; color: var(--tx); border: 2px solid var(--tx); padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1rem; transition: all .2s; }
.btn-app:hover { background: var(--tx); color: #fff; }
.cta-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

.hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 90vh; align-items: center; background: var(--dark); color: #fff; }
.hero-text { padding: 80px 48px 80px 64px; }
.hero-tag { display: inline-block; background: #ff5a1f22; color: var(--ac); border: 1px solid #ff5a1f55; padding: 5px 14px; border-radius: 6px; font-size: .75rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 28px; }
.hero h1 { font-size: clamp(2.4rem, 4vw, 3.8rem); font-weight: 700; line-height: 1.05; margin-bottom: 22px; }
.hero h1 span { color: var(--ac); }
.hero-desc { font-size: 1.05rem; color: #c9c4bb; line-height: 1.75; max-width: 440px; margin-bottom: 38px; font-family: 'Inter'; text-transform: none; }
.hero-sub { font-size: .78rem; color: #8a857c; margin-top: 14px; }
.hero-img { height: 90vh; background: url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80') center/cover no-repeat; }

@media (max-width: 768px) {
  .nav-links { display: none; }
  .hero { grid-template-columns: 1fr; min-height: auto; }
  .hero-text { padding: 56px 24px 40px; }
  .hero-img { height: 300px; }
}
</style>
```

- [ ] **Step 3: Add the nav and hero markup inside `<body>`**

```html
<nav>
  <div class="nav-logo">Angel Meier</div>
  <div class="nav-links">
    <a href="#objetivos">Objetivos</a>
    <a href="#programa">El programa</a>
    <a href="#modalidades">Modalidades</a>
    <a href="#sobre-mi">Sobre mí</a>
    <a href="#faq">Preguntas</a>
    <a class="nav-cta" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Hablemos</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-text">
    <div class="hero-tag">Fuerza · CrossFit · Funcional</div>
    <h1>Entrená con un<br><span>propósito</span>, no al azar</h1>
    <p class="hero-desc">Programas de fuerza, CrossFit y entrenamiento funcional diseñados para que veas resultados reales en tu cuerpo — más fuerza, mejor composición corporal, mejor rendimiento.</p>
    <div class="cta-row">
      <a class="btn-wa" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Quiero entrenar</a>
      <a class="btn-app" href="https://angelmeier-fit.web.app/suscripcion" target="_blank" style="border-color:#fff;color:#fff">Ya sé qué quiero — suscribirme</a>
    </div>
    <p class="hero-sub">Evaluación inicial gratuita · Sin compromiso</p>
  </div>
  <div class="hero-img"></div>
</section>
```

- [ ] **Step 4: Verify in browser**

Start a local static server from the project root (any of these work):

```bash
npx http-server -p 5051 .
```

Open `http://localhost:5051/landing-fuerza.html`. Expected: dark hero with orange tag, two CTA buttons side by side, nav links visible on desktop, nav links hidden and hero stacked on a narrow/mobile viewport (resize below 768px to confirm).

- [ ] **Step 5: Commit**

```bash
git add landing-fuerza.html
git commit -m "Agregar hero y nav de la landing de fuerza/CrossFit"
```

---

### Task 2: "Elegí tu objetivo" + Programa sections

**Files:**
- Modify: `landing-fuerza.html`

**Interfaces:**
- Consumes: `--dark`, `--ac`, `--border`, `--mu` tokens from Task 1.
- Produces: `.section`, `.section-inner`, `.eyebrow` classes reused by every later section task.

- [ ] **Step 1: Add section/grid CSS**

Append inside `<style>`:

```css
.section { padding: 96px 64px; }
.section-inner { max-width: 1000px; margin: 0 auto; }
.eyebrow { font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ac); margin-bottom: 12px; }
.section h2 { font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 700; line-height: 1.15; margin-bottom: 18px; }
.section-lead { font-size: 1.05rem; color: var(--mu); max-width: 560px; line-height: 1.7; font-family: 'Inter'; text-transform: none; }

.objetivos { background: var(--s1); }
.obj-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; }
.obj-card { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 26px 22px; transition: border-color .2s, transform .2s; }
.obj-card:hover { border-color: var(--ac); transform: translateY(-3px); }
.obj-icon { font-size: 1.8rem; margin-bottom: 12px; }
.obj-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.obj-card p { font-size: .85rem; color: var(--mu); line-height: 1.6; font-family: 'Inter'; text-transform: none; }

.programa { background: var(--warm); }
.pillars-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-top: 48px; }
.pillar-card { background: var(--s1); border-radius: 12px; padding: 32px; border: 1px solid var(--border); }
.pillar-num { width: 36px; height: 36px; border-radius: 8px; background: var(--ac); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .9rem; margin-bottom: 16px; font-family: 'Oswald'; }
.pillar-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
.pillar-card p { font-size: .87rem; color: var(--mu); line-height: 1.7; font-family: 'Inter'; text-transform: none; }

.section-cta { margin-top: 48px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.section-cta .btn-wa { font-size: .9rem; padding: 12px 24px; }
.section-cta-note { font-size: .78rem; color: var(--mu); font-family: 'Inter'; }

@media (max-width: 768px) {
  .section { padding: 64px 24px; }
  .obj-grid, .pillars-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Add markup after `</section>` (end of hero), before `</body>`**

```html
<section class="section objetivos" id="objetivos">
  <div class="section-inner">
    <div class="eyebrow">¿Qué buscás?</div>
    <h2>Elegí tu objetivo</h2>
    <p class="section-lead">No hay un solo camino. Armamos tu programa según lo que quieras lograr — y muchas veces se combinan.</p>
    <div class="obj-grid">
      <div class="obj-card"><div class="obj-icon">🏋️</div><h3>Fuerza</h3><p>Ganá fuerza real con progresiones seguras: sentadilla, peso muerto, press — técnica primero, carga después.</p></div>
      <div class="obj-card"><div class="obj-icon">⚡</div><h3>CrossFit / Funcional</h3><p>Entrenamiento variado de alta intensidad, adaptado a tu nivel. Movimientos funcionales que se sienten en tu día a día.</p></div>
      <div class="obj-card"><div class="obj-icon">✨</div><h3>Composición corporal</h3><p>Tonificar, bajar grasa, ganar masa muscular — con un plan de entrenamiento pensado para tu objetivo estético.</p></div>
      <div class="obj-card"><div class="obj-icon">📈</div><h3>Rendimiento</h3><p>Mejorá tu capacidad física general: resistencia, potencia y recuperación, con seguimiento semanal.</p></div>
    </div>
  </div>
</section>

<section class="section programa" id="programa">
  <div class="section-inner">
    <div class="eyebrow">El programa</div>
    <h2>Entrenamiento con progresión real</h2>
    <p class="section-lead">Cuatro pilares que se ajustan según tu objetivo, no una rutina genérica de internet.</p>
    <div class="pillars-grid">
      <div class="pillar-card"><div class="pillar-num">1</div><h3>Fuerza progresiva</h3><p>Planificación de cargas con progresión medida — subís peso cuando tu cuerpo está listo, no antes.</p></div>
      <div class="pillar-card"><div class="pillar-num">2</div><h3>Entrenamiento funcional</h3><p>Movimientos compuestos que mejoran tu fuerza, movilidad y resistencia al mismo tiempo.</p></div>
      <div class="pillar-card"><div class="pillar-num">3</div><h3>Composición corporal</h3><p>El plan de entrenamiento se ajusta a tu objetivo estético — tonificar, definir o ganar masa muscular.</p></div>
      <div class="pillar-card"><div class="pillar-num">4</div><h3>Seguimiento y ajuste</h3><p>Registrás tu progreso en la app y ajusto tu plan según cómo responde tu cuerpo semana a semana.</p></div>
    </div>
    <div class="section-cta">
      <div class="cta-row">
        <a class="btn-wa" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Quiero saber más</a>
        <a class="btn-app" href="https://angelmeier-fit.web.app/suscripcion" target="_blank">Ya sé qué quiero — suscribirme</a>
      </div>
      <span class="section-cta-note">Evaluación inicial gratuita · Sin compromiso</span>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify in browser**

Refresh `http://localhost:5051/landing-fuerza.html`, scroll to "Elegí tu objetivo". Expected: 4-column card grid on desktop, 1-column stacked on mobile width; "El programa" section shows 4 pillar cards 2x2 with orange numbered badges.

- [ ] **Step 4: Commit**

```bash
git add landing-fuerza.html
git commit -m "Agregar secciones objetivos y programa a landing de fuerza"
```

---

### Task 3: Modalidades + Sobre mí + Proceso sections

**Files:**
- Modify: `landing-fuerza.html`

**Interfaces:**
- Consumes: `.section`, `.section-inner`, `.eyebrow`, `.section-cta` from Task 2.

- [ ] **Step 1: Add CSS**

Append inside `<style>`:

```css
.modalidades { background: var(--bg); }
.mod-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 48px; }
.mod-card { border-radius: 12px; padding: 36px; border: 2px solid var(--border); position: relative; transition: border-color .2s; background: var(--s1); }
.mod-card:hover { border-color: var(--ac); }
.mod-card.destacado { border-color: var(--ac); background: #ff5a1f08; }
.mod-badge { position: absolute; top: -12px; left: 32px; background: var(--ac); color: #fff; font-size: .7rem; font-weight: 700; padding: 4px 12px; border-radius: 6px; letter-spacing: .05em; text-transform: uppercase; }
.mod-card h3 { font-size: 1.4rem; font-weight: 700; margin-bottom: 10px; }
.mod-card .mod-desc { font-size: .93rem; color: var(--mu); line-height: 1.7; margin-bottom: 20px; font-family: 'Inter'; text-transform: none; }
.mod-features { display: flex; flex-direction: column; gap: 8px; }
.mod-feature { display: flex; align-items: flex-start; gap: 10px; font-size: .86rem; font-family: 'Inter'; }
.mod-feature::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--ac); flex-shrink: 0; margin-top: 6px; }

.sobre { background: var(--warm); }
.sobre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
.sobre-photo { border-radius: 12px; overflow: hidden; aspect-ratio: 3/4; background: url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&q=80') center/cover no-repeat; }
.sobre-text h2 { font-size: clamp(1.8rem,3vw,2.6rem); font-weight: 700; margin-bottom: 20px; }
.sobre-text p { color: var(--mu); font-size: .95rem; line-height: 1.8; margin-bottom: 14px; font-family: 'Inter'; }
.creds { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.cred { display: flex; align-items: center; gap: 12px; font-size: .87rem; font-family: 'Inter'; }
.cred-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ac); flex-shrink: 0; }

.proceso { background: var(--s1); }
.steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; margin-top: 52px; }
.step-card { text-align: center; }
.step-n { font-size: 3.2rem; font-weight: 700; color: var(--border); line-height: 1; margin-bottom: 16px; }
.step-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
.step-card p { font-size: .86rem; color: var(--mu); line-height: 1.7; font-family: 'Inter'; }

@media (max-width: 768px) {
  .mod-grid { grid-template-columns: 1fr; }
  .sobre-grid { grid-template-columns: 1fr; gap: 32px; }
  .sobre-photo { aspect-ratio: 4/3; }
  .steps { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Add markup after the "programa" `</section>`**

```html
<section class="section modalidades" id="modalidades">
  <div class="section-inner">
    <div class="eyebrow">Modalidades</div>
    <h2>Elegí cómo entrenar</h2>
    <p class="section-lead">Dos formatos según tu disponibilidad y el nivel de acompañamiento que necesitás.</p>
    <div class="mod-grid">
      <div class="mod-card">
        <h3>Programa General</h3>
        <p class="mod-desc">Un programa online prediseñado de fuerza y funcional. Entrenás a tu ritmo, con seguimiento a través de la app.</p>
        <div class="mod-features">
          <div class="mod-feature">100% online, sin horarios fijos</div>
          <div class="mod-feature">Progresión de fuerza estructurada</div>
          <div class="mod-feature">Ideal para empezar por tu cuenta</div>
        </div>
      </div>
      <div class="mod-card destacado">
        <div class="mod-badge">Más elegido</div>
        <h3>Programa Personalizado</h3>
        <p class="mod-desc">Plan 100% diseñado para vos según tu objetivo — fuerza, CrossFit o composición corporal. Evaluación inicial y ajuste continuo.</p>
        <div class="mod-features">
          <div class="mod-feature">Evaluación física inicial</div>
          <div class="mod-feature">Plan exclusivo según tu objetivo</div>
          <div class="mod-feature">Sesiones presenciales o virtuales</div>
        </div>
      </div>
    </div>
    <div class="section-cta">
      <div class="cta-row">
        <a class="btn-wa" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Quiero empezar</a>
        <a class="btn-app" href="https://angelmeier-fit.web.app/suscripcion" target="_blank">Ya sé qué quiero — suscribirme</a>
      </div>
      <span class="section-cta-note">Evaluación inicial gratuita · Sin compromiso</span>
    </div>
  </div>
</section>

<section class="section sobre" id="sobre-mi">
  <div class="section-inner sobre-grid">
    <div class="sobre-photo"></div>
    <div class="sobre-text">
      <div class="eyebrow">Quién soy</div>
      <h2>Ángel Meier</h2>
      <p>Soy Profesor de Educación Física, masajista terapéutico con más de 11 años de experiencia y estudiante avanzado de Kinesiología.</p>
      <p>Trabajo la fuerza y el entrenamiento funcional con la misma base técnica que uso en rehabilitación: progresiones medidas, técnica antes que carga, y ajuste constante según cómo responde tu cuerpo.</p>
      <div class="creds">
        <div class="cred"><div class="cred-dot"></div>Profesor de Educación Física — UNLu (ex INEF)</div>
        <div class="cred"><div class="cred-dot"></div>Masajista terapéutico — +11 años de práctica</div>
        <div class="cred"><div class="cred-dot"></div>Estudiante de Kinesiología y Fisiatría</div>
        <div class="cred"><div class="cred-dot"></div>Programación de fuerza y entrenamiento funcional</div>
      </div>
    </div>
  </div>
</section>

<section class="section proceso" id="proceso">
  <div class="section-inner">
    <div class="eyebrow">¿Cómo empezamos?</div>
    <h2>Tres pasos para arrancar</h2>
    <div class="steps">
      <div class="step-card"><div class="step-n">01</div><h3>Me escribís</h3><p>Contame tu objetivo por WhatsApp — fuerza, CrossFit, estética. Sin costo, sin compromiso.</p></div>
      <div class="step-card"><div class="step-n">02</div><h3>Evaluación inicial</h3><p>Evaluamos tu nivel actual y definimos el plan que mejor se ajusta a tu objetivo.</p></div>
      <div class="step-card"><div class="step-n">03</div><h3>Empezamos</h3><p>Arrancás a entrenar con seguimiento semanal y ajustes de carga según tu progreso.</p></div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify in browser**

Refresh and scroll through "Modalidades" (two cards, one highlighted with orange border + "Más elegido" badge), "Sobre mí" (photo + bio side by side), "Proceso" (3 numbered steps). Resize to mobile width and confirm all three stack to one column.

- [ ] **Step 4: Commit**

```bash
git add landing-fuerza.html
git commit -m "Agregar secciones modalidades, sobre mi y proceso a landing de fuerza"
```

---

### Task 4: FAQ + CTA final + Footer + cross-link, both landings

**Files:**
- Modify: `landing-fuerza.html`
- Modify: `landing.html`

**Interfaces:**
- Consumes: `.section`, `.eyebrow`, `.cta-row`, `.btn-wa`, `.btn-app` from Tasks 1–3.

- [ ] **Step 1: Add FAQ/CTA-final/footer CSS to `landing-fuerza.html`**

Append inside `<style>`:

```css
.faq { background: var(--warm); }
.faq-list { margin-top: 48px; display: flex; flex-direction: column; }
.faq-item { border-bottom: 1px solid var(--border); }
.faq-item:first-child { border-top: 1px solid var(--border); }
.faq-q { width: 100%; background: none; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 22px 0; font-family: 'Inter', sans-serif; font-size: .97rem; font-weight: 600; color: var(--tx); text-align: left; }
.faq-icon { font-size: 1.2rem; color: var(--ac); flex-shrink: 0; margin-left: 16px; transition: transform .3s; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.faq-a { font-size: .9rem; color: var(--mu); line-height: 1.75; max-height: 0; overflow: hidden; transition: max-height .35s ease, padding .35s ease; font-family: 'Inter'; }
.faq-item.open .faq-a { max-height: 300px; padding-bottom: 20px; }

.cta-final { background: var(--dark); padding: 100px 64px; text-align: center; color: #fff; }
.cta-final h2 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; margin-bottom: 16px; }
.cta-final p { color: #b8b2a8; font-size: 1rem; margin-bottom: 40px; max-width: 460px; margin-left: auto; margin-right: auto; font-family: 'Inter'; }
.cta-final .cta-row { justify-content: center; }
.cta-final .btn-app { border-color: #fff; color: #fff; }
.cta-final .btn-app:hover { background: #fff; color: var(--tx); }

footer { padding: 32px 64px; display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center; font-size: .78rem; color: var(--mu); border-top: 1px solid var(--border); font-family: 'Inter'; }
.footer-row { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1000px; flex-wrap: wrap; gap: 8px; }
.footer-logo { font-family: 'Oswald', sans-serif; font-weight: 700; color: var(--tx); }
.footer-crosslink { font-size: .8rem; }
.footer-crosslink a { color: var(--ac); text-decoration: none; font-weight: 600; }
.footer-crosslink a:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .cta-final { padding: 64px 24px; }
  footer { padding: 24px; }
}
```

- [ ] **Step 2: Add FAQ + CTA final + footer markup to `landing-fuerza.html`, after the "proceso" `</section>` and before `</body>`**

```html
<section class="section faq" id="faq">
  <div class="section-inner">
    <div class="eyebrow">Preguntas frecuentes</div>
    <h2>Lo que más me preguntan</h2>
    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">¿Voy a hincharme si entreno fuerza? <span class="faq-icon">+</span></button>
        <div class="faq-a">No. Ganar volumen muscular visible requiere años de entrenamiento específico y superávit calórico sostenido — no pasa "por accidente". El entrenamiento de fuerza para mujeres, en la gran mayoría de los casos, tonifica y define, no agranda.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">¿Cuánto tiempo hasta ver cambios en mi composición corporal? <span class="faq-icon">+</span></button>
        <div class="faq-a">Los primeros cambios (más energía, mejor postura, ropa que calza distinto) suelen notarse entre la 3ra y 4ta semana. Cambios visibles más marcados en composición corporal, entre los 2 y 3 meses con constancia.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Nunca hice CrossFit, ¿es seguro para mí? <span class="faq-icon">+</span></button>
        <div class="faq-a">Sí. Todo movimiento se escala a tu nivel actual — no hay un estándar único que tengas que cumplir desde el día uno. Empezamos por técnica, después sumamos intensidad.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">¿Las sesiones son presenciales o virtuales? <span class="faq-icon">+</span></button>
        <div class="faq-a">Trabajo de las dos formas. Las presenciales permiten corrección técnica en tiempo real; las virtuales son ideales si preferís entrenar en tu propio gimnasio o en casa con seguimiento por la app.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">¿Qué necesito para empezar? <span class="faq-icon">+</span></button>
        <div class="faq-a">Ropa cómoda y ganas de entrenar. Si entrenás en un gimnasio, el equipamiento estándar alcanza para arrancar cualquiera de los programas.</div>
      </div>
    </div>
    <div class="section-cta">
      <div class="cta-row">
        <a class="btn-wa" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Tengo una pregunta</a>
        <a class="btn-app" href="https://angelmeier-fit.web.app/suscripcion" target="_blank">Ya sé qué quiero — suscribirme</a>
      </div>
      <span class="section-cta-note">Te respondo por WhatsApp</span>
    </div>
  </div>
</section>

<section class="cta-final">
  <h2>Dejá de improvisar<br>tu entrenamiento</h2>
  <p>Un plan con progresión real, hecho para tu objetivo — no una rutina genérica.</p>
  <div class="cta-row">
    <a class="btn-wa" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank">Escribime - es gratis</a>
    <a class="btn-app" href="https://angelmeier-fit.web.app/suscripcion" target="_blank">Ya sé qué quiero — suscribirme</a>
  </div>
</section>

<footer>
  <div class="footer-row">
    <div class="footer-logo">Angel Meier</div>
    <div>2026 · Fuerza y Composición Corporal · Buenos Aires</div>
  </div>
  <div class="footer-crosslink">¿Buscás recuperar movilidad después de los 50? <a href="landing.html">Ver ese programa →</a></div>
</footer>

<a class="wa-float" href="https://wa.me/541172399988?text=Hola%20Angel%2C%20vi%20tu%20p%C3%A1gina%20y%20quiero%20entrenar%20fuerza%2FCrossFit." target="_blank" title="Escribime por WhatsApp" style="position: fixed; bottom: 28px; right: 28px; z-index: 200; background: var(--wa); color: #fff; width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 24px #25d36650;">
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>

<script>
function toggleFaq(btn) {
  var item = btn.parentElement;
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(el) { el.classList.remove('open'); });
  if (!isOpen) item.classList.add('open');
}
</script>
```

- [ ] **Step 3: Verify `landing-fuerza.html` end-to-end in browser**

Refresh, click a FAQ question (expected: expands, icon rotates 45°, others collapse), scroll to CTA final (expected: black background, both buttons centered), confirm footer shows the cross-link to `landing.html`, click it (expected: navigates to the +50 landing).

- [ ] **Step 4: Add the reciprocal cross-link to `landing.html`**

Modify `landing.html`'s existing `<footer>` block:

```html
<footer>
  <div class="footer-logo">Angel Meier</div>
  <div>2026 · Movimiento y Bienestar · Buenos Aires</div>
</footer>
```

Replace with:

```html
<footer>
  <div class="footer-logo">Angel Meier</div>
  <div>2026 · Movimiento y Bienestar · Buenos Aires</div>
  <div style="font-size:.8rem">¿Buscás fuerza, CrossFit o mejorar tu composición corporal? <a href="landing-fuerza.html" style="color:var(--ac);font-weight:600">Ver ese programa →</a></div>
</footer>
```

Add matching flex-column layout so the extra line doesn't break the existing footer's `space-between` row — modify the existing `footer { ... }` CSS rule in `landing.html`:

```css
footer { padding: 32px 64px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font-size: .78rem; color: var(--mu); border-top: 1px solid var(--border); }
```

(This replaces the current `footer { padding: 32px 64px; display: flex; align-items: center; justify-content: space-between; font-size: .78rem; color: var(--mu); border-top: 1px solid var(--border); }` rule — the mobile-only override further down in the `@media (max-width: 768px)` block that also sets `flex-direction: column` becomes redundant but harmless; leave it.)

- [ ] **Step 5: Verify `landing.html` cross-link in browser**

Refresh `http://localhost:5051/landing.html`, scroll to footer. Expected: centered footer with logo, year line, and a new "¿Buscás fuerza, CrossFit...?" line with an orange link. Click it — expected: navigates to `landing-fuerza.html`.

- [ ] **Step 6: Commit**

```bash
git add landing-fuerza.html landing.html
git commit -m "Agregar FAQ, CTA final y cross-link entre landing-fuerza y landing +50"
```

---

### Task 5: Deploy and verify in production

**Files:** none (deploy-only task)

- [ ] **Step 1: Deploy hosting**

```bash
firebase deploy --only hosting
```

Expected: `Deploy complete!` and hosting URL `https://angelmeier-fit.web.app`.

- [ ] **Step 2: Verify both pages live**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://angelmeier-fit.web.app/landing-fuerza.html
curl -s -o /dev/null -w "%{http_code}\n" https://angelmeier-fit.web.app/landing.html
```

Expected: both print `200`.

- [ ] **Step 3: Spot-check cross-links in production**

```bash
curl -s https://angelmeier-fit.web.app/landing.html | grep -o 'landing-fuerza.html'
curl -s https://angelmeier-fit.web.app/landing-fuerza.html | grep -o 'landing.html'
```

Expected: both commands print at least one match.
