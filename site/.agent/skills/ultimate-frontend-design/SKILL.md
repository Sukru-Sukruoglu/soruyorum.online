---
name: ultimate-frontend-design
description: >
  Ultimate frontend design & development skill combining production-grade UI/UX intelligence
  with MCP-powered design generation, AI image creation, and 3D animations. Use this skill
  whenever the user asks to build, design, create, or improve any frontend interface — websites,
  landing pages, dashboards, mobile UIs, React/Next.js components, interactive widgets,
  presentations, event platforms, SaaS products, or any visual web experience. Also triggers
  for: UI reviews, design system creation, 3D animations, glassmorphism/neumorphism/brutalism
  or any named UI style, responsive layouts, micro-interactions, accessibility improvements,
  color palette selection, typography pairing, component libraries, dark mode, motion design,
  SVG illustrations, hero sections, pricing pages, onboarding flows, admin panels, or requests
  involving Google Stitch, 21st.dev Magic, Nano Banana image generation, or Framer Motion/GSAP/
  Three.js animations. This skill is the go-to for ALL visual frontend work — if the output
  will be seen by human eyes in a browser or on a screen, this skill applies.
---

# Ultimate Frontend Design Skill

This skill combines four powerhouse sources into a unified design intelligence system:

1. **Claude's Native Frontend Design** — Production-grade aesthetics, bold creative direction
2. **UI UX Pro Max** — 161 industry rules, 67 styles, 57 font pairings, design system generation
3. **Google Stitch MCP** — AI-generated UI screens with design DNA extraction
4. **Nano Banana 2 MCP** — AI image generation via Gemini for assets, illustrations, thumbnails
5. **21st.dev Magic MCP** — Modern React component generation from natural language
6. **3D & Animation Layer** — Three.js, Framer Motion, GSAP, CSS animations, Lottie

## Phase 1: Design Intelligence (Before Writing Code)

Before any code, run through this design reasoning pipeline:

### 1.1 Context Analysis
- **What** is being built? (landing page, dashboard, mobile app, component, etc.)
- **Who** is the audience? (developers, enterprise, consumers, Gen Z, etc.)
- **What industry?** Match to one of the 161 product categories below
- **What platform?** Web, mobile, spatial, desktop
- **What stack?** React/Next.js, Vue/Nuxt, HTML+Tailwind, Svelte, etc.

### 1.2 Design System Generation

Based on context analysis, generate a complete design system:

```
┌─────────────────────────────────────────────────┐
│  DESIGN SYSTEM OUTPUT                           │
├─────────────────────────────────────────────────┤
│  Pattern    → Landing page structure/layout     │
│  Style      → From 67 available UI styles       │
│  Colors     → Industry-appropriate palette      │
│  Typography → Curated font pairing              │
│  Effects    → Animations & micro-interactions   │
│  Anti-pats  → What NOT to do                    │
│  Checklist  → Pre-delivery quality gates        │
└─────────────────────────────────────────────────┘
```

### 1.3 Style Selection Guide

Pick ONE dominant style and commit fully. Reference `references/styles.md` for the complete catalog. Key categories:

**Modern Essentials**: Glassmorphism, Neumorphism, Bento Grid, Aurora UI, Liquid Glass
**Bold & Expressive**: Brutalism, Neubrutalism, Cyberpunk, Memphis, Vaporwave
**Refined & Professional**: Swiss Modernism 2.0, Editorial Grid, Minimalism, Soft UI Evolution
**Immersive**: 3D & Hyperrealism, Parallax Storytelling, Motion-Driven, Spatial UI (VisionOS)
**Specialized**: AI-Native UI, HUD/Sci-Fi, Pixel Art, E-Ink/Paper, Gen Z Chaos

### 1.4 Anti-Pattern Checklist (ALWAYS verify before delivery)

- [ ] No emojis used as icons — use SVG icons (Lucide, Heroicons)
- [ ] `cursor-pointer` on ALL clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px
- [ ] No generic AI aesthetics (Inter font, purple gradients on white)
- [ ] No cookie-cutter layouts — every design must feel custom
- [ ] Loading states for async operations
- [ ] Error states designed (not just red text)

## Phase 2: MCP Integration Layer

This skill leverages external MCP servers when available. Check what's connected and use accordingly.

### 2.1 Google Stitch MCP — Design Generation

**When to use**: Creating full-page designs, extracting design DNA from existing screens, maintaining visual consistency across multiple pages.

**MCP Configuration**:
```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "your-api-key"
      }
    }
  }
}
```

**Key Tools**:
- `generate_screen_from_text` — Generate new UI screens from text prompts
- `extract_design_context` — Extract "Design DNA" (fonts, colors, layouts) from existing screens
- `get_screen_code` / `fetch_screen_code` — Download raw HTML/CSS of generated screens
- `build_site` — Build multi-page site from project, mapping screens to routes
- `list_projects` / `list_screens` — Browse existing design projects

