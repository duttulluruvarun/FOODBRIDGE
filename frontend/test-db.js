require('dotenv').config({ path: './.env' });
const { prisma } = require('backend');

async function check() {
  console.log('DATABASE_URL is:', process.env.DATABASE_URL);
  try {
    const admin = await prisma.user.findFirst();
    console.log('Admin found:', admin ? admin.email : 'No user found');
  } catch (err) {
    console.error('Error connecting to DB:', err);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
