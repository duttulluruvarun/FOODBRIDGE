"use server";

import { prisma } from 'backend';
import { revalidatePath } from "next/cache";

export async function getUsersByRole(role: string) {
  try {
    return await prisma.user.findMany({
      where: { role },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error(`Error fetching users by role ${role}:`, error);
    return [];
  }
}

export async function getTopVolunteers() {
  try {
    return await prisma.user.findMany({
      where: { role: 'volunteer' },
      orderBy: { completedDeliveries: 'desc' },
      take: 5
    });
  } catch (error) {
    return [];
  }
}

export async function getTopDonors() {
  try {
    return await prisma.user.findMany({
      where: { role: 'donor' },
      orderBy: { points: 'desc' },
      take: 5
    });
  } catch (error) {
    return [];
  }
}

export async function sendMessageToUser(userId: string, message: string) {
  try {
    const trimmed = message.trim();
    if (!trimmed) {
      return { success: false, error: "Message cannot be empty" };
    }
    await prisma.notification.create({
      data: {
        userId,
        message: trimmed,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending message to user:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function deleteUser(id: string) {
  try {
    // Soft delete to avoid foreign key constraint errors in the demo
    await prisma.user.update({
      where: { id },
      data: { role: 'suspended' }
    });
    // Without this the suspended user stays visible on the donors/recipients
    // lists until a hard reload.
    revalidatePath("/dashboard/donors");
    revalidatePath("/dashboard/recipients");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error suspending user:", error);
    return { success: false, error: "Failed to suspend user." };
  }
}
