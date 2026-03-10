#!/usr/bin/env node
/**
 * Product Sync Script (Professional Enrichment Edition)
 * Syncs full MobiMatter metadata including Top-Ups and Activation Policies
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MOBIMATTER_BASE_URL = 'https://api.mobimatter.com/mobimatter';

async function syncProducts() {
  console.log('🔄 Professional Sync: Enriching Carrier & Activation Data...\n');
  
  const merchantId = process.env.MOBIMATTER_MERCHANT_ID;
  const apiKey = process.env.MOBIMATTER_API_KEY;
  
  try {
    console.log('🗑️ Purging for Clean Slate...');
    await prisma.product.deleteMany({});
    
    const response = await fetch(`${MOBIMATTER_BASE_URL}/api/v2/products`, {
      headers: { 'merchantId': merchantId, 'api-key': apiKey }
    });
    const data = await response.json();
    const mobimatterProducts = data.result || [];
    console.log(`📡 API returned ${mobimatterProducts.length} products`);
    
    let created = 0;
    const productsToSync = mobimatterProducts.slice(0, 200); // Higher limit for pro sync

    for (const mp of productsToSync) {
      try {
        const id = mp.productId || mp.uniqueId;
        const name = mp.productFamilyName || mp.title || "";
        const details = Object.fromEntries((mp.productDetails || []).map(d => [d.name, d.value]));

        // Parsing Pro Metadata
        let dataAmount = 0;
        if (details.PLAN_DATA_LIMIT) {
          dataAmount = parseFloat(details.PLAN_DATA_LIMIT);
          if ((details.PLAN_DATA_UNIT || "GB").toUpperCase() === "MB") dataAmount /= 1000;
        }

        const price = mp.retailPrice || mp.price || 0;
        const isTest = name.toLowerCase().includes('test') || price < 1 || dataAmount < 0.05;
        if (isTest) continue;

        // Carrier Truth Layer
        let networks = [];
        try {
          const networkRes = await fetch(`${MOBIMATTER_BASE_URL}/api/v2/products/${id}/networks`, {
            headers: { 'merchantId': merchantId, 'api-key': apiKey }
          });
          const netData = await networkRes.json();
          networks = netData.result || [];
        } catch (e) {}

        const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') + '-' + id.slice(0, 4);

        await prisma.product.create({
          data: {
            mobimatterId: id,
            name,
            provider: mp.providerName,
            category: mp.productCategory,
            price: mp.retailPrice || mp.price,
            dataAmount,
            dataUnit: 'GB',
            validityDays: details.PLAN_VALIDITY ? Math.floor(parseInt(details.PLAN_VALIDITY) / 24) : 30,
            networks: JSON.stringify(networks),
            bestFitReason: dataAmount >= 20 ? "Power User" : dataAmount <= 5 ? "Casual Travel" : "Best Seller",
            activationPolicy: details.ACTIVATION_POLICY || "At first use",
            topUpAvailable: details.TOPUP === "1",
            requiresKyc: details.KYC_REQUIRED === "1",
            countries: mp.countries ? JSON.stringify(mp.countries) : "[]",
            regions: mp.regions ? JSON.stringify(mp.regions) : "[]",
            slug,
            syncedAt: new Date()
          }
        });
        created++;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\n❌ Error creating product ${mp.productId}: ${err.message}`);
      }
    }
    console.log(`\n\n✅ Professional Sync Complete: ${created} enriched products.`);
  } catch (error) {
    console.error('Sync failed:', error.message);
  }
}

syncProducts().finally(() => prisma.$disconnect());
