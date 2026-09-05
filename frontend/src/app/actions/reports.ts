"use server";

import { prisma } from 'backend';

export async function getDonationComplianceReportData() {
  try {
    const donations = await prisma.donation.findMany({
      include: { donor: true },
      orderBy: { createdAt: "desc" },
    });

    return donations.map((d) => ({
      donationId: d.id,
      title: d.title,
      status: d.status,
      weightKg: d.weightKg,
      servings: d.servings,
      foodType: d.foodType || "N/A",
      category: d.category || "N/A",
      temperature: d.temperature || "N/A",
      qualityScore: d.qualityScore ?? "N/A",
      predictedShelfLifeHrs: d.predictedShelfLife ?? "N/A",
      co2SavedKg: d.co2Saved ?? "N/A",
      isEmergency: d.isEmergency,
      expiryTime: d.expiryTime.toISOString(),
      createdAt: d.createdAt.toISOString(),
      donorName: d.donor?.name || "Unknown",
      donorEmail: d.donor?.email || "N/A",
      donorAddress: d.donor?.address || "N/A",
    }));
  } catch (error) {
    console.error("Error generating donation compliance report:", error);
    return [];
  }
}

export async function getNgoFulfillmentReportData() {
  try {
    const matches = await prisma.match.findMany({
      where: { status: "completed" },
      include: {
        donation: true,
        ngo: true,
        assignedVolunteer: true,
      },
      orderBy: { completedAt: "desc" },
    });

    return matches.map((m) => {
      const capacity = m.ngo?.capacity ?? null;
      const servings = m.donation?.servings ?? 0;
      const fulfillmentPct = capacity ? Math.round((servings / capacity) * 1000) / 10 : "N/A";

      return {
        matchId: m.id,
        ngoName: m.ngo?.name || "Unknown",
        ngoCapacity: capacity ?? "N/A",
        donationTitle: m.donation?.title || "N/A",
        servingsDelivered: servings,
        weightKgDelivered: m.donation?.weightKg ?? 0,
        capacityFulfillmentPct: fulfillmentPct,
        distanceKm: m.distance ?? "N/A",
        travelTimeMin: m.travelTime ?? "N/A",
        matchScore: m.matchScore ?? "N/A",
        volunteerName: m.assignedVolunteer?.name || "Unassigned",
        completedAt: m.completedAt ? m.completedAt.toISOString() : "N/A",
      };
    });
  } catch (error) {
    console.error("Error generating NGO fulfillment report:", error);
    return [];
  }
}

export async function getDonorTaxReportData() {
  try {
    const donors = await prisma.user.findMany({
      where: { role: 'donor' },
      include: {
        donations: true
      }
    });

    const reportData = donors.map(donor => {
      const totalDonations = donor.donations.length;
      const totalWeightKg = donor.donations.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
      const totalCo2Saved = donor.donations.reduce((acc, curr) => acc + (curr.co2Saved || 0), 0);
      
      // Mock financial value: ₹150 per kg of food
      const estimatedValueINR = totalWeightKg * 150;
      const deductibleValueINR = estimatedValueINR * 0.5; // 50% under 80G

      return {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        address: donor.address || 'Address not provided',
        panNumber: 'ABCDE1234F', // Mock PAN for hackathon demo
        totalDonations,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        totalCo2Saved: Math.round(totalCo2Saved * 10) / 10,
        estimatedValueINR,
        deductibleValueINR
      };
    });

    // Only return donors who have actually donated
    return reportData.filter(d => d.totalDonations > 0).sort((a, b) => b.totalWeightKg - a.totalWeightKg);

  } catch (error) {
    console.error("Error generating tax report data:", error);
    return [];
  }
}
