# AgentPay Frontend

Dashboard and Stellar wallet integration for the AgentPay protocol (machine-to-machine payments on Stellar).

## Overview

- **Stack:** Next.js 16, React, TypeScript, Tailwind CSS
- **Purpose:** AgentPay branding, dashboard placeholder, and future wallet/API integration

## Prerequisites

- Node.js 18+
- npm

## Setup for contributors

1. **Clone the repo** (or add remote and pull):
   ```bash
   git clone <repo-url> && cd agentpay-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify setup**:
   ```bash
   npm run build
   npm test
   ```

4. **Run locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
agentpay-frontend/
├── src/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       └── page.test.tsx
├── package.json
├── jest.config.ts
├── jest.setup.ts
└── .github/workflows/
    └── ci.yml            # CI: build, test
```

## Environment variables

| Variable | Visibility | Default | Purpose |
|----------|------------|---------|---------|
| `NEXT_PUBLIC_AGENTPAY_API_BASE` | public (bundled into client JS) | `http://localhost:3001` | Base URL for the AgentPay backend. Validated by `resolveApiBase()` in `src/lib/resolveApiBase.ts` and rejected in production if non-https except for `localhost` / `127.0.0.1`. |

Because the variable is `NEXT_PUBLIC_*`, its value is exposed to the browser. Never put API secrets in it - it is used only for routing public HTTP requests.

## Security headers

A baseline security header set (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, HSTS) is wired up in `next.config.ts` via `src/lib/securityHeaders.ts`. The CSP `connect-src` directive tracks `NEXT_PUBLIC_AGENTPAY_API_BASE` automatically; `<a href>` links to external sites (`https://stellar.org`, etc.) remain navigable.

## Event log rendering

The `/events` page renders server-supplied JSON payloads. Each payload is serialised through `safeStringify` (`src/lib/format.ts`) with a hard cap (`EVENT_PAYLOAD_MAX_CHARS`, default 5,000 chars) and a visible `…(truncated)` marker. Circular references, `BigInt`, functions, and malformed timestamps are replaced with safe sentinels so a bad payload can't crash the page.

## Anti-FOUC theming

To prevent a flash of the wrong colour scheme (FOUC) when a user has chosen dark mode, a tiny blocking inline `<script>` is injected into `<head>` in `src/app/layout.tsx` **before the body renders**:

1. It reads `localStorage.getItem("agentpay.theme")` (the key is `THEME_STORAGE_KEY` exported from `src/lib/theme.ts` — single source of truth, no key drift).
2. If the stored value is `"dark"`, it toggles the `dark` class on `<html>` immediately.
3. If the stored value is `"light"`, it leaves `dark` absent.
4. Otherwise (absent, `"system"`, or any corrupt value) it falls back to `window.matchMedia("(prefers-color-scheme: dark)")` so the OS setting is honoured.
5. The `localStorage` access is wrapped in `try/catch` so private-browsing environments that throw on storage access degrade gracefully.

The `<html>` element carries `suppressHydrationWarning` because the server renders a classless element while the client may have already mutated the class list — React is told this single attribute is expected to differ.

CSS in `src/app/globals.css`:
- `html.dark` / `html.light` provide class-based variable overrides (driven by the script and `ThemeToggle`).
- `@media (prefers-color-scheme: dark)` remains as a **no-JS fallback** only.
- Theme transitions are wrapped in `@media (prefers-reduced-motion: no-preference)` so users who have requested reduced motion see instant switches.

## Commands

| Command | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run Jest with coverage |
| `npm run dev` | Development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler |

## CI/CD

On push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow, branch naming convention, local checks, and UI accessibility expectations.

## License

MIT
