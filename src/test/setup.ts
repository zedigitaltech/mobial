import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
    has: vi.fn().mockReturnValue(false),
    entries: vi.fn().mockReturnValue([]),
    forEach: vi.fn(),
  }),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(false),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Helper to create standard model mock with common Prisma operations
function createModelMock() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  }
}

// Mock Prisma client
vi.mock("@/lib/db", () => ({
  db: {
    product: {
      ...createModelMock(),
      upsert: vi.fn(),
    },
    order: createModelMock(),
    orderItem: createModelMock(),
    user: createModelMock(),
    session: createModelMock(),
    systemConfig: createModelMock(),
    rateLimitLog: {
      ...createModelMock(),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: createModelMock(),
    abandonedCart: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn({
      order: {
        create: vi.fn(),
        update: vi.fn(),
      },
      orderItem: {
        create: vi.fn(),
      },
    })),
  },
}))
