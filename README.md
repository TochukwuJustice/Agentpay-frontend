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
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── page.tsx                                 # /
│   │   ├── about/page.tsx                           # /about
│   │   ├── admin/page.tsx                           # /admin
│   │   ├── agents/page.tsx                         # /agents
│   │   │   └── [agent]/page.tsx                   # /agents/:agent
│   │   ├── api-keys/page.tsx                      # /api-keys
│   │   ├── changelog/page.tsx                      # /changelog
│   │   ├── docs/page.tsx                           # /docs
│   │   ├── events/page.tsx                        # /events
│   │   ├── export/page.tsx                        # /export
│   │   ├── search/page.tsx                        # /search
│   │   ├── services/page.tsx                     # /services
│   │   │   ├── [serviceId]/page.tsx            # /services/:serviceId
│   │   │   ├── [serviceId]/agents/page.tsx    # /services/:serviceId/agents
│   │   │   └── [serviceId]/edit/page.tsx      # /services/:serviceId/edit
│   │   │   └── new/page.tsx                   # /services/new
│   │   ├── settings/page.tsx                     # /settings
│   │   ├── stats/page.tsx                        # /stats
│   │   ├── usage/page.tsx                        # /usage
│   │   ├── webhooks/page.tsx                     # /webhooks
│   │   └── (shared components & libs live outside app/)
│   ├── components/                                # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   └── lib/                                       # API client, hooks, formatting, etc.
│       ├── apiClient.ts
│       ├── resolveApiBase.ts
│       ├── useApi.ts
│       └── ...
├── package.json
├── jest.config.ts
├── jest.setup.ts
└── .github/workflows/
    └── ci.yml                                    # CI: build, test
```

## Shared components

See [docs/components.md](docs/components.md) for the shared component catalog,
including prop tables, usage examples, and accessibility notes for the
primitives in `src/components`.

## Environment variables

| Variable | Visibility | Default | Purpose |
|----------|------------|---------|---------|
| `NEXT_PUBLIC_AGENTPAY_API_BASE` | public (bundled into client JS) | `http://localhost:3001` | Base URL for the AgentPay backend. Validated by `resolveApiBase()` in `src/lib/resolveApiBase.ts` and rejected in production if non-https except for `localhost` / `127.0.0.1`. |

Because the variable is `NEXT_PUBLIC_*`, its value is exposed to the browser. Never put API secrets in it - it is used only for routing public HTTP requests.

## Security headers

A baseline security header set (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, HSTS) is wired up in `next.config.ts` via `src/lib/securityHeaders.ts`. The CSP `connect-src` directive tracks `NEXT_PUBLIC_AGENTPAY_API_BASE` automatically; `<a href>` links to external sites (`https://stellar.org`, etc.) remain navigable.

## Webhook registration validation

The `/webhooks` form (`src/app/webhooks/page.tsx`) validates client-side before calling the API:

- **URL**: only `https://` URLs are accepted. `http://`, `javascript:`, and other non-`https` schemes (or values that fail to parse as a URL at all) are rejected with a field-level error surfaced via `TextField`'s `error` prop (`aria-invalid="true"`, message linked through `aria-describedby`). The native `type="url"` / `required` attributes still apply and run first; the `https`-only check augments them.
- **Events**: the comma-separated events field is normalised before submit — each entry is trimmed, empty entries (including whitespace-only and trailing-comma artifacts) are dropped, and duplicates are removed while preserving first-seen order. Submit is blocked with a field error if the normalised list is empty.

## Event log rendering

The `/events` page renders server-supplied JSON payloads. Each payload is serialised through `safeStringify` (`src/lib/format.ts`) with a hard cap (`EVENT_PAYLOAD_MAX_CHARS`, default 5,000 chars) and a visible `…(truncated)` marker. Circular references, `BigInt`, functions, and malformed timestamps are replaced with safe sentinels so a bad payload can't crash the page.

## Document titles

The root layout keeps the home route on the default `AgentPay` title and applies the template `"%s — AgentPay"` to route-specific titles.

| Route | Title |
|-------|-------|
| `/` | `AgentPay` |
| `/services` | `Services` |
| `/services/new` | `New service` |
| `/usage` | `Usage metering` |
| `/agents` | `Agents` |
| `/admin` | `Admin` |
| `/stats` | `Stats` |
| `/events` | `Event log` |
| `/webhooks` | `Webhooks` |
| `/api-keys` | `API keys` |
| `/search` | `Search` |
| `/services/[serviceId]` | `Service {serviceId}` |
| `/services/[serviceId]/edit` | `Edit service {serviceId}` |
| `/services/[serviceId]/agents` | `Top agents {serviceId}` |
| `/agents/[agent]` | `Agent {agent}` |

## Services list paging

The `/services` page now uses server-driven pagination with the shared `Spinner`, `EmptyState`, and `Pagination` components.

- Requests are sent as `GET /api/v1/services?page=N&limit=25`.
- The page assumes the backend returns a paged payload with `services` or `items`, plus `page` and `pageCount`.
- If the backend clamps an out-of-range request, the UI follows the server-provided `page` and `pageCount` so the visible indicator stays in sync.
- Service rows link through to `/services/:serviceId` using encoded IDs.

## Commands

| Command | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run Jest with coverage | (not defined in this repo snapshot)
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
