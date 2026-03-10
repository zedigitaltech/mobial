#!/usr/bin/env node
/**
 * Product Sync Script
 * Syncs products from MobiMatter API to local database
 * 
 * Usage: bun run sync:products
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MOBIMATTER_BASE_URL = 'https://api.mobimatter.com/mobimatter';

async function syncProducts() {
  console.log('🔄 Syncing products from MobiMatter...\n');
  
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;
  
  if (!merchantId || !apiKey) {
    console.error('❌ Missing MobiMatter credentials!');
    process.exit(1);
  }
  
  try {
    console.log('🗑️ Purging existing products...');
    await prisma.product.deleteMany({});
    
    console.log('📡 Fetching products from MobiMatter API...');
    const response = await fetch(`${MOBIMATTER_BASE_URL}/api/v2/products`, {
      headers: {
        'merchantId': merchantId,
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`MobiMatter API error: ${response.status}`);
    }
    
    const data = await response.json();
    const mobimatterProducts = data.result || [];
    console.log(`✅ Found ${mobimatterProducts.length} products\n`);
    
    let created = 0;
    let skipped = 0;
    
    // Process first 100 products for speed and to avoid rate limits during dev
    const productsToSync = mobimatterProducts.slice(0, 100);

    for (const mp of productsToSync) {
      try {
        const id = mp.productId || mp.uniqueId;
        const name = mp.productFamilyName || mp.title || "";
        const provider = mp.providerName || "";
        const category = mp.productCategory || "";
        const price = mp.retailPrice || mp.price || 0;

        const details = Object.fromEntries(
          (mp.productDetails || []).map(d => [d.name, d.value])
        );

        let dataAmount = 0;
        const dataLimitStr = details.PLAN_DATA_LIMIT;
        const dataUnit = details.PLAN_DATA_UNIT || "GB";
        if (dataLimitStr) {
          dataAmount = parseFloat(dataLimitStr);
          if (dataUnit.toUpperCase() === "MB") dataAmount = dataAmount / 1000;
        }

        const isTestProduct = 
          name.toLowerCase().includes('test') || 
          provider.toLowerCase().includes('test') ||
          price < 1.0 || 
          (dataAmount > 0 && dataAmount < 0.05) ||
          details.EXTERNALLY_SHOWN === "0";

        if (isTestProduct) {
          skipped++;
          continue;
        }

        // Carrier Truth Layer
        let networks = [];
        try {
          const networkRes = await fetch(`${MOBIMATTER_BASE_URL}/api/v2/products/${id}/networks`, {
            headers: { 'merchantId': merchantId, 'api-key': apiKey }
          });
          if (networkRes.ok) {
            const netData = await networkRes.json();
            networks = netData.result || [];
          }
        } catch (e) {}

        let bestFitReason = null;
        if (price < 5) bestFitReason = "Budget Choice";
        else if (dataAmount >= 20) bestFitReason = "Best for Streaming";
        else if (dataAmount >= 10) bestFitReason = "Balanced Travel";

        const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + id.slice(0, 4);

        await prisma.product.create({
          data: {
            mobimatterId: id,
            name,
            provider,
            category,
            price,
            dataAmount,
            dataUnit: 'GB',
            validityDays: details.PLAN_VALIDITY ? Math.floor(parseInt(details.PLAN_VALIDITY) / 24) : 30,
            networks: JSON.stringify(networks),
            bestFitReason,
            countries: mp.countries ? JSON.stringify(mp.countries) : "[]",
            regions: mp.regions ? JSON.stringify(mp.regions) : "[]",
            slug,
            syncedAt: new Date()
          }
        });
        created++;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nError syncing ${mp.productId}:`, err.message);
      }
    }
    
    console.log(`\n\n✅ Sync completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
  }
}

syncProducts().finally(() => prisma.$disconnect());
