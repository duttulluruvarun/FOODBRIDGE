"use server";

import { prisma } from 'backend';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getDashboardStats() {
  try {
    // Donors only see stats scoped to their own donations; NGOs only see
    // what's currently available to claim (plus their own delivery metrics
    // below); admins see everything.
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    const userId = (session?.user as { id?: string } | undefined)?.id;

    let donationWhere: Record<string, unknown> = {};
    if (role === "donor" && userId) donationWhere = { donorId: userId };
    else if (role === "ngo") donationWhere = { status: "available" };

    const isNgo = role === "ngo" && !!userId;

    // None of these queries depend on each other, so run them concurrently
    // instead of paying for each round trip in sequence.
    const [
      totalDonations,
      totalRecipients,
      successfulMatches,
      foodSavedAgg,
      statusGroups,
      recentDonations,
      deliveriesToYou,
      completedMatches,
    ] = await Promise.all([
      prisma.donation.count({ where: donationWhere }),
      prisma.user.count({ where: { role: 'ngo' } }),
      prisma.match.count(),
      prisma.donation.aggregate({
        where: donationWhere,
        _sum: { weightKg: true, co2Saved: true },
      }),
      prisma.donation.groupBy({
        by: ['status'],
        where: donationWhere,
        _count: { status: true },
      }),
      prisma.donation.findMany({
        where: donationWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { donor: true },
      }),
      isNgo ? prisma.match.count({ where: { ngoId: userId } }) : Promise.resolve(0),
      isNgo
        ? prisma.match.findMany({ where: { ngoId: userId, status: "completed" }, include: { donation: true } })
        : Promise.resolve([]),
    ]);

    const totalFoodSaved = Math.round(foodSavedAgg._sum.weightKg || 0);
    const totalCo2Saved = Math.round(foodSavedAgg._sum.co2Saved || 0);
    const ngoFoodReceivedKg = Math.round(
      completedMatches.reduce((sum, m) => sum + (m.donation?.weightKg || 0), 0)
    );

    // Format Pie Chart Data
    const statusColors: Record<string, string> = {
      'available': '#10B981',
      'matched': '#3B82F6',
      'picked_up': '#F59E0B',
      'completed': '#8B5CF6',
      'expired': '#EF4444'
    };

    const pieData = statusGroups.map(group => ({
      name: group.status.charAt(0).toUpperCase() + group.status.slice(1).replace('_', ' '),
      value: group._count.status,
      color: statusColors[group.status] || '#CBD5E1'
    }));

    return {
      success: true,
      data: {
        totalDonations,
        totalRecipients,
        successfulMatches,
        totalFoodSaved,
        totalCo2Saved,
        deliveriesToYou,
        ngoFoodReceivedKg,
        pieData,
        recentDonations
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

export async function getAllNotifications() {
  try {
    return await prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return [];
  }
}

export async function markAllNotificationsRead() {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return { success: false };
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to clear notification" };
  }
}

export async function clearAllNotifications() {
  try {
    await prisma.notification.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    return { success: false, error: "Failed to clear notifications" };
  }
}

export async function getUnreadNotificationCount() {
  try {
    const [count, latest] = await Promise.all([
      prisma.notification.count({ where: { read: false } }),
      prisma.notification.findMany({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return { success: true, count, latest };
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return { success: false, count: 0, latest: [] };
  }
}
