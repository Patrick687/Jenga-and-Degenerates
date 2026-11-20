# Jenga & Degenerates (29 & UNHINGED)

A party-game web app for a 29th birthday, played alongside a physical Jenga tower. Guests scan a QR code, open the site on their phones, and get a **Truth**, **Dare**, or **Chaos** prompt whenever they pull a block. No accounts, no names, no backend, no moderator. Everyone's game state lives on their own phone.

## Tech

React 19, TypeScript (strict), Vite, Tailwind CSS v4, Lucide icons, `qrcode`, Vitest. Fonts (Space Grotesk, DM Sans) are bundled, so the app doesn't depend on Google Fonts at the party.

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

`npm run build` produces a static `dist/` folder. There is no server code and no router, so any static host works. The build uses relative asset paths, so it also works from a sub-folder.

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

## Adding or editing prompts

Edit the arrays in `src/features/game/data/`. Keep prompts short, standalone, and passable. **Append new prompts to the end** of an array: IDs are generated from position, and appending keeps IDs stable for anyone mid-game. The data tests check for unique IDs, empty text, duplicates, minimum counts per category, and overly long prompts.
