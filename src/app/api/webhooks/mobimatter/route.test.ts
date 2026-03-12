import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { db } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/encryption', () => ({
  secureCompare: vi.fn((a: string, b: string) => a === b),
}))

vi.mock('@/lib/esim-encryption', () => ({
  encryptEsimField: vi.fn((val: string) => `encrypted:${val}`),
}))

vi.mock('@/services/email-service', () => ({
  sendActivationDetected: vi.fn().mockResolvedValue(undefined),
}))

const WEBHOOK_SECRET = 'test-webhook-secret-123'

function createWebhookRequest(
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const defaultHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  }

  return new NextRequest('http://localhost/api/webhooks/mobimatter', {
    method: 'POST',
    headers: defaultHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/webhooks/mobimatter', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, MOBIMATTER_WEBHOOK_SECRET: WEBHOOK_SECRET }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should reject request when webhook secret is not configured', async () => {
    delete process.env.MOBIMATTER_WEBHOOK_SECRET

    const req = createWebhookRequest(
      { eventType: 'order.completed' },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('should reject request when signature header is missing', async () => {
    const req = createWebhookRequest({ eventType: 'order.completed' })

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('should reject request with invalid signature', async () => {
    const req = createWebhookRequest(
      { eventType: 'order.completed' },
      { 'x-webhook-secret': 'wrong-secret' }
    )

    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('should return 400 for invalid JSON body', async () => {
    const req = createWebhookRequest(
      'not valid json{{{',
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toBe('Invalid JSON')
  })

  it('should return 400 when eventType is missing', async () => {
    const req = createWebhookRequest(
      { orderId: 'order-123' },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toBe('Missing eventType')
  })

  it('should accept Bearer token authentication', async () => {
    const req = createWebhookRequest(
      { eventType: 'unknown.event' },
      { authorization: `Bearer ${WEBHOOK_SECRET}` }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)
  })

  it('should accept x-mobimatter-signature header', async () => {
    const req = createWebhookRequest(
      { eventType: 'unknown.event' },
      { 'x-mobimatter-signature': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)
  })

  it('should process order.completed event correctly', async () => {
    const mockOrder = {
      id: 'order-db-1',
      orderNumber: 'ORD-001',
      esimQrCode: null,
      esimActivationCode: null,
      esimSmdpAddress: null,
      items: [{ id: 'item-1' }],
    }

    vi.mocked(db.order.findFirst).mockResolvedValue(mockOrder as never)
    vi.mocked(db.order.update).mockResolvedValue({} as never)
    vi.mocked(db.orderItem.update).mockResolvedValue({} as never)

    const req = createWebhookRequest(
      {
        eventType: 'order.completed',
        orderId: 'mm-order-1',
        qrCode: 'LPA:1$example.com$abc123',
        activationCode: 'ACT-CODE-1',
        smdpAddress: 'smdp.example.com',
        iccid: '8901234567890123',
      },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.received).toBe(true)

    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-db-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          mobimatterStatus: 'COMPLETED',
        }),
      })
    )
  })

  it('should process order.failed event correctly', async () => {
    const mockOrder = {
      id: 'order-db-2',
      orderNumber: 'ORD-002',
    }

    vi.mocked(db.order.findFirst).mockResolvedValue(mockOrder as never)
    vi.mocked(db.order.update).mockResolvedValue({} as never)

    const req = createWebhookRequest(
      {
        eventType: 'order.failed',
        orderId: 'mm-order-2',
        errorMessage: 'Insufficient balance',
      },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)

    expect(db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
          mobimatterStatus: 'FAILED',
        }),
      })
    )
  })

  it('should process esim.activated event correctly', async () => {
    const { sendActivationDetected } = await import('@/services/email-service')
    const mockOrderItem = {
      id: 'item-1',
      order: {
        email: 'user@example.com',
        orderNumber: 'ORD-003',
      },
      product: {
        countries: '["US"]',
      },
    }

    vi.mocked(db.orderItem.findFirst).mockResolvedValue(mockOrderItem as never)

    const req = createWebhookRequest(
      {
        eventType: 'esim.activated',
        iccid: '8901234567890123',
      },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(sendActivationDetected).toHaveBeenCalled()
  })

  it('should handle unrecognized event types gracefully', async () => {
    const req = createWebhookRequest(
      { eventType: 'some.new.event' },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.received).toBe(true)
  })

  it('should still return 200 when order is not found for order.completed', async () => {
    vi.mocked(db.order.findFirst).mockResolvedValue(null)

    const req = createWebhookRequest(
      {
        eventType: 'order.completed',
        orderId: 'nonexistent-order',
      },
      { 'x-webhook-secret': WEBHOOK_SECRET }
    )

    const response = await POST(req)
    expect(response.status).toBe(200)
  })
})
