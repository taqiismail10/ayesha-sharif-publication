Project: Ayesha-Sharif Publication — Next.js 15, TypeScript, Tailwind CSS, Prisma/PostgreSQL.
Stack: App Router, React 19, lucide-react icons, server components where possible.
Goal: Sophisticated, premium, lightweight bookstore UI.
Design language: Editorial calm — think Strand Bookstore meets a modern Bangladeshi literary journal.

COLOR TOKENS (apply these consistently everywhere):
  --sage:       #6B8E6F   → Nav background, primary buttons, category pills, icons
  --forest:     #2D4A2B   → Headings, footer background, emphasis text
  --cream:      #F5F1E8   → Page background
  --white:      #FFFFFF   → Cards, containers
  --gray:       #B0A89C   → Secondary text, borders, placeholders
  --gold:       #D4A574   → Hover states, price highlights, accent lines
  --ink:        #1A1A1A   → Dark body text when needed

FONTS:
  Headings → 'Crimson Text' (Google Font, serif, weights 400 & 600)
  Body/UI  → 'Inter' (Google Font, sans-serif, weight 400 & 500)

ANIMATION PRINCIPLES:

- All transitions: cubic-bezier(0.4, 0, 0.2, 1)
- Fast (hover): 150ms
- Base (appear): 280ms
- Slow (entrance): 450ms
- Use transform + opacity only (GPU-safe)
- Honour prefers-reduced-motion
