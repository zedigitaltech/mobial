/**
 * MobiMatter API Client
 * Integration with MobiMatter Partner API v2
 */

import { encrypt, decrypt } from './encryption';

const MOBIMATTER_BASE_URL = 'https://api.mobimatter.com/mobimatter';

interface MobiMatterConfig {
  merchantId: string;
  apiKey: string;
}

export interface Product {
  id: string;
  name: string;
  provider: string;
  description?: string;
  countries?: string[];
  regions?: string[];
  dataAmount?: number;
  dataUnit?: string;
  validityDays?: number;
  price: number;
  currency: string;
  features?: string[];
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
}

interface OrderRequest {
  productId: string;
  quantity: number;
  customerEmail: string;
  customerPhone?: string;
}

interface OrderResponse {
  orderId: string;
  status: string;
  qrCode?: string;
  activationCode?: string;
  smdpAddress?: string;
}

/**
 * Get MobiMatter configuration from environment
 */
function getConfig(): MobiMatterConfig {
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;
  
  if (!merchantId || !apiKey) {
    throw new Error('MobiMatter credentials not configured');
  }
  
  return { merchantId, apiKey };
}

/**
 * Make authenticated request to MobiMatter API
 */
async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const config = getConfig();
  
  const headers: HeadersInit = {
    'merchantId': config.merchantId,
    'api-key': config.apiKey,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(`${MOBIMATTER_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MobiMatter API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Fetch all available products
 */
export async function fetchProducts(options?: {
  country?: string;
  region?: string;
  provider?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  
  if (options?.country) params.append('country', options.country);
  if (options?.region) params.append('region', options.region);
  if (options?.provider) params.append('provider', options.provider);
  
  const queryString = params.toString();
  const endpoint = `/api/v2/products${queryString ? `?${queryString}` : ''}`;
  
  const response = await makeRequest<{ products: MobiMatterProduct[] }>(endpoint);
  
  return response.products.map(transformProduct);
}

interface MobiMatterProduct {
  id: string;
  title: string;
  providerName: string;
  description?: string;
  countries?: string[];
  regions?: string[];
  dataVolume?: number;
  dataUnit?: string;
  validity?: number;
  price: number;
  currencyCode: string;
  features?: string[];
  isUnlimited?: boolean;
  isHotspot?: boolean;
  isVoice?: boolean;
  isSms?: boolean;
}

/**
 * Transform MobiMatter product to our format
 */
function transformProduct(product: MobiMatterProduct): Product {
  return {
    id: product.id,
    name: product.title,
    provider: product.providerName,
    description: product.description,
    countries: product.countries,
    regions: product.regions,
    dataAmount: product.dataVolume,
    dataUnit: product.dataUnit,
    validityDays: product.validity,
    price: product.price,
    currency: product.currencyCode || 'USD',
    features: product.features,
    isUnlimited: product.isUnlimited || false,
    supportsHotspot: product.isHotspot ?? true,
    supportsCalls: product.isVoice || false,
    supportsSms: product.isSms || false,
  };
}

/**
 * Get product by ID
 */
export async function getProduct(productId: string): Promise<Product> {
  const response = await makeRequest<{ product: MobiMatterProduct }>(
    `/api/v2/products/${productId}`
  );
  
  return transformProduct(response.product);
}

/**
 * Create an order
 */
export async function createOrder(orderData: OrderRequest): Promise<OrderResponse> {
  const response = await makeRequest<OrderResponse>('/api/v2/orders', {
    method: 'POST',
    body: {
      productId: orderData.productId,
      quantity: orderData.quantity,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
    },
  });
  
  return response;
}

/**
 * Get order status
 */
export async function getOrderStatus(orderId: string): Promise<{
  status: string;
  qrCode?: string;
  activationCode?: string;
  smdpAddress?: string;
  iccid?: string;
}> {
  return makeRequest(`/api/v2/orders/${orderId}`);
}

/**
 * Request eSIM replacement
 */
export async function requestReplacement(
  orderId: string,
  reason: string
): Promise<{ newOrderId: string }> {
  return makeRequest(`/api/v2/orders/${orderId}/replacement`, {
    method: 'POST',
    body: { reason },
  });
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(): Promise<{
  balance: number;
  currency: string;
}> {
  return makeRequest('/api/v2/wallet/balance');
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await fetchProducts({ country: 'US' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt and store API credentials
 */
export function encryptCredentials(merchantId: string, apiKey: string): {
  encryptedMerchantId: string;
  encryptedApiKey: string;
} {
  return {
    encryptedMerchantId: encrypt(merchantId),
    encryptedApiKey: encrypt(apiKey),
  };
}

/**
 * Decrypt API credentials
 */
export function decryptCredentials(
  encryptedMerchantId: string,
  encryptedApiKey: string
): { merchantId: string; apiKey: string } {
  return {
    merchantId: decrypt(encryptedMerchantId),
    apiKey: decrypt(encryptedApiKey),
  };
}
