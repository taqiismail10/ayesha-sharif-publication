# Premium Visual Asset Guide

This guide lists the manual assets Ayesha-Sharif Publication should add or replace to keep the site premium, fast, and consistent.

## Logo Assets

### `public/logo/logo.png`
- Use: Header, favicon-adjacent brand moments, light backgrounds.
- Recommended format: transparent PNG.
- Recommended size: `512x512` or `640x640`.
- Target weight: under `120 KB` after compression.
- Style: clean publishing-house mark, deep navy and royal gold, readable at small sizes.

### `public/logo/logo-white.png`
- Use: Footer and dark navy backgrounds.
- Recommended format: transparent PNG.
- Recommended size: `512x512` or `640x640`.
- Target weight: under `120 KB` after compression.
- Style: white/gold version of the same logo, no extra shadow baked into the file.

### Optional `public/logo/logo-mark.svg`
- Use: Small icon moments, badges, loading states, and future app-style UI.
- Recommended format: SVG.
- Recommended size: square artboard, `512x512` viewBox.
- Style: simple monogram or publication mark that still works at `24px`.

## Homepage Hero Image

### `public/banners/homepage-banner.webp`
- Use: Optional hero/editorial background or future promotional banner.
- Recommended dimensions: `1920x1080`.
- Minimum dimensions: `1600x900`.
- Target weight: `180-350 KB`.
- Format: WebP, quality `75-85`.
- Visual direction: warm premium study table, arranged books, publication mood, soft natural light, Bangladeshi academic/readers vibe.
- Avoid: generic ecommerce stock images, dark unreadable images, low-resolution book piles, heavy blur, crypto/SaaS-style gradients.

Current fallback asset:
- `public/banners/homepage-banner.png` exists, but a compressed WebP replacement is recommended.

## Book Cover Images

### `public/book-covers/*.webp` or `public/book-covers/*.jpg`
- Use: Product cards, book details, cart, related books.
- Recommended ratio: portrait `3:4`.
- Recommended dimensions: `900x1200`.
- Minimum dimensions: `600x800`.
- Target weight: `80-180 KB` per cover.
- Format: WebP preferred; JPG acceptable for photographic covers.
- Naming: use readable slugs, for example `modern-bangla-essays.webp`.
- Style: consistent title hierarchy, strong author/publisher placement, navy/cream/gold family when possible.
- Avoid: random low-quality images, mixed aspect ratios, stretched covers, screenshots, watermarked images.

## Future Learning Teaser

### `public/banners/learning-platform-teaser.svg`
- Use: Future learning platform teaser section.
- Recommended format: SVG for crisp CSS-friendly illustration.
- Recommended artboard: `1200x800`.
- Target weight: under `90 KB`.
- Visual direction: book + exam paper + digital learning cards + soft future-learning glow.
- Keep it warm and educational, not crypto/SaaS.
- Do not imply active AI features, fake modules, or fake statistics.

### Alternative `public/banners/learning-platform-teaser.webp`
- Recommended dimensions: `1400x900`.
- Target weight: `160-280 KB`.
- Use if a bitmap editorial illustration fits the brand better than SVG.

## Optional Lightweight Animation

### Optional `public/animations/hero-books.json` or `public/animations/learning-teaser.svg`
- Use only one lightweight animation if added.
- Recommended format: Lottie JSON or animated SVG.
- Target weight: under `120 KB`.
- Motion direction: gentle book/page movement, subtle glow, or calm study-card movement.
- Do not autoplay distracting motion.
- Respect reduced motion: keep CSS/JS wired so animation pauses or becomes nearly static when users prefer reduced motion.

## Compression Advice

- Convert banners and covers to WebP where possible.
- Use `cwebp`, Squoosh, TinyPNG, ImageOptim, or a similar trusted compressor.
- Do not upload original camera files directly.
- Strip metadata unless it is legally required.
- Check every image on mobile before publishing.
- Keep the public homepage lightweight: avoid adding multiple large animated assets.

## Production Storage Note

For local development, assets can live under `public/`. For multi-instance
production, upload book covers, gallery images, and sample PDFs to Cloudinary,
S3, Cloudflare R2, or another object storage provider, then store the returned
public URL in the admin book fields.

Configure one exact image host in `NEXT_PUBLIC_IMAGE_CDN_HOST`, or set
`CLOUDINARY_CLOUD_NAME` for Cloudinary. Avoid allowing arbitrary remote image
domains in `next.config.ts`.

## Replacement Checklist

1. Add optimized logo files to `public/logo/`.
2. Add `public/logo/logo-mark.svg` if a compact mark is available.
3. Replace or add `public/banners/homepage-banner.webp`.
4. Add real book covers to `public/book-covers/`.
5. Add `public/banners/learning-platform-teaser.svg` or `.webp`.
6. Update book records in the database/seed data to point to the final cover paths.
7. Run `npm run build` after adding assets.
