const { PrismaClient } = require('@prisma/client');
const { fakerEN_IN: faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.allocation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.match.deleteMany();
  await prisma.request.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Creating default Admin, Donor, and NGO accounts...');
  await prisma.user.create({
    data: {
      email: 'admin@foodbridge.com',
      password: passwordHash,
      name: 'Admin User',
      role: 'admin',
    }
  });

  await prisma.user.create({
    data: {
      email: 'donor@foodbridge.com',
      password: passwordHash,
      name: 'Default Donor',
      role: 'donor',
      address: 'Sector 17, Chandigarh',
      contactNumber: '9876543210',
      latitude: 28.5,
      longitude: 77.1,
    }
  });

  await prisma.user.create({
    data: {
      email: 'ngo@foodbridge.com',
      password: passwordHash,
      name: 'Default NGO',
      role: 'ngo',
      address: 'MG Road, Bengaluru',
      contactNumber: '9988776655',
      latitude: 28.6,
      longitude: 77.2,
      capacity: 200,
      organizationType: 'Shelter',
    }
  });

  const indianAddresses = [
    "MG Road, Bengaluru, Karnataka",
    "Connaught Place, New Delhi, Delhi",
    "Andheri West, Mumbai, Maharashtra",
    "T Nagar, Chennai, Tamil Nadu",
    "Banjara Hills, Hyderabad, Telangana",
    "Koramangala, Bengaluru, Karnataka",
    "Salt Lake City, Kolkata, West Bengal",
    "Sector 17, Chandigarh",
    "Hinjewadi, Pune, Maharashtra",
    "Civil Lines, Jaipur, Rajasthan",
    "Gomti Nagar, Lucknow, Uttar Pradesh",
    "Vastrapur, Ahmedabad, Gujarat"
  ];

  const ngoNames = [
    "Akshaya Patra Foundation",
    "Robin Hood Army",
    "Goonj",
    "Feeding India",
    "Smile Foundation",
    "Uday Foundation",
    "No Food Waste",
    "Roti Bank",
    "Annadanam Society",
    "Hope Foundation"
  ];

  const restaurantNames = [
    "Hotel Green Park",
    "Spice Route",
    "Sagar Ratna",
    "Bikanerwala",
    "Haldiram's",
    "Saravana Bhavan",
    "Punjabi Dhaba",
    "Biryani House",
    "Barbeque Nation",
    "Mainland China",
    "MTR (Mavalli Tiffin Room)"
  ];

  // 1. Create 50 NGOs
  console.log('Creating 50 NGOs...');
  const ngos = [];
  for (let i = 0; i < 50; i++) {
    const ngo = await prisma.user.create({
      data: {
        email: `ngo${i}_${faker.internet.email()}`,
        password: passwordHash,
        name: faker.helpers.arrayElement(ngoNames),
        role: 'ngo',
        address: faker.helpers.arrayElement(indianAddresses),
        contactNumber: faker.phone.number(),
        capacity: faker.number.int({ min: 50, max: 500 }),
        latitude: faker.location.latitude({ max: 28.7, min: 28.4 }), // Approx Delhi bounds
        longitude: faker.location.longitude({ max: 77.3, min: 77.0 }),
        organizationType: faker.helpers.arrayElement(['Orphanage', 'Shelter', 'Community Kitchen']),
        rating: faker.number.float({ min: 3.5, max: 5.0, multipleOf: 0.1 }),
      }
    });
    ngos.push(ngo);
  }

  // 2. Create 200 Donors
  console.log('Creating 200 Donors...');
  const donors = [];
  for (let i = 0; i < 200; i++) {
    const donor = await prisma.user.create({
      data: {
        email: `donor${i}_${faker.internet.email()}`,
        password: passwordHash,
        name: faker.helpers.arrayElement(restaurantNames), // e.g. Restaurant name
        role: 'donor',
        address: faker.helpers.arrayElement(indianAddresses),
        contactNumber: faker.phone.number(),
        latitude: faker.location.latitude({ max: 28.7, min: 28.4 }),
        longitude: faker.location.longitude({ max: 77.3, min: 77.0 }),
        rating: faker.number.float({ min: 3.5, max: 5.0, multipleOf: 0.1 }),
        badges: faker.helpers.arrayElement(['Gold Donor', 'Food Hero', 'Green Champion', null]),
        points: faker.number.int({ min: 100, max: 2000 })
      }
    });
    donors.push(donor);
  }

  // 3. Create 300 Donations
  console.log('Creating 300 Donations...');
  for (let i = 0; i < 300; i++) {
    const donor = faker.helpers.arrayElement(donors);
    const isEmergency = faker.datatype.boolean({ probability: 0.1 });

    await prisma.donation.create({
      data: {
        title: faker.food.dish(),
        description: faker.food.description(),
        weightKg: faker.number.float({ min: 5, max: 50, multipleOf: 0.1 }),
        servings: faker.number.int({ min: 20, max: 200 }),
        status: faker.helpers.arrayElement(['available', 'matched', 'completed']),
        expiryTime: faker.date.soon({ days: 2 }),
        foodType: faker.helpers.arrayElement(['veg', 'nonVeg']),
        temperature: faker.helpers.arrayElement(['hot', 'cold', 'room']),
        qualityScore: faker.number.float({ min: 0.7, max: 0.99, multipleOf: 0.01 }),
        predictedShelfLife: faker.number.int({ min: 4, max: 48 }),
        co2Saved: faker.number.float({ min: 2, max: 20, multipleOf: 0.1 }),
        category: faker.helpers.arrayElement(['cooked', 'raw', 'packaged']),
        isEmergency,
        pickupLatitude: donor.latitude,
        pickupLongitude: donor.longitude,
        donorId: donor.id,
      }
    });
  }

  // 4. Create 150 Requests
  console.log('Creating 150 Requests...');
  const requestReasons = [
    "We are hosting a community meal and need surplus food.",
    "Urgent requirement for daily wage workers in our area.",
    "Need meals for our evening shelter distribution drive.",
    "Looking for surplus food to distribute in the local community.",
    "Food required for children at the local orphanage.",
    "Need packed meals for our weekend food drive."
  ];

  for (let i = 0; i < 150; i++) {
    const ngo = faker.helpers.arrayElement(ngos);
    await prisma.request.create({
      data: {
        title: `Food needed for ${faker.number.int({ min: 20, max: 100 })} people`,
        description: faker.helpers.arrayElement(requestReasons),
        neededBy: faker.date.soon({ days: 3 }),
        status: faker.helpers.arrayElement(['open', 'fulfilled']),
        ngoId: ngo.id,
      }
    });
  }

  // 5. Create some Volunteers
  console.log('Creating Volunteers...');
  const volunteers = [];
  for (let i = 0; i < 10; i++) {
    const vol = await prisma.user.create({
      data: {
        email: `vol${i}_${faker.internet.email()}`,
        password: passwordHash,
        name: faker.person.fullName(),
        role: 'volunteer',
        contactNumber: faker.phone.number(),
        latitude: faker.location.latitude({ max: 28.7, min: 28.4 }),
        longitude: faker.location.longitude({ max: 77.3, min: 77.0 }),
        availability: 'available',
        vehicle: faker.helpers.arrayElement(['Bike', 'Car', 'Van']),
        rating: faker.number.float({ min: 4.0, max: 5.0, multipleOf: 0.1 }),
      }
    });
    volunteers.push(vol);
  }

  // 6. Create Matches
  console.log('Creating Matches...');
  const matchedDonations = await prisma.donation.findMany({
    where: { status: { in: ['matched', 'completed'] } }
  });

  for (const donation of matchedDonations) {
    const ngo = faker.helpers.arrayElement(ngos);
    const volunteer = faker.helpers.arrayElement(volunteers);

    await prisma.match.create({
      data: {
        status: donation.status === 'completed' ? 'completed' : faker.helpers.arrayElement(['in_progress', 'picked_up']),
        distance: faker.number.float({ min: 1, max: 15, multipleOf: 0.1 }),
        travelTime: faker.number.int({ min: 10, max: 60 }),
        matchScore: faker.number.float({ min: 0.8, max: 0.99, multipleOf: 0.01 }),
        donationId: donation.id,
        ngoId: ngo.id,
        assignedVolunteerId: volunteer.id,
        completedAt: donation.status === 'completed' ? faker.date.recent() : null,
      }
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
