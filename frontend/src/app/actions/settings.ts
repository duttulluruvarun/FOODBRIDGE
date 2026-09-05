"use server";

import { prisma } from '@/lib/prisma';
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function updateProfile(formData: FormData) {
  try {
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const address = (formData.get("address") as string | null)?.trim() ?? "";

    if (!name) {
      return { success: false, error: "Name is required" };
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return { success: false, error: "You must be signed in to update your profile" };
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { name, address },
      });
    } else {
      // The gated demo admin authenticates without a database row, so there is
      // nothing to update on first save. Create the row instead of throwing a
      // record-not-found error. The password is a random unusable hash: this
      // account signs in through the demo bypass, never through a password.
      const unusablePassword = await bcrypt.hash(
        crypto.randomUUID() + crypto.randomUUID(),
        10
      );

      await prisma.user.create({
        data: {
          email,
          name,
          address,
          password: unusablePassword,
          role: (session.user as { role?: string }).role ?? "admin",
        },
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
