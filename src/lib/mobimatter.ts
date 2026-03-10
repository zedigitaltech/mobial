/**
 * MobiMatter B2B API Client
 * Integration with MobiMatter Partner API v2
 * 
 * API Documentation: Available in Partner Portal
 * https://partner.mobimatter.com
 * 
 * Main Endpoints:
 * 1. Get Products - Fetch product catalog
 * 2. Create Order - Create order (pending, amount authorized)
 * 3. Complete Order - Fulfill order (captures from wallet)
 * 4. Usage Check - Check data usage
 * 5. Notify User - Send order confirmation email
 */

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
  productCategory?: string;
  status?: string;
  total?: number;
  currency?: string;
  lineItems?: Array<{
    qrCode: string;
    activationCode: string;
    iccid: string;
    smdpAddress: string;
  }>;
}

interface WalletBalance {
  balance: number;
  currency: string;
}

/**
 * Get MobiMatter configuration from environment
 */
function getConfig(): MobiMatterConfig {
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;

  if (!merchantId || !apiKey) {
    throw new Error('MobiMatter credentials not configured. Please check MOBIMATTER_MERCHANT_ID and MOBIMATTER_API_KEY in your environment.');
  }

  return { merchantId, apiKey };
}

interface MobiMatterResponse<T> {
  statusCode: number;
  result: T;
  message?: string;
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

  const data = await response.json() as MobiMatterResponse<T>;

  if (!response.ok || (data.statusCode && data.statusCode >= 400)) {
    throw new Error(`MobiMatter API error: ${data.statusCode || response.status} - ${data.message || 'Unknown error'}`);
  }