**Best Practice — Consistency Flow**:
1. Generate first screen
2. Extract design DNA from that screen
3. Pass DNA as context when generating subsequent screens
4. This ensures visual consistency across all pages

### 2.2 Nano Banana 2 MCP — AI Image Generation

**When to use**: Creating hero images, thumbnails, illustrations, icons, background textures, product mockups, character art, social media visuals.

**MCP Configuration** (choose one):
```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "uvx",
      "args": ["nanobanana-mcp-server@latest"],
      "env": { "GEMINI_API_KEY": "your-gemini-api-key" }
    }
  }
}
```
Or npm-based:
```json
{
  "mcpServers": {
    "nano-banana-2": {
      "command": "npx",
      "args": ["-y", "nano-banana-2-mcp"],
      "env": { "GEMINI_API_KEY": "your-api-key" }
    }
  }
}
```

**Key Tools**:
- `generate_image` — Create new images from text prompts (up to 4K resolution)
- `edit_image` — Modify existing images with text instructions
- `continue_editing` — Iterate on the last generated/edited image

**Capabilities**:
- Google Search Grounding for factually accurate visuals
- Subject Consistency — up to 5 characters and 14 objects per scene
- Precision text rendering in images
- Up to 3840px resolution at Flash speed

### 2.3 21st.dev Magic MCP — Component Generation

**When to use**: Quickly generating modern React/TypeScript UI components — hero sections, pricing tables, navigation bars, contact forms, feature grids, testimonial carousels, etc.

