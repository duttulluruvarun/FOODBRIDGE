const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function check() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@foodbridge.com' } });
  if (admin) {
    console.log('Admin password hash:', admin.password);
    const valid = await bcrypt.compare('password123', admin.password);
    console.log('Admin password valid for password123:', valid);
  } else {
    console.log('Admin not found in DB');
  }

  const ngo = await prisma.user.findUnique({ where: { email: 'ngo@foodbridge.com' } });
  if (ngo) {
    console.log('NGO password hash:', ngo.password);
    const valid = await bcrypt.compare('password123', ngo.password);
    console.log('NGO password valid for password123:', valid);
  } else {
    console.log('NGO not found in DB');
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
