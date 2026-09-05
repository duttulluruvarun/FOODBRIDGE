const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./backend/dev.db'
    }
  }
});

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'ngo@foodbridge.com' } });
  console.log('User found:', user ? user.email : 'No user found');
  
  if (user) {
    const isValid = await bcrypt.compare('password123', user.password);
    console.log('Password valid:', isValid);
  }
}

test().finally(() => prisma.$disconnect());
