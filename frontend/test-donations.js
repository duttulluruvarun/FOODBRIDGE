require('dotenv').config({ path: './.env' });
const { prisma } = require('backend');

async function check() {
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  console.log('Admin:', admin?.email);

  const donations = await prisma.donation.count({ where: { status: 'available' } });
  console.log('Available donations:', donations);

  const ngo = await prisma.user.findFirst({ where: { email: 'ngo@foodbridge.com' }});
  console.log('NGO:', ngo?.email, ngo?.role);
}

check().catch(console.error).finally(() => prisma.$disconnect());
