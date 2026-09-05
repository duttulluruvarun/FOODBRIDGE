import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getLiveDashboardMetrics() {
  const [totalDonations, completedMatches, activeVolunteers] = await Promise.all([
    prisma.donation.count(),
    prisma.match.count({ where: { status: 'completed' } }),
    prisma.user.count({ where: { role: 'volunteer', availability: 'available' } })
  ]);

  // Aggregate stats
  const aggregations = await prisma.donation.aggregate({
    _sum: {
      servings: true,
      co2Saved: true,
      weightKg: true,
    }
  });

  return {
    totalDonations,
    completedDeliveries: completedMatches,
    activeVolunteers,
    mealsSaved: aggregations._sum.servings || 0,
    co2SavedKg: aggregations._sum.co2Saved || 0,
    foodSavedKg: aggregations._sum.weightKg || 0,
  };
}
