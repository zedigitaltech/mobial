/**
 * MobiMatter B2B API Client
 * Integration with MobiMatter Partner API v2
 *
 * API Documentation: https://docs.mobimatter.com
 * Base URL: https://api.mobimatter.com/mobimatter
 *
 * Authentication: merchantId + api-key headers on every request
 * Wallet System: Prepaid wallet, orders auto-deduct at wholesalePrice
 */

const MOBIMATTER_BASE_URL = "https://api.mobimatter.com/mobimatter";

// ==================== CONFIGURATION ====================

interface MobiMatterConfig {
  merchantId: string;
  apiKey: string;
}

function getConfig(): MobiMatterConfig {
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;

  if (!merchantId || !apiKey) {
    throw new Error(
      "MobiMatter credentials not configured. Set MOBIMATTER_MERCHANT_ID and MOBIMATTER_API_KEY.",
    );
  }

  return { merchantId, apiKey };
}

// ==================== API TYPES ====================

/** Standard API response wrapper */
interface MobiMatterResponse<T> {
  statusCode?: number;
  isSuccess?: boolean;
  result: T;
  message?: string;
}

/** Raw product from MobiMatter API */
interface MobiMatterRawProduct {
  productId: string;
  uniqueId: string;
  rank: number;
  penalizedRank: number;
  productCategoryId: number;
  productCategory: string;
  productFamilyId: number;
  productFamilyName: string;
  providerId: number;
  providerName: string;
  providerLogo: string;
  networkListId: number;
  retailPrice: number;
  wholesalePrice: number;
  currencyCode: string;
  created: string;
  updated: string;
  regions: string[];
  countries: string[];
  displayAttributes: unknown[];
  productDetails: Array<{ name: string; value: string }>;
}

/** Order line item details from completed order */
interface MobiMatterLineItemDetail {
  name: string;
  value: string;
}

/** Order line item from API response */
interface MobiMatterOrderLineItem {
  productId: string;
  productCategory: string;
  title: string;
  provider: string;
  providerLogo: string;
  retailPrice: number;
  wholesalePrice: number;
  lineItemDetails: MobiMatterLineItemDetail[];
}

/** Raw order from MobiMatter API */
interface MobiMatterRawOrder {
  orderId: string;
  orderState: string;
  currencyCode: string;
  created: string;
  updated: string;
  orderLineItem?: MobiMatterOrderLineItem;
  label?: string;
}

/** Refund eligibility response */
interface RefundEligibility {
  isEligible: boolean;
  fee: number;
  reason: string | null;
}

/** Structured eSIM info from /provider/info */
interface StructuredESIMInfo {
  ussdCode: string | null;
  esim: {
    status: "Installed" | "Available" | null;
    installationDate: string | null;
    location: {
      country: string;
      network: string;
      updatedAt: string;
    } | null;
    kycStatus: "IN_PROGRESS" | "REJECTED" | "APPROVED" | null;
    iccid: string;
    wallet: {
      balanceHKD: number;
    } | null;
  };
  packages: Array<{
    name: string;
    associatedProductId: string;
    activationDate: string | null;
    expirationDate: string | null;
    totalAllowanceMb: number | null;
    totalAllowanceMin: number | null;
    usedMb: number | null;
    usedMin: number | null;
  }>;
}

// ==================== PUBLIC TYPES ====================

export interface Product {
  id: string;
  name: string;
  provider: string;
  providerId: number;
  providerLogo: string | null;
  description: string | null;
  countries: string[];
  regions: string[];
  dataAmount: number | null;
  dataUnit: string | null;
  validityDays: number | null;
  price: number;
  wholesalePrice: number;
  currency: string;
  features: string[];
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
  networkType: string | null;
  activationPolicy: string | null;
  ipRouting: string | null;
  speedInfo: string | null;
  speedLong: string | null;
  topUpAvailable: boolean;
  usageTracking: string | null;
  is5G: boolean;
  tags: Array<{ item: string; color?: string }>;
  externallyShown: boolean;
  additionalDetails: string | null;
  phoneNumberPrefix: string | null;
  rank: number;
  penalizedRank: number;
  productCategory: string;
  productFamilyId: number;
  productFamilyName: string;
  networkListId: number;
  updated: string;
}

export interface OrderResponse {
  orderId: string;
  orderState: string;
  currencyCode: string;
  created: string;
  updated: string;
  label?: string;
  lineItem?: {
    productId: string;
    productCategory: string;
    title: string;
    provider: string;
    providerLogo: string;
    retailPrice: number;
    wholesalePrice: number;
    qrCode?: string;
    activationCode?: string;
    iccid?: string;
    smdpAddress?: string;
    lpa?: string;
    phoneNumber?: string;
    apn?: string;
    kycUrl?: string;
  };
}

