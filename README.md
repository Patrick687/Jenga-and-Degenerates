# Jenga & Degenerates (29 & UNHINGED)

A party-game web app for a 29th birthday, played alongside a physical Jenga tower. Guests scan a QR code, open the site on their phones, and get a **Truth**, **Dare**, or **Chaos** prompt whenever they pull a block. Guests need no accounts and no names; everyone's game state lives on their own phone. Hosts can add, edit, and delete cards from a password-protected page at `/admin`, backed by a small GraphQL API.

## Tech

Frontend: React 19, TypeScript (strict), Vite, Tailwind CSS v4, react-router, Lucide icons, `qrcode`, Vitest. Backend (`backend/`): NestJS, GraphQL (code-first, Apollo), Prisma ORM, SQLite. Fonts (Space Grotesk, DM Sans) are bundled, so the app doesn't depend on Google Fonts at the party.

## Setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

The dev server prints a `Local` and a `Network` URL. Open the `Network` URL on your phone (same Wi-Fi) to test it.

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server (also reachable from your LAN)     |
| `npm run build`     | Type-check and build to `dist/`               |
| `npm run preview`   | Serve the production build locally            |
| `npm test`          | Run the unit tests once                       |
| `npm run test:watch`| Run tests in watch mode                       |
| `npm run typecheck` | TypeScript check only                         |
| `npm run lint`      | Lint with oxlint                              |

## Set your production URL

The QR code needs your real domain. Copy `.env.example` to `.env.production` and fill it in:

```
VITE_PUBLIC_APP_URL=https://your-domain.com
```

Vite inlines this **at build time**, so set it before `npm run build`. If you forget, the QR modal falls back to the address the page is open at and shows a warning when that address is `localhost` or a private network address. You can also paste a different link into the QR modal; that edit is not saved.

## Generate, download, and print the QR code

1. Open the deployed site, or any build that has `VITE_PUBLIC_APP_URL` set.
2. Tap the QR icon in the top-right.
3. Check that the link under the code is your real domain (no warning banner).
4. **Download** saves a 1024px black-on-white PNG, **Copy link** copies the URL, **Print** opens a print layout with only the code, title, and link.

Scan the printed code with a phone before the party.

## Deploy as a static site

`npm run build` produces a static `dist/` folder. The game itself is static and falls back to the bundled cards if the API is unreachable. The site must be served from a domain root, and unknown paths (such as `/admin`) must fall back to `index.html` (nginx: `try_files $uri /index.html`). `/graphql` must be proxied to the backend, or set `VITE_API_URL`.

