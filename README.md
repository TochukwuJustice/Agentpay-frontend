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

## Commands

| Command | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm test` | Run Jest tests |
| `npm run dev` | Development server |
| `npm run lint` | Run ESLint |

## CI/CD

On push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow, branch naming convention, local checks, and UI accessibility expectations.

## License

MIT
