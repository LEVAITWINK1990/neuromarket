# Seed images

This directory holds placeholder images referenced by `prisma/seed.ts`.

The seed script uses relative URLs (e.g. `/seed/writing.svg`) so the dev
environment doesn't reach out to third-party CDNs (Unsplash etc.) — those
domains were removed from `next.config.mjs` `images.remotePatterns` per
TZ §10.1.

You can drop real .jpg / .png files in here named to match the URLs the
seed script writes. The minimal default is a single placeholder SVG that
ships with the repo; the seed script never crashes on missing files (the
URL is just a string in the DB).
