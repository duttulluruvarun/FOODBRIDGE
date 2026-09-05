"use server";

import { prisma } from 'backend';
import { revalidatePath } from "next/cache";

export async function getMatches() {
  try {
    return await prisma.match.findMany({
      include: {
        donation: {
          include: { donor: true }
        },
        ngo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

export async function getMatchById(id: string) {
  try {
    return await prisma.match.findUnique({
      where: { id },
      include: {
        donation: {
          include: { donor: true }
        },
        ngo: true,
        assignedVolunteer: true,
      },
    });
  } catch (error) {
    console.error("Error fetching match by id:", error);
    return null;
  }
}

