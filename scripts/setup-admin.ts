/**
 * Setup Initial Admin User
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup-admin.ts
 *
 * Creates admin@gmail.com with password: admin@123
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
  });
}

const prisma = createPrismaClient();

async function main() {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin@123';
  const adminName = 'System Admin';

  console.log('🔐 Setting up admin user...\n');

  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isAdmin: true,
      isActive: true,
      name: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash,
      isAdmin: true,
      isActive: true,
      name: adminName,
    },
  });

  console.log('✅ Admin user created/updated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:    ', adminEmail);
  console.log('🔑 Password: ', adminPassword);
  console.log('👤 Name:     ', adminName);
  console.log('🛡️  Admin:    ', admin.isAdmin ? 'Yes' : 'No');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🌐 Login at: http://localhost:3000/admin/login\n');

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('❌ Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
