"use server";

import { prisma } from 'backend';

export async function getAnalyticsData() {
  try {
    const totalDonations = await prisma.donation.count();
    const totalRequests = await prisma.request.count();
    const totalMatches = await prisma.match.count();
    
    const donationsData = await prisma.donation.findMany({
      select: { status: true, weightKg: true, servings: true },
    });

    const totalWeight = donationsData.reduce((acc, curr) => acc + curr.weightKg, 0);
    const totalServings = donationsData.reduce((acc, curr) => acc + curr.servings, 0);

    const availableCount = donationsData.filter(d => d.status === "available").length;
    const matchedCount = donationsData.filter(d => d.status === "matched").length;
    const completedCount = donationsData.filter(d => d.status === "completed").length;

    return {
      totalDonations,
      totalRequests,
      totalMatches,
      totalWeight,
      totalServings,
      statusBreakdown: {
        available: availableCount,
        matched: matchedCount,
        completed: completedCount,
      }
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}
