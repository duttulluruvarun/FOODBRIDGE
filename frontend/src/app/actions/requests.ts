"use server";

import { prisma } from 'backend';
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";



export async function getRequests() {
  try {
    // NGOs only see their own requests; admins see everything.
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    const userId = (session?.user as { id?: string } | undefined)?.id;

    const where: Record<string, unknown> =
      role === "ngo" && userId ? { ngoId: userId } : {};

    return await prisma.request.findMany({
      where,
      include: {
        ngo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
}

export async function createRequest(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const hoursNeeded = parseInt(formData.get("hoursNeeded") as string);
    const priority = (formData.get("priority") as string) || "medium";
    const servingsNeeded = Math.max(1, parseInt(formData.get("servingsNeeded") as string) || 1);

    // For demo purposes, assign it to the first NGO in DB
    const firstNgo = await prisma.user.findFirst({ where: { role: 'ngo' } });

    if (!firstNgo) {
      throw new Error("No NGO found to assign request to");
    }

    await prisma.request.create({
      data: {
        title,
        description,
        neededBy: new Date(Date.now() + 1000 * 60 * 60 * hoursNeeded),
        priority,
        servingsNeeded,
        ngoId: firstNgo.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: firstNgo.id,
        message: `New food request posted: "${title}".`,
      },
    });

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error creating request:", error);
    return { success: false, error: "Failed to create request" };
  }
}

export async function deleteRequest(id: string) {
  try {
    await prisma.request.delete({
      where: { id }
    });
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting request:", error);
    return { success: false, error: "Failed to delete request" };
  }
}

export async function updateRequestStatus(id: string, status: string) {
  try {
    await prisma.request.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating request status:", error);
    return { success: false, error: "Failed to update request status" };
  }
}

export async function editRequest(id: string, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;
    const servingsNeededRaw = formData.get("servingsNeeded") as string;

    let servingsNeededUpdate: { servingsNeeded?: number } = {};
    if (servingsNeededRaw) {
      const servingsNeeded = Math.max(1, parseInt(servingsNeededRaw) || 1);
      const allocatedAgg = await prisma.allocation.aggregate({
        where: { requestId: id },
        _sum: { servings: true },
      });
      const alreadyAllocated = allocatedAgg._sum.servings || 0;
      if (servingsNeeded < alreadyAllocated) {
        return { success: false, error: `Can't set below ${alreadyAllocated} servings already allocated` };
      }
      servingsNeededUpdate = { servingsNeeded };
    }

    await prisma.request.update({
      where: { id },
      data: {
        title,
        description,
        ...(priority ? { priority } : {}),
        ...servingsNeededUpdate,
      }
    });

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error editing request:", error);
    return { success: false, error: "Failed to edit request" };
  }
}

export async function assignVolunteer(id: string) {
  try {
    // For demo, just find the first volunteer and associate them,
    // or just change status if we don't have a direct relation set up in schema yet
    await prisma.request.update({
      where: { id },
      data: { status: "matched" }
    });

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error assigning volunteer:", error);
    return { success: false, error: "Failed to assign volunteer" };
  }
}