- **Netlify:** drag `dist/` onto app.netlify.com/drop, or connect the repo with build command `npm run build` and publish directory `dist`. Set `VITE_PUBLIC_APP_URL` in the site's environment variables.
- **Vercel:** import the repo (Vite is auto-detected) and set `VITE_PUBLIC_APP_URL` in project environment variables.
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`, with `VITE_PUBLIC_APP_URL` set.
- **GitHub Pages / S3 / nginx / any web host:** build locally with the variable set, then upload the contents of `dist/`.

Then point your domain at the host (the host's docs cover DNS) and make sure it serves HTTPS. Copy-to-clipboard and sharing need HTTPS.

## How the game works

- **Modes:** Random, Truth, Dare, Chaos. Switch any time, even mid-prompt.
- **No repeats:** each category is shuffled through before any prompt returns. When a category runs out, only that category resets. Switching modes keeps your progress. The same prompt never appears twice in a row, and Random avoids serving the same category back-to-back.
- **Pass:** skips a prompt and immediately deals another. No penalty, no explanation.
- **Spicy mode:** off by default. When on, flirtier prompts are added to each category.
- **History:** the last 100 prompts, with stats and a reset (with confirmation once there's real history).
- **Storage:** history, used prompts, mode, and the spicy setting are saved in `localStorage` on each device.

## Project structure

```
src/
├── app/App.tsx                     App root (no router: it's one screen)
├── pages/GamePage.tsx              Wires the game hook to the UI
├── components/
│   ├── ui/                         Button, IconButton, Modal (native <dialog>)
│   ├── layout/                     AppShell, Header
│   └── game/                       PromptCard, CategorySelector, GameControls,
│                                   PromptHistory, SpicyModeToggle, QRCodeModal, ...
├── features/game/
│   ├── data/                       truths.ts, dares.ts, chaos.ts, spicy.ts, categories.ts
│   ├── hooks/                      usePromptGenerator, useGamePersistence
│   ├── types/game.types.ts
│   └── utils/                      promptSelector (pure, tested), promptHelpers, persistedState
├── hooks/useCopyToClipboard.ts
├── lib/                            storage.ts, clipboard.ts, qrCode.ts
└── styles/index.css                Tailwind theme, animations, print styles
```

Prompt selection lives in `features/game/utils/promptSelector.ts` as a pure function that takes an injectable random source, which is how the tests make it deterministic.

## Card manager and backend

Open `/admin` (or tap "Host? Manage cards" in How to play), enter the admin password, then create, edit, or delete cards, set the category (Truth, Dare, Chaos), and mark them spicy or mild. The game loads cards from the API on start and keeps a local copy for offline use. Reading cards is public; changing them requires the password.

Run the backend locally (Node.js 20+):

```bash
cd backend
npm install
cp .env.example .env        # then set ADMIN_PASSWORD (8+ characters)
npm run db:migrate          # creates the SQLite database
npm run db:seed             # loads the 122 starter cards (only into an empty database)
npm run start:dev           # http://127.0.0.1:4000/graphql
```

In another terminal run `npm run dev` in the repo root. Vite proxies `/graphql` to port 4000 (override with `API_PROXY_TARGET`). Backend tests: `cd backend && npm test`.

Backend notes: password goes in an `Authorization: Bearer` header and wrong guesses are rate limited; the server listens on 127.0.0.1 so it sits behind a reverse proxy; GraphQL introspection is off in production. The old "Adding or editing prompts" files in `src/features/game/data/` are now only the offline fallback and the seed source.

## Adding or editing prompts (bundled fallback)

Edit the arrays in `src/features/game/data/`. Keep prompts short, standalone, and passable. **Append new prompts to the end** of an array: IDs are generated from position, and appending keeps IDs stable for anyone mid-game. The data tests check for unique IDs, empty text, duplicates, minimum counts per category, and overly long prompts.

## Automatic deploys (GitHub Actions + DigitalOcean)

Every push to `main` runs `.github/workflows/deploy.yml`: test the frontend and backend, build the frontend with `VITE_PUBLIC_APP_URL=https://jenga.codewithpatrick.dev`, rsync the backend source to `/var/www/jenga-api/`, run `deploy/deploy-backend.sh` on the droplet (install, build, `prisma migrate deploy`, seed on first run, and reseed from `seed-cards.json` on every deploy while `RESEED_CARDS` is `'true'` in the workflow (set it to `'false'` to keep `/admin` edits), restart the `jenga-api` systemd service, health check), then rsync `dist/` to `/var/www/jenga/`.

**GitHub repo secrets required:** `SSH_PRIVATE_KEY`, `DROPLET_IP`, `DROPLET_USERNAME`.

**One-time server setup:**
- Frontend: create `/var/www/jenga` owned by the deploy user, install `deploy/nginx-jenga.conf` as an nginx site, add a DNS A record for `jenga`, run `sudo certbot --nginx -d jenga.codewithpatrick.dev`.
- Backend: Node.js 22 unpacked into `/opt/node-22` (side by side with the system Node); `/var/www/jenga-api` and `/var/lib/jenga-api` owned by the deploy user; `/var/www/jenga-api/.env` (mode 600) with `ADMIN_PASSWORD`, `DATABASE_URL=file:/var/lib/jenga-api/jenga.db`, `PORT=4000`, `HOST=127.0.0.1`; `deploy/jenga-api.service` installed in systemd; `deploy/nginx-jenga-api.conf` saved as `/etc/nginx/snippets/jenga-api.conf` and included in the site; passwordless sudo for `systemctl restart jenga-api` and `journalctl -u jenga-api`.
