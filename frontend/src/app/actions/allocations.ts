"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";

export async function getAvailableDonationsForAllocation() {
  try {
    return await prisma.donation.findMany({
      where: { status: "available" },
      include: { donor: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching available donations:", error);
    return [];
  }
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

// Requests still missing servings, sorted by priority (high first). A request
// whose allocations already meet servingsNeeded is left out entirely, even if
// its status hasn't been flipped to "fulfilled" yet.
export async function getOpenRequestsByPriority() {
  try {
    const requests = await prisma.request.findMany({
      where: { status: "open" },
      include: { ngo: true },
      orderBy: { createdAt: "desc" },
    });

    const allocatedByRequest = await prisma.allocation.groupBy({
      by: ["requestId"],
      where: { requestId: { in: requests.map((r) => r.id) } },
      _sum: { servings: true },
    });
    const allocatedMap = new Map(allocatedByRequest.map((a) => [a.requestId, a._sum.servings || 0]));

    const withRemaining = requests
      .map((r) => {
        const allocatedSoFar = allocatedMap.get(r.id) || 0;
        return { ...r, allocatedSoFar, remainingNeeded: Math.max(0, r.servingsNeeded - allocatedSoFar) };
      })
      .filter((r) => r.remainingNeeded > 0);

    return withRemaining.sort((a, b) => {
      const rankDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error("Error fetching open requests:", error);
    return [];
  }
}

export async function getAllocationHistory() {
  try {
    return await prisma.allocation.findMany({
      include: {
        donation: { include: { donor: true } },
        request: { include: { ngo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Error fetching allocation history:", error);
    return [];
  }
}

export async function allocateDonation(
  donationId: string,
  splits: { requestId: string; servings: number }[]
) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) {
      return { success: false, error: "Donation not found" };
    }

    const validSplits = splits.filter((s) => s.servings > 0);
    if (validSplits.length === 0) {
      return { success: false, error: "Allocate at least one serving to a request" };
    }

    const totalAllocated = validSplits.reduce((sum, s) => sum + s.servings, 0);
    if (totalAllocated > donation.servings) {
      return { success: false, error: "Allocated servings exceed the donation's total" };
    }

    const requests = await prisma.request.findMany({
      where: { id: { in: validSplits.map((s) => s.requestId) } },
    });
    const requestById = new Map(requests.map((r) => [r.id, r]));

    // A request can only ever be satisfied with exactly its needed amount —
    // never more. Re-check against the database (not client-supplied numbers)
    // so a stale UI can't push a request over its cap.
    const allocatedAgg = await prisma.allocation.groupBy({
      by: ["requestId"],
      where: { requestId: { in: validSplits.map((s) => s.requestId) } },
      _sum: { servings: true },
    });
    const alreadyAllocatedMap = new Map(allocatedAgg.map((a) => [a.requestId, a._sum.servings || 0]));

    for (const split of validSplits) {
      const request = requestById.get(split.requestId);
      if (!request) {
        return { success: false, error: "One of the selected requests no longer exists" };
      }
      const alreadyAllocated = alreadyAllocatedMap.get(split.requestId) || 0;
      const remainingNeeded = request.servingsNeeded - alreadyAllocated;
      if (split.servings > remainingNeeded) {
        return {
          success: false,
          error: `"${request.title}" only needs ${remainingNeeded} more serving${remainingNeeded === 1 ? "" : "s"} — can't allocate ${split.servings}`,
        };
      }
    }

    for (const split of validSplits) {
      await prisma.allocation.create({
        data: {
          donationId,
          requestId: split.requestId,
          servings: split.servings,
        },
      });

      const request = requestById.get(split.requestId)!;
      await prisma.notification.create({
        data: {
          userId: request.ngoId,
          message: `${split.servings} servings of "${donation.title}" have been allocated to your request "${request.title}".`,
        },
      });

      // Mark the request fulfilled once its exact needed quantity is met.
      const alreadyAllocated = alreadyAllocatedMap.get(split.requestId) || 0;
      if (alreadyAllocated + split.servings >= request.servingsNeeded) {
        await prisma.request.update({
          where: { id: split.requestId },
          data: { status: "fulfilled" },
        });
      }
    }

    // Fully allocated donations are considered spoken for; partial allocations
    // leave the remainder available for further splits.
    if (totalAllocated >= donation.servings) {
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "matched" },
      });
    }

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error allocating donation:", error);
    return { success: false, error: "Failed to allocate donation" };
  }
}