  return data.result;
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  walletBalance?: WalletBalance;
}> {
  try {
    // Test by fetching products (limited to 1 to be efficient)
    const products = await fetchProducts({ country: 'US' });
    
    // Get wallet balance
    const balance = await getWalletBalance();
    
    return {
      success: true,
      message: products.length > 0 ? 'API connection successful' : 'API connected but no products found',
      walletBalance: balance,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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

  const result = await makeRequest<MobiMatterProduct[]>(endpoint);

  return (result || []).map(transformProduct);
}

interface MobiMatterProduct {
  productId: string;
  uniqueId: string;
  productFamilyName: string;
  providerName: string;
  providerLogo: string;
  retailPrice: number;
  wholesalePrice: number;
  currencyCode: string;
  countries: string[];
  regions: string[];
  productDetails: Array<{ name: string; value: string }>;
  productCategory: string;
  [key: string]: unknown;
}

/**
 * Transform MobiMatter product to our format
 */
function transformProduct(product: MobiMatterProduct): Product {
  // Extract data from productDetails
  const details = Object.fromEntries(
    (product.productDetails || []).map(d => [d.name, d.value])
  );
  
  // Parse data amount from PLAN_DATA_LIMIT (in MB)
  let dataAmount: number | null = null;
  const dataLimitStr = details.PLAN_DATA_LIMIT;
  if (dataLimitStr) {
    const dataNum = parseInt(dataLimitStr);
    // MobiMatter usually returns MB. 999000+ is often used for unlimited/very high.
    // Convert to GB for our UI.
    dataAmount = dataNum / 1000;
  }
  
  // Parse validity from PLAN_VALIDITY (in hours)
  let validityDays: number | null = null;
  const validityStr = details.PLAN_VALIDITY;
  if (validityStr) {
    const validityNum = parseInt(validityStr);
    // Convert hours to days
    validityDays = Math.floor(validityNum / 24);
  }
  
  // Get product name from PLAN_TITLE or use provider + country
  const name = details.PLAN_TITLE || product.productFamilyName || `${product.providerName} ${product.countries?.[0] || ''}`;
  
  // Get description from PLAN_DETAILS JSON
  let description = '';
  try {
    const planDetailsStr = details.PLAN_DETAILS;
    if (planDetailsStr && planDetailsStr.startsWith('{')) {
      const planDetails = JSON.parse(planDetailsStr);
      description = planDetails.description || planDetails.heading || '';
    } else {
      description = planDetailsStr || '';
    }
  } catch {
    description = details.PLAN_DETAILS || '';
  }
  
  // Use retailPrice for display price
  const price = product.retailPrice || 0;
  
  return {
    id: product.productId || product.uniqueId || '',
    name: name,
    provider: product.providerName || 'Unknown',
    description: description,
    countries: product.countries || [],
    regions: product.regions || [],
    dataAmount: dataAmount,
    dataUnit: dataAmount ? 'GB' : null,
    validityDays: validityDays,
    price: price,
    originalPrice: product.retailPrice || null,
    currency: product.currencyCode || 'USD',
    features: [],
    isUnlimited: dataAmount === null || dataAmount === 0 ? false : dataAmount >= 999,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
  };
}

/**
 * Get product by ID
 */
export async function getProduct(productId: string): Promise<Product> {
  const result = await makeRequest<MobiMatterProduct>(
    `/api/v2/products/${productId}`
  );
  
  return transformProduct(result);
}

/**
 * Create an order
 * Creates order in pending state, amount authorized from wallet
 * 
 * API Endpoint: POST /api/v2/order
 */
export async function createOrder(orderData: OrderRequest): Promise<OrderResponse> {
  return makeRequest<OrderResponse>('/api/v2/order', {
    method: 'POST',
    body: {
      productId: orderData.productId,
      quantity: orderData.quantity,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
    },
  });
}

/**
 * Complete an order
 * Fulfills order, captures payment from wallet, returns eSIM details
 */
export async function completeOrder(orderId: string): Promise<OrderResponse> {
  return makeRequest<OrderResponse>(`/api/v2/order/${orderId}/complete`, {
    method: 'POST',
  });
}

/**
 * Get order information
 * Retrieves full order details including line items
 */
export async function getOrderInfo(orderId: string): Promise<{
  id: string;
  status: string;
  lineItems: Array<{
    productId: string;
    quantity: number;
    price: number;
    qrCode?: string;
    activationCode?: string;
    iccid?: string;
    smdpAddress?: string;
  }>;
  total: number;
  createdAt: string;
  completedAt?: string;
}> {
  return makeRequest(`/api/v2/order/${orderId}`);
}

/**
 * Get order by ICCID
 * Find order using eSIM ICCID
 */
export async function getOrderByIccid(iccid: string): Promise<{
  orderId: string;
  status: string;
  iccid: string;
}> {
  return makeRequest(`/api/v2/order/by-iccid/${iccid}`);
}

/**
 * Check order usage
 * Get data usage information for completed order
 */
export async function checkOrderUsage(orderId: string): Promise<{
  orderId: string;
  iccid: string;
  dataUsed: number;
  dataTotal: number;
  validityDaysRemaining: number;
  status: 'active' | 'expired' | 'not_activated';
}> {
  return makeRequest(`/api/v2/order/${orderId}/usage`);
}

/**
 * Notify user
 * Send order confirmation email to customer via MobiMatter
 */
export async function notifyUser(
  orderId: string,
  customerEmail: string
): Promise<{
  success: boolean;
  messageId?: string;
}> {
  return makeRequest(`/api/v2/order/${orderId}/notify`, {
    method: 'POST',
    body: {
      email: customerEmail,
    },
  });
}

/**
 * Top up an existing order
 * Extends data/validity of an existing eSIM
 */
export async function topupOrder(params: {
  orderId: string;
  productId: string;
  quantity?: number;
}): Promise<OrderResponse> {
  return makeRequest<OrderResponse>(`/api/v2/order/${params.orderId}/topup`, {
    method: 'POST',
    body: {
      productId: params.productId,
      quantity: params.quantity || 1,
    },
  });
}

/**
 * Check if order is refundable
 */
export async function isOrderRefundable(orderId: string): Promise<{
  refundable: boolean;
  reason?: string;
}> {
  return makeRequest(`/api/v2/order/${orderId}/refundable`);
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
  return makeRequest(`/api/v2/order/${orderId}`);
}

/**
 * Request eSIM replacement
 */
export async function requestReplacement(
  orderId: string,
  reason: string
): Promise<{ newOrderId: string }> {
  return makeRequest(`/api/v2/order/${orderId}/replacement`, {
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
  const result = await makeRequest<{ balance: number; currency?: string }>('/api/v2/merchant/balance');
  return {
    balance: result.balance,
    currency: result.currency || 'USD',
  };
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
