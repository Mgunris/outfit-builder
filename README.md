# Outfit Builder

A mobile-first web app prototype for building a personal wardrobe catalog and
trying outfits on yourself before you get dressed.

Everything runs entirely in the browser — clothing photos, your own photos,
and saved outfits are stored locally on your device (IndexedDB). Nothing is
uploaded anywhere.

## Features (v1 prototype)

- **Closet** — photograph or upload clothing items, crop them and erase the
  background with a simple brush, categorize them (tops, bottoms, dresses,
  outerwear, shoes, bags, hats, accessories, jewelry). You can also paste a
  link to an item you found online — the app tries to download the image
  directly; if the site blocks that (common for shopping sites), it tells you
  to save the photo and upload it instead.
- **Me** — upload a few photos of yourself in different poses (standing,
  walking, sitting, or a custom label).
- **Outfit** — pick a pose, then layer clothing cutouts on top of it. Drag to
  reposition, use the corner handle to resize/rotate, and save named outfit
  combinations to revisit later. A "lighting & backdrop" panel lets you try a
  few color/lighting presets as an experimental extra.

## Tech

Vite + React + TypeScript + Tailwind CSS, `idb` for IndexedDB storage. No
backend, no accounts.

## Trying it out

The Closet and Me tabs each have a "load sample data" link in their empty
state. It generates a small set of placeholder clothing icons (drawn on the
fly, not real photos), three pose silhouettes (standing/walking/sitting),
and one pre-built saved outfit — enough to test categorizing, layering,
dragging/resizing/rotating, and saving without needing real photos yet.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL on your phone (same network) or in a desktop
browser. For camera capture on a phone, it needs to be served over HTTPS or
`localhost` — deploy to something like Vercel/Netlify for real phone use, or
use `npm run dev -- --host` on the same Wi-Fi network for testing.

## What's next (not in this prototype)

- Photorealistic AI-generated try-on instead of the flat layered cutouts.
- True background replacement/lighting on your own photos (needs a body
  segmentation model).
- Optional cloud sync if wardrobe photos need to move across devices.