**MCP Configuration**:
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": { "API_KEY": "your-21st-dev-api-key" }
    }
  }
}
```

**Usage**: Type `/ui` followed by component description. Magic generates multiple style variations with clean TypeScript, proper props, and responsive design.

**Capabilities**:
- Multiple style variations per request
- Full TypeScript support
- SVGL integration for brand logos/icons
- Community component library access
- Component enhancement with animations

## Phase 3: 3D & Animation Layer

### 3.1 Animation Technology Selection

| Need | Technology | When to Use |
|------|-----------|-------------|
| Page transitions | Framer Motion | React apps, smooth page-level animations |
| Scroll effects | GSAP ScrollTrigger | Complex scroll-driven storytelling |
| 3D scenes | Three.js / React Three Fiber | Product showcases, immersive experiences |
| Micro-interactions | CSS Animations | Hover effects, loading spinners, toggles |
| Complex illustrations | Lottie | After Effects animations in web |
| Particle effects | tsParticles | Backgrounds, celebrations, ambient |
| SVG animation | GSAP / CSS | Logo reveals, icon animations |

### 3.2 Three.js Integration (3D)

For 3D elements in web projects:

```tsx
// React Three Fiber setup
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <Environment preset="studio" />
      <Float speed={2} rotationIntensity={0.5}>
        {/* 3D content here */}
      </Float>
      <OrbitControls enableZoom={false} />
    </Canvas>
  )
}
```

**3D Best Practices**:
- Always provide fallback for non-WebGL browsers
- Use `Suspense` with loading indicators
- Lazy-load 3D scenes (they're heavy)
- Prefer `@react-three/drei` helpers over raw Three.js
- Use `Environment` presets for quick realistic lighting
- Consider `prefers-reduced-motion` — disable autorotation
- For Claude.ai artifacts: use vanilla Three.js (r128) via CDN

### 3.3 Framer Motion Patterns

```tsx
// Staggered reveal on scroll
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}
```

### 3.4 GSAP for Complex Animations

```js
// ScrollTrigger pinning
gsap.to(".hero-text", {
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom center",
    scrub: true,
    pin: true
  },
  y: -100,
  opacity: 0
})
```

### 3.5 CSS-Only Animation Patterns (for Artifacts)

When building in Claude.ai artifacts (React .jsx or .html), prefer CSS-only animations since external libraries aren't always available:

```css
/* Glassmorphism card with hover lift */
.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Gradient animation */
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-gradient {
  background: linear-gradient(270deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
  background-size: 400% 400%;
  animation: gradient-shift 8s ease infinite;
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}
```

## Phase 4: Typography & Color Intelligence

### 4.1 Font Pairing Strategy

Read `references/typography.md` for the full 57 curated pairings. Quick reference by mood:

| Mood | Display Font | Body Font |
|------|-------------|-----------|
| Elegant luxury | Cormorant Garamond | Montserrat |
| Modern tech | Space Grotesk | Inter |
| Creative agency | Clash Display | Satoshi |
| Editorial | Playfair Display | Source Sans Pro |
| Minimal clean | Outfit | DM Sans |
| Playful | Fredoka One | Nunito |
| Corporate trust | Merriweather | Open Sans |
| Futuristic | Orbitron | Exo 2 |

**Rules**:
- NEVER use Arial, Roboto, or system fonts as primary
- Always load via Google Fonts or CDN
- Display font for headings only (h1-h3)
- Body font for everything else
- Max 2 font families per project

### 4.2 Color Palette Generation

Match palette to industry. Key principles:
- Dominant color + 1-2 accents outperforms evenly distributed palettes
- Dark text on light backgrounds (or vice versa) — never low contrast
- CTA buttons must contrast sharply with background
- Test palettes with color blindness simulators
- Use CSS custom properties for easy theming

Example industry palettes:

**SaaS/Tech**: Deep navy (#1a1a2e) + Electric blue (#00d4ff) + White
**Healthcare**: Soft teal (#4ECDC4) + Warm gray (#2C3E50) + White (#FAFAFA)
**E-commerce Luxury**: Black (#000) + Gold (#D4AF37) + Cream (#FFF5E6)
**Event/Entertainment**: Vivid red (#FF3B30) + Dark (#1C1C1E) + White
**Fintech**: Deep purple (#5B2C6F) + Mint (#00C9A7) + Charcoal (#2D3436)

## Phase 5: Implementation Workflow

### 5.1 Decision Tree — Which Tool for What

```
User Request
    │
    ├─ "Generate a full page design" ──→ Google Stitch MCP
    │     └─ Then extract code + adapt to stack
    │
    ├─ "Create a React component" ──→ 21st.dev Magic MCP
    │     └─ /ui [description] → pick best variant
    │
    ├─ "I need hero images/illustrations" ──→ Nano Banana 2 MCP
    │     └─ generate_image with detailed prompt
    │
    ├─ "Add 3D elements" ──→ Three.js / R3F
    │     └─ Canvas + Environment + drei helpers
    │
    ├─ "Add animations" ──→ Framer Motion (React) or GSAP (vanilla)
    │     └─ For artifacts: CSS-only animations
    │
    └─ "Build it from scratch" ──→ Full manual implementation
          └─ Design system → Typography → Colors → Code
```

### 5.2 Implementation Checklist

1. **Design System** — Generate or define (colors, fonts, spacing, components)
2. **Layout** — Mobile-first responsive grid
3. **Typography** — Load fonts, set scale (use `clamp()` for fluid)
4. **Colors** — CSS custom properties for all colors
5. **Components** — Build bottom-up (atoms → molecules → organisms)
6. **Animations** — Add after layout is solid
7. **Assets** — Generate or source images/illustrations
8. **Accessibility** — ARIA labels, keyboard nav, screen reader testing
9. **Performance** — Lazy load images, code split, optimize fonts
10. **Polish** — Micro-interactions, transitions, loading states

### 5.3 Stack-Specific Notes

**React / Next.js**: Use Tailwind CSS or CSS Modules. Framer Motion for animations. shadcn/ui for rapid component development. Server Components for performance.

**HTML + Tailwind (Artifacts)**: Single file. Inline Tailwind classes. CSS animations via `<style>` tag. Import from cdnjs when needed.

**React Artifacts (.jsx in Claude.ai)**: Single file with default export. Tailwind utility classes only (no compiler). Available: lucide-react, recharts, d3, Three.js (r128), lodash, shadcn/ui.

**Vue / Nuxt**: Nuxt UI for components. Vue transitions for animations.

**Svelte**: Built-in transitions and animations. SvelteKit for full apps.

## Phase 6: Quality Gates

Before delivering any frontend output, verify:

### Visual Quality
- [ ] Typography hierarchy is clear and intentional
- [ ] Color palette is cohesive (max 5 colors)
- [ ] Spacing is consistent (use 4px/8px grid)
- [ ] No orphan/widow text in key areas
- [ ] Images have proper aspect ratios
- [ ] Icons are consistent style (don't mix sets)

### Technical Quality
- [ ] Semantic HTML (header, main, nav, footer, section, article)
- [ ] Responsive at all breakpoints
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44px on mobile
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Color contrast passes WCAG AA

### Performance
- [ ] Images optimized (WebP, proper sizing)
- [ ] Fonts loaded efficiently (display: swap)
- [ ] No layout shift on load
- [ ] Critical CSS inlined or above fold
- [ ] Animations use GPU-accelerated properties (transform, opacity)

## References

For detailed catalogs, read these reference files as needed:
- `references/styles.md` — All 67 UI styles with descriptions and best-use cases
- `references/typography.md` — 57 curated font pairings
- `references/colors.md` — 161 industry-specific color palettes
- `references/mcp-setup.md` — Detailed MCP server setup instructions
- `references/animation-patterns.md` — Animation code examples and patterns