export interface UsageInfo {
  orderId: string;
  rawUsage: string;
}

export interface StructuredUsageInfo {
  esimStatus: "Installed" | "Available" | null;
  installationDate: string | null;
  location: { country: string; network: string; updatedAt: string } | null;
  kycStatus: string | null;
  iccid: string;
  packages: Array<{
    name: string;
    associatedProductId: string;
    activationDate: string | null;
    expirationDate: string | null;
    totalAllowanceMb: number | null;
    usedMb: number | null;
    totalAllowanceMin: number | null;
    usedMin: number | null;
  }>;
}

// ==================== HTTP CLIENT ====================

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;

async function makeRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    timeoutMs?: number;
    retries?: number;
  } = {},
): Promise<T> {
  const config = getConfig();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.retries ?? MAX_RETRIES;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff with jitter: 500ms, 1000ms, 2000ms
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: HeadersInit = {
      merchantId: config.merchantId,
      "api-key": config.apiKey,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(`${MOBIMATTER_BASE_URL}${endpoint}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 429 Rate limit — retryable with longer backoff
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : BASE_RETRY_DELAY_MS * Math.pow(2, attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          lastError = new Error(`MobiMatter API rate limited (429)`);
          continue;
        }

        // Don't retry other 4xx — these are client errors (bad request, not found, etc.)
        if (response.status >= 400 && response.status < 500) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // ignore
          }
          throw new Error(`MobiMatter API error: ${errorMessage}`);
        }

        // 5xx — retryable
        lastError = new Error(`MobiMatter API error: HTTP ${response.status}`);
        continue;
      }

      const data = (await response.json()) as MobiMatterResponse<T>;

      if (data.statusCode && data.statusCode >= 400) {
        throw new Error(
          `MobiMatter API error: ${data.statusCode} - ${data.message || "Unknown error"}`,
        );
      }

      return data.result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        lastError = new Error(
          `MobiMatter API timeout: ${endpoint} did not respond within ${timeoutMs}ms`,
        );
        // Timeouts are retryable
        continue;
      }

      // Re-throw non-retryable errors immediately (4xx, logic errors)
      if (error instanceof Error && error.message.startsWith("MobiMatter API error:")) {
        throw error;
      }

      // Network errors are retryable
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError;
}

// ==================== MERCHANT ====================

/**
 * GET /api/v2/merchant/balance
 */
export async function getWalletBalance(): Promise<{
  balance: number;
  currency: string;
}> {
  const result = await makeRequest<{ balance: number; currency?: string }>(
    "/api/v2/merchant/balance",
  );
  return {
    balance: result.balance,
    currency: result.currency || "USD",
  };
}

// ==================== PRODUCTS ====================

/**
 * GET /api/v2/products
 * Fetches product catalog with optional filters.
 */
export async function fetchProducts(options?: {
  country?: string;
  region?: string;
  provider?: string;
  category?: "esim_realtime" | "esim_addon" | "esim_replacement";
}): Promise<Product[]> {
  const params = new URLSearchParams();

  if (options?.country) params.append("country", options.country);
  if (options?.region) params.append("region", options.region);
  if (options?.provider) params.append("provider", options.provider);
  if (options?.category) params.append("category", options.category);

  const queryString = params.toString();
  const endpoint = `/api/v2/products${queryString ? `?${queryString}` : ""}`;

  const result = await makeRequest<MobiMatterRawProduct[]>(endpoint);
  return (result || []).map(transformProduct);
}

/**
 * GET /api/v2/products/{productId}
 */
export async function getProduct(productId: string): Promise<Product> {
  const result = await makeRequest<MobiMatterRawProduct>(
    `/api/v2/products/${productId}`,
  );
  return transformProduct(result);
}

/**
 * GET /api/v2/products/{productId}/networks
 * Returns mobile networks/carriers a product connects to.
 */
export async function getProductNetworks(productId: string): Promise<unknown> {
  return makeRequest(`/api/v2/products/${productId}/networks`);
}

/**
 * Transform raw MobiMatter product to our format.
 *
 * Actual productDetails field names from the API:
 * PLAN_DATA_LIMIT, PLAN_DATA_UNIT, PLAN_VALIDITY, PLAN_TITLE, PLAN_DETAILS,
 * HAS_DATA, HAS_CALLS, HAS_SMS, HOTSPOT, TOPUP, SPEED, SPEED_LONG,
 * ACTIVATION_POLICY, USAGE_TRACKING, IP_BREAKOUT, NETWORKS_SHORT, FIVEG,
 * UNLIMITED, EXTERNALLY_SHOWN, TAGS, ADDITIONAL_DETAILS, PHONE_NUMBER_PREFIX,
 * ONLY_RETURNS_INVENTORY, OFFER_RANK, CHECK_USAGE_PACKAGES
 */
function transformProduct(product: MobiMatterRawProduct): Product {
  // Trim keys — API sometimes has trailing spaces (e.g., "PLAN_DETAILS ")
  const details = Object.fromEntries(
    (product.productDetails || []).map((d) => [d.name.trim(), d.value]),
  );

  // Data amount — use PLAN_DATA_UNIT to determine the unit
  let dataAmount: number | null = null;
  const dataUnit = details.PLAN_DATA_UNIT || "GB";
  const dataLimitStr = details.PLAN_DATA_LIMIT;
  if (dataLimitStr) {
    const raw = parseInt(dataLimitStr);
    if (dataUnit === "MB") {
      dataAmount = raw / 1000; // Convert MB to GB
    } else {
      dataAmount = raw; // Already in GB
    }
  }

  // PLAN_VALIDITY is in hours — convert to days
  let validityDays: number | null = null;
  const validityStr = details.PLAN_VALIDITY;
  if (validityStr) {
    const hours = parseInt(validityStr);
    validityDays = hours >= 24 ? Math.floor(hours / 24) : hours > 0 ? 1 : null;
  }

  const name =
    details.PLAN_TITLE ||
    product.productFamilyName ||
    `${product.providerName} ${product.countries?.[0] || ""}`;

  // Parse PLAN_DETAILS JSON — contains heading, description, items[]
  let description: string | null = null;
  let planItems: string[] = [];
  try {
    const planDetailsStr = details.PLAN_DETAILS;
    if (planDetailsStr) {
      const trimmed = planDetailsStr.trim();
      if (trimmed.startsWith("{")) {
        const planDetails = JSON.parse(trimmed);
        description = planDetails.description || planDetails.heading || null;
        if (Array.isArray(planDetails.items)) {
          planItems = planDetails.items;
        }
      } else {
        description = trimmed || null;
      }
    }
  } catch {
    description = details.PLAN_DETAILS || null;
  }

  // Parse TAGS — JSON array of {item, color?}
  let tags: Array<{ item: string; color?: string }> = [];
  try {
    if (details.TAGS) {
      tags = JSON.parse(details.TAGS);
    }
  } catch {
    // ignore
  }

  const isUnlimited =
    details.UNLIMITED === "1" || (dataAmount !== null && dataAmount >= 999);

  return {
    id: product.productId,
    name,
    provider: product.providerName || "Unknown",
    providerId: product.providerId,
    providerLogo: product.providerLogo || null,
    description,
    countries: product.countries || [],
    regions: product.regions || [],
    dataAmount,
    dataUnit: dataUnit || "GB",
    validityDays,
    price: product.retailPrice || 0,
    wholesalePrice: product.wholesalePrice || 0,
    currency: product.currencyCode || "USD",
    features: planItems,
    isUnlimited,
    supportsHotspot: details.HOTSPOT === "1",
    supportsCalls: details.HAS_CALLS === "1",
    supportsSms: details.HAS_SMS === "1",
    networkType: details.NETWORKS_SHORT || null,
    activationPolicy: details.ACTIVATION_POLICY || null,
    ipRouting: details.IP_BREAKOUT || null,
    speedInfo: details.SPEED || null,
    speedLong: details.SPEED_LONG || null,
    topUpAvailable: details.TOPUP === "1",
    usageTracking: details.USAGE_TRACKING || null,
    is5G: details.FIVEG === "1",
    tags,
    externallyShown: details.EXTERNALLY_SHOWN !== "0",
    additionalDetails: details.ADDITIONAL_DETAILS || null,
    phoneNumberPrefix: details.PHONE_NUMBER_PREFIX || null,
    rank: product.rank || 0,
    penalizedRank: product.penalizedRank || 0,
    productCategory: product.productCategory || "esim_realtime",
    productFamilyId: product.productFamilyId || 0,
    productFamilyName: product.productFamilyName || "",
    networkListId: product.networkListId || 0,
    updated: product.updated || "",
  };
}

// ==================== ORDERS ====================

/**
 * POST /api/v2/order
 * Creates order in pending state. Amount authorized from wallet.
 * Order expires after 20+ minutes if not completed.
 *
 * For top-ups: pass addOnIdentifier = original order ID
 * For replacements: pass addOnOrderIdentifier = original order ID, productCategory = 'esim_replacement'
 */
export async function createOrder(params: {
  productId: string;
  productCategory: "esim_realtime" | "esim_addon" | "esim_replacement";
  label?: string;
  addOnIdentifier?: string;
  addOnOrderIdentifier?: string;
}): Promise<{ orderId: string }> {
  const body: Record<string, string> = {
    productId: params.productId,
    productCategory: params.productCategory,
  };

  if (params.label) body.label = params.label;
  if (params.addOnIdentifier) body.addOnIdentifier = params.addOnIdentifier;
  if (params.addOnOrderIdentifier)
    body.addOnOrderIdentifier = params.addOnOrderIdentifier;

  return makeRequest<{ orderId: string }>("/api/v2/order", {
    method: "POST",
    body,
  });
}

/**
 * PUT /api/v2/order/complete
 * Fulfills order: captures payment from wallet, returns eSIM details.
 * KYC-required products return orderState: "Processing" with KYC_URL.
 */
export async function completeOrder(orderId: string): Promise<OrderResponse> {
  const raw = await makeRequest<MobiMatterRawOrder>("/api/v2/order/complete", {
    method: "PUT",
    body: { orderId },
  });

  return transformOrderResponse(raw);
}

/**
 * GET /api/v2/order/{orderId}
 */
export async function getOrderInfo(orderId: string): Promise<OrderResponse> {
  const raw = await makeRequest<MobiMatterRawOrder>(`/api/v2/order/${orderId}`);
  return transformOrderResponse(raw);
}

/**
 * GET /api/v2/order?iccid={iccid}
 */
export async function getOrderByIccid(iccid: string): Promise<OrderResponse> {
  const raw = await makeRequest<MobiMatterRawOrder>(
    `/api/v2/order?iccid=${encodeURIComponent(iccid)}`,
  );
  return transformOrderResponse(raw);
}

/**
 * PUT /api/v2/order/cancel
 * Only works if order is in Created state. Funds return to wallet.
 */
export async function cancelMobimatterOrder(orderId: string): Promise<void> {
  await makeRequest("/api/v2/order/cancel", {
    method: "PUT",
    body: { orderId },
  });
}

/**
 * GET /api/v2/order/{orderId}/refund/eligibility
 */
export async function checkRefundEligibility(
  orderId: string,
): Promise<RefundEligibility> {
  return makeRequest<RefundEligibility>(
    `/api/v2/order/${orderId}/refund/eligibility`,
  );
}

/**
 * PUT /api/v2/order/refund
 * WARNING: Refunds cannot be reversed. Processing fee applied.
 * Returns 202 on success, 400 if ineligible.
 */
export async function refundOrder(orderId: string): Promise<void> {
  await makeRequest("/api/v2/order/refund", {
    method: "PUT",
    body: { orderId },
  });
}

/**
 * Transform raw order response, extracting eSIM details from lineItemDetails.
 */
function transformOrderResponse(raw: MobiMatterRawOrder): OrderResponse {
  const result: OrderResponse = {
    orderId: raw.orderId,
    orderState: raw.orderState,
    currencyCode: raw.currencyCode,
    created: raw.created,
    updated: raw.updated,
    label: raw.label,
  };

  if (raw.orderLineItem) {
    const li = raw.orderLineItem;
    const detailsMap = Object.fromEntries(
      (li.lineItemDetails || []).map((d) => [d.name, d.value]),
    );

    result.lineItem = {
      productId: li.productId,
      productCategory: li.productCategory,
      title: li.title,
      provider: li.provider,
      providerLogo: li.providerLogo,
      retailPrice: li.retailPrice,
      wholesalePrice: li.wholesalePrice,
      qrCode: detailsMap.QR_CODE || undefined,
      activationCode: detailsMap.ACTIVATION_CODE || undefined,
      iccid: detailsMap.ICCID || undefined,
      smdpAddress: detailsMap.SMDP_ADDRESS || undefined,
      lpa: detailsMap.LOCAL_PROFILE_ASSISTANT || undefined,
      phoneNumber: detailsMap.PHONE_NUMBER || undefined,
      apn: detailsMap.ACCESS_POINT_NAME || undefined,
      kycUrl: detailsMap.KYC_URL || undefined,
    };
  }

  return result;
}

// ==================== NOTIFICATIONS ====================

/**
 * POST /api/v2/email
 * Sends order confirmation email to customer via MobiMatter.
 * For KYC orders: email sent only after KYC completion.
 */
export async function notifyUser(
  orderId: string,
  customerName: string,
  customerEmail: string,
): Promise<void> {
  await makeRequest("/api/v2/email", {
    method: "POST",
    body: {
      orderId,
      customer: {
        name: customerName,
        email: customerEmail,
      },
    },
  });
}

// ==================== USAGE & PROVIDER ====================

/**
 * GET /api/v2/provider/usage/{orderId}
 * Returns unstructured usage string data.
 */
export async function checkOrderUsage(orderId: string): Promise<UsageInfo> {
  const result = await makeRequest<string>(`/api/v2/provider/usage/${orderId}`);
  return {
    orderId,
    rawUsage: typeof result === "string" ? result : JSON.stringify(result),
  };
}

/**
 * GET /api/v2/provider/info/{orderId}
 * Returns structured eSIM usage with packages, status, location.
 * Restricted — not all providers support all fields.
 */
export async function getStructuredUsage(
  orderId: string,
): Promise<StructuredUsageInfo> {
  const raw = await makeRequest<StructuredESIMInfo>(
    `/api/v2/provider/info/${orderId}`,
  );

  return {
    esimStatus: raw.esim?.status || null,
    installationDate: raw.esim?.installationDate || null,
    location: raw.esim?.location || null,
    kycStatus: raw.esim?.kycStatus || null,
    iccid: raw.esim?.iccid || "",
    packages: (raw.packages || []).map((pkg) => ({
      name: pkg.name,
      associatedProductId: pkg.associatedProductId,
      activationDate: pkg.activationDate,
      expirationDate: pkg.expirationDate,
      totalAllowanceMb: pkg.totalAllowanceMb,
      usedMb: pkg.usedMb,
      totalAllowanceMin: pkg.totalAllowanceMin,
      usedMin: pkg.usedMin,
    })),
  };
}

/**
 * POST /api/v2/provider/sms/{orderId}
 * Sends SMS to the eSIM.
 */
export async function sendSmsToEsim(
  orderId: string,
  message: string,
): Promise<void> {
  await makeRequest(`/api/v2/provider/sms/${orderId}`, {
    method: "POST",
    body: { message },
  });
}

// ==================== COMPOSITE FLOWS ====================

/**
 * Top-Up Flow: Create + Complete an add-on order.
 * Uses addOnIdentifier to link to the original order.
 */
export async function topupOrder(params: {
  originalOrderId: string;
  topupProductId: string;
  label?: string;
}): Promise<OrderResponse> {
  // Step 1: Create order with addOnIdentifier
  const pendingOrder = await createOrder({
    productId: params.topupProductId,
    productCategory: "esim_addon",
    addOnIdentifier: params.originalOrderId,
    label: params.label,
  });

  // Step 2: Complete the order
  return completeOrder(pendingOrder.orderId);
}

/**
 * Replacement Flow (4 steps):
 * 1. Find replacement product
 * 2. Create order with addOnOrderIdentifier
 * 3. Complete order (returns Processing state)
 * 4. Poll until Completed (< 1 minute)
 */
export async function requestReplacement(params: {
  originalOrderId: string;
  replacementProductId: string;
  label?: string;
  maxPollAttempts?: number;
}): Promise<OrderResponse> {
  const { maxPollAttempts = 12 } = params;

  // Step 1: Create replacement order
  const pendingOrder = await createOrder({
    productId: params.replacementProductId,
    productCategory: "esim_replacement",
    addOnOrderIdentifier: params.originalOrderId,
    label: params.label,
  });

  // Step 2: Complete (async — returns Processing state)
  let order = await completeOrder(pendingOrder.orderId);

  // Step 3: Poll until Completed
  let attempts = 0;
  while (order.orderState === "Processing" && attempts < maxPollAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    order = await getOrderInfo(pendingOrder.orderId);
    attempts++;
  }

  if (order.orderState !== "Completed") {
    throw new Error(
      `Replacement order ${pendingOrder.orderId} did not complete. State: ${order.orderState}`,
    );
  }

  return order;
}

/**
 * Standard Purchase Flow: Create + Complete for esim_realtime.
 */
export async function purchaseEsim(params: {
  productId: string;
  label?: string;
}): Promise<OrderResponse> {
  const pendingOrder = await createOrder({
    productId: params.productId,
    productCategory: "esim_realtime",
    label: params.label,
  });

  return completeOrder(pendingOrder.orderId);
}

// ==================== CONNECTION TEST ====================

export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  walletBalance?: { balance: number; currency: string };
}> {
  try {
    const products = await fetchProducts({ country: "US" });
    const balance = await getWalletBalance();

    return {
      success: true,
      message:
        products.length > 0
          ? "API connection successful"
          : "API connected but no products found",
      walletBalance: balance,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
