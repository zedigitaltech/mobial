#!/usr/bin/env node
/**
 * Admin Seed Script
 * Creates an initial admin user for the platform
 * 
 * Usage: bun run seed:admin
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Admin user credentials
const ADMIN_EMAIL = 'admin@mobialo.eu';
const ADMIN_PASSWORD = 'Admin123!'; // Change this in production!
const ADMIN_NAME = 'Platform Admin';

async function hashPassword(password) {
  const crypto = require('crypto');
  
  const ITERATIONS = 100000;
  const KEY_LENGTH = 64;
  const SALT_LENGTH = 32;
  
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${ITERATIONS}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('🌱 Seeding admin user...\n');
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });
  
  if (existingAdmin) {
    console.log('⚠️  Admin user already exists!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   ID: ${existingAdmin.id}`);
    
    const update = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { 
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    });
    
    console.log('\n✅ Updated existing user to ADMIN role');
    return;
  }
  
  // Create admin user
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  
  const admin = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash,
      name: ADMIN_NAME,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  
  console.log('✅ Admin user created successfully!\n');
  console.log('📋 Login Credentials:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('\n⚠️  IMPORTANT: Change the password immediately after first login!\n');
  console.log('🔗 Admin Dashboard: http://localhost:3000/admin\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin user:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
