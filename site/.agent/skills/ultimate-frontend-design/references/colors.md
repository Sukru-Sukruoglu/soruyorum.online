# Industry Color Palettes Reference

## How to Use
Match your project's industry to find the recommended palette. Use CSS custom properties for easy theming. Primary = dominant, Secondary = supporting, CTA = call-to-action buttons.

## Tech & SaaS

### SaaS Platform
Primary: #1a1a2e | Secondary: #00d4ff | CTA: #6366f1 | BG: #0f0f23 | Text: #e2e8f0
Mood: Professional, trustworthy, modern

### Developer Tools
Primary: #0d1117 | Secondary: #58a6ff | CTA: #3fb950 | BG: #161b22 | Text: #c9d1d9
Mood: Dark, technical, GitHub-inspired

### AI/ML Platform
Primary: #1e1e2e | Secondary: #cba6f7 | CTA: #89b4fa | BG: #11111b | Text: #cdd6f4
Mood: Futuristic, intelligent, Catppuccin-inspired

### Cybersecurity
Primary: #0a0e17 | Secondary: #00ff41 | CTA: #ff3333 | BG: #0d1117 | Text: #00ff41
Mood: Matrix, hacker, alert-ready

### Cloud Infrastructure
Primary: #232f3e | Secondary: #ff9900 | CTA: #146eb4 | BG: #f5f5f5 | Text: #232f3e
Mood: Enterprise, reliable, AWS-inspired

## Finance

### Fintech
Primary: #5B2C6F | Secondary: #00C9A7 | CTA: #FF6B6B | BG: #FAFAFA | Text: #2D3436
Mood: Innovative, trustworthy with energy

### Banking
Primary: #003366 | Secondary: #0066CC | CTA: #FFD700 | BG: #F8F9FA | Text: #1a1a1a
Mood: Conservative trust, gold accents for premium

### Crypto/Web3
Primary: #0D0D0D | Secondary: #00D4AA | CTA: #FFD700 | BG: #1A1A2E | Text: #FFFFFF
Mood: Dark luxury, neon accents, futuristic

### Insurance
Primary: #1B3A5C | Secondary: #4A90D9 | CTA: #E67E22 | BG: #FFFFFF | Text: #333333
Mood: Stable, protective, warm CTA

## Healthcare

### Medical Clinic
Primary: #2C7DA0 | Secondary: #89C2D9 | CTA: #FF6B35 | BG: #F8FFFE | Text: #2D3436
Mood: Clean, calming, professional

### Mental Health
Primary: #7B68EE | Secondary: #DDA0DD | CTA: #FF8C94 | BG: #FFF5F5 | Text: #4A4A4A
Mood: Soft, calming, approachable

### Pharmacy
Primary: #00A86B | Secondary: #7FDBDA | CTA: #FF4444 | BG: #FFFFFF | Text: #1A1A1A
Mood: Fresh, healthy, urgent CTA

### Wellness & Spa
Primary: #E8B4B8 | Secondary: #A8D5BA | CTA: #D4AF37 | BG: #FFF5F5 | Text: #2D3436
Mood: Calming, luxury, organic

## E-commerce

### General E-commerce
Primary: #FF6B35 | Secondary: #FFD166 | CTA: #06D6A0 | BG: #FFFFFF | Text: #1A1A1A
Mood: Energetic, conversion-focused

### Luxury E-commerce
Primary: #000000 | Secondary: #D4AF37 | CTA: #B8860B | BG: #FFF5E6 | Text: #1A1A1A
Mood: Premium, exclusive, black & gold

### Fashion
Primary: #1A1A1A | Secondary: #F5F5DC | CTA: #FF4757 | BG: #FFFFFF | Text: #1A1A1A
Mood: Editorial, clean, minimal

### Food Delivery
Primary: #FF5A5F | Secondary: #FFB400 | CTA: #00C853 | BG: #FFFFFF | Text: #333333
Mood: Appetizing, warm, action-oriented

## Education

### Online Learning
Primary: #4A90D9 | Secondary: #7ED321 | CTA: #FF6B6B | BG: #F5F7FA | Text: #2D3436
Mood: Encouraging, accessible, growth

### University
Primary: #8B0000 | Secondary: #FFD700 | CTA: #2E86AB | BG: #FAFAFA | Text: #1A1A1A
Mood: Traditional, prestigious, academic

### Kids Education
Primary: #FF6B6B | Secondary: #48DBFB | CTA: #FECA57 | BG: #FFF9F0 | Text: #2D3436
Mood: Playful, bright, engaging

## Event & Entertainment

### Event Platform
Primary: #FF3B30 | Secondary: #1C1C1E | CTA: #FFD60A | BG: #FFFFFF | Text: #1A1A1A
Mood: Energetic, bold, attention-grabbing

### Music Streaming
Primary: #1DB954 | Secondary: #191414 | CTA: #FFFFFF | BG: #121212 | Text: #B3B3B3
Mood: Dark, vibrant, Spotify-inspired

### Gaming
Primary: #6C5CE7 | Secondary: #00CEC9 | CTA: #FD79A8 | BG: #0F0F1A | Text: #DFE6E9
Mood: Vivid, immersive, neon

### Conference/Congress
Primary: #2D3436 | Secondary: #0984E3 | CTA: #E17055 | BG: #F5F6FA | Text: #2D3436
Mood: Professional, organized, trustworthy

## Real Estate & Property

### Luxury Real Estate
Primary: #2C3E50 | Secondary: #BDC3C7 | CTA: #D4AF37 | BG: #FAFAFA | Text: #2C3E50
Mood: Upscale, architectural, refined

### Property Marketplace
Primary: #00B894 | Secondary: #55A3E8 | CTA: #FF7675 | BG: #FFFFFF | Text: #2D3436
Mood: Fresh, accessible, trustworthy

## Travel & Hospitality

### Hotel Booking
Primary: #003580 | Secondary: #FFB900 | CTA: #0071C2 | BG: #FFFFFF | Text: #1A1A1A
Mood: Reliable, warm, Booking-inspired

### Travel Blog
Primary: #FF6348 | Secondary: #2ED573 | CTA: #FFA502 | BG: #FFFFF0 | Text: #2F3542
Mood: Adventurous, warm, wanderlust

## CSS Custom Properties Template

```css
:root {
  /* Core palette */
  --color-primary: #1a1a2e;
  --color-secondary: #00d4ff;
  --color-cta: #6366f1;
  --color-bg: #0f0f23;
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  
  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Surface layers */
  --color-surface-1: rgba(255, 255, 255, 0.05);
  --color-surface-2: rgba(255, 255, 255, 0.08);
  --color-surface-3: rgba(255, 255, 255, 0.12);
  
  /* Borders */
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);
}
```

## Contrast Checker
Always verify text readability:
- Normal text (16px): contrast ratio ≥ 4.5:1 (WCAG AA)
- Large text (24px+ or 18.66px bold): ratio ≥ 3:1
- Use tools: WebAIM Contrast Checker, Stark plugin
