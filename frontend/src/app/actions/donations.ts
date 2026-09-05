"use server";

import { prisma } from 'backend';
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeFoodImage } from "@/lib/ai/quality";
import { predictShelfLife } from "@/lib/ai/prediction";



export async function getDonations() {
  try {
    // Donors only see their own donations; NGOs only see what's currently
    // available to claim; admins see everything.
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    const userId = (session?.user as { id?: string } | undefined)?.id;

    let where: Record<string, unknown> = {};
    if (role === "donor" && userId) where = { donorId: userId };
    else if (role === "ngo") where = { status: "available" };

    return await prisma.donation.findMany({
      where,
      include: {
        donor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

export async function createDonation(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const weightKg = parseFloat(formData.get("weightKg") as string);
    const servings = parseInt(formData.get("servings") as string);
    
    // New fields
    const foodType = (formData.get("foodType") as string) || "veg";
    const temperature = (formData.get("temperature") as string) || "room";
    const imageUrl = (formData.get("imageUrl") as string) || "";
    
    // AI Inference
    const { qualityScore, category: aiCategory, isSafe } = await analyzeFoodImage(imageUrl);

    if (!isSafe) {
      return { success: false, error: "Food failed AI safety check" };
    }

    // Optional manual overrides (used by the quick-ingestion dialog)
    const categoryOverride = (formData.get("category") as string) || "";
    const category = categoryOverride || aiCategory;

    const statusOverride = (formData.get("status") as string) || "";

    const shelfLifeOverride = parseInt(formData.get("predictedShelfLife") as string);
    const predictedShelfLife = Number.isFinite(shelfLifeOverride) && shelfLifeOverride > 0
      ? shelfLifeOverride
      : predictShelfLife(foodType, temperature);

    const organizationName = (formData.get("organizationName") as string)?.trim();

    let donorUser = null;
    
    if (organizationName) {
      // Find exact or case-insensitive match (for SQLite, equals is usually case-sensitive but we'll try findFirst)
      donorUser = await prisma.user.findFirst({
        where: { name: organizationName, role: 'donor' }
      });

      // If it doesn't exist, create a dummy one for the demo
      if (!donorUser) {
        const dummyEmail = `${organizationName.replace(/\s+/g, '').toLowerCase()}-${Math.floor(Math.random() * 1000)}@dummy.com`;
        donorUser = await prisma.user.create({
          data: {
            name: organizationName,
            email: dummyEmail,
            password: 'dummy',
            role: 'donor',
            address: 'Unknown Location',
            latitude: 12.9716, // Bangalore default
            longitude: 77.5946
          }
        });
      }
    } else {
      // Fallback if not provided (shouldn't happen with the new UI)
      donorUser = await prisma.user.findFirst({ where: { role: 'donor' } });
    }
    
    if (!donorUser) {
      throw new Error("No donor found to assign donation to");
    }

    // Co2 saved = ~2.5 kg per kg of food saved
    const co2Saved = weightKg * 2.5;

    await prisma.donation.create({
      data: {
        title,
        description,
        weightKg,
        servings,
        expiryTime: new Date(Date.now() + 1000 * 60 * 60 * predictedShelfLife),
        donorId: donorUser.id,
        foodType,
        temperature,
        qualityScore,
        category,
        predictedShelfLife,
        co2Saved,
        pickupLatitude: donorUser.latitude,
        pickupLongitude: donorUser.longitude,
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(statusOverride ? { status: statusOverride } : {}),
      },
    });

    await prisma.notification.create({
      data: {
        userId: donorUser.id,
        message: `New donation posted: "${title}" — ${weightKg}kg, ${servings} servings.`,
      },
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error creating donation:", error);
    return { success: false, error: "Failed to create donation" };
  }
}

export async function deleteDonation(id: string) {
  try {
    await prisma.donation.delete({
      where: { id }
    });
    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting donation:", error);
    return { success: false, error: "Failed to delete donation" };
  }
}

export async function updateDonationStatus(id: string, status: string) {
  try {
    await prisma.donation.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating donation status:", error);
    return { success: false, error: "Failed to update donation status" };
  }
}

export async function editDonation(id: string, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const weightKg = parseFloat(formData.get("weightKg") as string);
    const servings = parseInt(formData.get("servings") as string);

    await prisma.donation.update({
      where: { id },
      data: {
        title,
        description,
        weightKg,
        servings,
      }
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error editing donation:", error);
    return { success: false, error: "Failed to edit donation" };
  }
}
