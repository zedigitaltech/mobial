# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains the Next.js App Router UI, layouts, and API handlers under `src/app/api/**`. Shared UI lives in `src/components`, with `ui/` for shadcn primitives plus feature folders like `common/`, `store/`, `admin/`, and `auth/`. Put reusable logic in `src/lib`, workflows in `src/services`, and state, hooks, and i18n assets in `src/contexts`, `src/hooks`, and `src/messages`. Database schema and seeds are in `prisma/`, static assets in `public/`, and maintenance scripts in `scripts/`. Keep unit tests beside code as `*.test.ts(x)`; browser tests live in `e2e/`.

## Build, Test, and Development Commands
Use the same toolchain as CI: Node 22 with `npm ci`.

- `npm run dev` starts the app on `http://localhost:3000` and logs to `dev.log`.
- `npm run lint` runs ESLint across the repo.
- `npx tsc --noEmit` runs the typecheck used in CI.
- `npm test` runs Vitest; `npm run test:coverage` adds V8 coverage output.
- `npm run test:e2e` runs Playwright; set `E2E_BASE_URL` to point at an existing environment.
- `npm run build` creates the standalone production bundle. `npm start` requires Bun because the built server is launched with `bun`.
- `npm run db:push`, `npm run db:migrate`, and `npm run db:generate` manage Prisma schema changes.

## Coding Style & Naming Conventions
Write TypeScript first, use 2-space indentation, and keep modules focused on a single concern. Follow existing naming patterns: React components in `PascalCase`, hooks in `use-*.ts(x)`, route handlers in `route.ts`, Vitest files in `*.test.ts(x)`, and Playwright specs in `*.spec.ts`. Use the `@/` alias for imports from `src/`. There is no Prettier config here, so match the surrounding file’s quote and semicolon style and let ESLint be the enforced baseline.

## Testing Guidelines
Vitest runs in `jsdom` with shared mocks from `src/test/setup.ts`; extend those mocks instead of recreating Prisma or Next.js stubs per test. Add or update tests whenever you touch logic in `src/lib`, `src/services`, or `src/app/api`. No numeric coverage threshold is configured, but CI uploads coverage and changed code should stay exercised.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `fix:`, `feat:`, and `revert:`. Keep commits narrowly scoped and mention schema or environment changes explicitly. Pull requests should include a short problem/solution summary, linked task or issue, test evidence (`npm run lint`, `npm test`, `npx tsc --noEmit`), and screenshots for visible UI changes. Never commit `.env*`, `dev.log`, `server.log`, `coverage/`, or `.next/`.
