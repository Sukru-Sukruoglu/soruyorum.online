# Animation Patterns Reference

## CSS-Only Animations (for Artifacts & Lightweight)

### Glassmorphism Card with Hover
```css
.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.35);
  border-color: rgba(255, 255, 255, 0.3);
}
```

### Animated Gradient Background
```css
.gradient-bg {
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Staggered Fade-In (Pure CSS)
```css
.stagger-item {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.6s ease forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0.1s; }
.stagger-item:nth-child(2) { animation-delay: 0.2s; }
.stagger-item:nth-child(3) { animation-delay: 0.3s; }
.stagger-item:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}
```

### Floating Element
```css
.float {
  animation: float 6s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-15px) rotate(1deg); }
  66% { transform: translateY(-8px) rotate(-1deg); }
}
```

### Pulse Glow
```css
.pulse-glow {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
}
```

### Shimmer Loading
```css
.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Text Gradient Animation
```css
.gradient-text {
  background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: text-gradient 3s linear infinite;
}
@keyframes text-gradient {
  to { background-position: 200% center; }
}
```

### Morphing Blob
```css
.blob {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: morph 8s ease-in-out infinite;
}
@keyframes morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
  75% { border-radius: 60% 30% 50% 40% / 60% 40% 60% 30%; }
}
```

---

## Framer Motion Patterns (React)

### Page Load Orchestration
```tsx
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
}
```

### Scroll-Triggered Reveal
```tsx
import { motion, useInView } from 'framer-motion'

function RevealSection({ children }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
```

### Card Hover with Spring
```tsx
<motion.div
  whileHover={{ scale: 1.05, rotateY: 5 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>
```

### Layout Animations
```tsx
<motion.div layout layoutId="card-highlight">
  {/* Content smoothly animates between positions */}
</motion.div>
```

---

## GSAP Patterns

### ScrollTrigger Pin & Scrub
```js
gsap.registerPlugin(ScrollTrigger);

gsap.to(".parallax-bg", {
  yPercent: -30,
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: 1
  }
});
```

### Text Split & Reveal
```js
const chars = new SplitText(".headline", { type: "chars" }).chars;
gsap.from(chars, {
  y: 100,
  opacity: 0,
  rotateX: -90,
  stagger: 0.03,
  duration: 0.8,
  ease: "back.out(1.7)"
});
```

### Timeline Sequence
```js
const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
tl.from(".logo", { scale: 0, duration: 0.6 })
  .from(".nav-item", { y: -30, opacity: 0, stagger: 0.1 }, "-=0.3")
  .from(".hero-text", { x: -100, opacity: 0, duration: 0.8 }, "-=0.4")
  .from(".hero-image", { x: 100, opacity: 0, duration: 0.8 }, "<");
```

---

## Three.js Patterns (3D Web)

### Basic Scene Setup (Vanilla — for Artifacts)
```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(5, 5, 5);
scene.add(ambient, directional);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

### React Three Fiber Setup
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Text3D } from '@react-three/drei'

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <color attach="background" args={['#0a0a0a']} />
      <Environment preset="city" />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
    </Canvas>
  )
}
```

### Particle Field (Three.js r128 — for Artifacts)
```js
const particleCount = 2000;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({
  size: 0.05,
  color: 0x6366f1,
  transparent: true,
  opacity: 0.8
});
const particles = new THREE.Points(geometry, material);
scene.add(particles);

function animate() {
  particles.rotation.y += 0.001;
  particles.rotation.x += 0.0005;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

---

## Lottie Animations

### Web Player Setup
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<div id="lottie-container"></div>
<script>
  lottie.loadAnimation({
    container: document.getElementById('lottie-container'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: '/animations/loading.json'
  });
</script>
```

### React (lottie-react)
```tsx
import Lottie from 'lottie-react'
import animationData from './animation.json'

function LoadingAnimation() {
  return <Lottie animationData={animationData} loop={true} />
}
```

---

## Performance Rules for Animations

1. **GPU-accelerated properties only**: `transform`, `opacity`, `filter`. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`.
2. **`will-change`**: Apply sparingly to elements about to animate: `will-change: transform;`
3. **`prefers-reduced-motion`**: Always respect:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
4. **Frame budget**: Keep animations at 60fps. Heavy 3D = consider 30fps cap.
5. **Lazy-load heavy animations**: Don't load Three.js or GSAP if not in viewport.
6. **requestAnimationFrame**: Always use for JS animations, never `setInterval`.
