require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addData() {
  const defaultDonor = await prisma.user.findFirst({ where: { email: 'donor@foodbridge.com' } });
  if (defaultDonor) {
    console.log('Adding donations for default donor...');
    await prisma.donation.createMany({
      data: [
        {
          title: "Surplus Buffet from Wedding",
          description: "Freshly cooked vegetarian buffet items.",
          weightKg: 25.5,
          servings: 100,
          status: "available",
          expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
          foodType: "veg",
          temperature: "hot",
          qualityScore: 0.95,
          predictedShelfLife: 24,
          co2Saved: 25.5 * 2.5,
          category: "cooked",
          pickupLatitude: defaultDonor.latitude || 28.5,
          pickupLongitude: defaultDonor.longitude || 77.1,
          donorId: defaultDonor.id,
        },
        {
          title: "Packaged Bread and Buns",
          description: "Unopened packets of bread near expiry.",
          weightKg: 5.0,
          servings: 30,
          status: "available",
          expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours from now
          foodType: "veg",
          temperature: "room",
          qualityScore: 0.88,
          predictedShelfLife: 48,
          co2Saved: 5.0 * 2.5,
          category: "packaged",
          pickupLatitude: defaultDonor.latitude || 28.5,
          pickupLongitude: defaultDonor.longitude || 77.1,
          donorId: defaultDonor.id,
        }
      ]
    });
    console.log('Successfully added donations for donor@foodbridge.com!');
  } else {
    console.log('Could not find donor@foodbridge.com');
  }

  const defaultNgo = await prisma.user.findFirst({ where: { email: 'ngo@foodbridge.com' } });
  if (defaultNgo) {
    console.log('Adding requests for default NGO...');
    await prisma.request.createMany({
      data: [
        {
          title: "Food needed for 50 shelter residents",
          description: "Looking for cooked meals for our evening distribution.",
          neededBy: new Date(Date.now() + 1000 * 60 * 60 * 12),
          status: "open",
          priority: "high",
          servingsNeeded: 50,
          ngoId: defaultNgo.id,
        },
        {
          title: "Weekend community drive",
          description: "Packaged foods for distribution.",
          neededBy: new Date(Date.now() + 1000 * 60 * 60 * 72),
          status: "open",
          priority: "medium",
          servingsNeeded: 150,
          ngoId: defaultNgo.id,
        }
      ]
    });
    console.log('Successfully added requests for ngo@foodbridge.com!');
  } else {
    console.log('Could not find ngo@foodbridge.com');
  }
}

addData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
