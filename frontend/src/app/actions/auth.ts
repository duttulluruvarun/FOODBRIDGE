"use server";

import { prisma } from 'backend';
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    const user = session.user as { name?: string; email?: string; role?: string };
    return {
      name: user.name || "User",
      email: user.email || "",
      role: user.role || "admin",
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const role = formData.get("role") as string;
  const securityQuestion = formData.get("securityQuestion") as string;
  const securityAnswer = formData.get("securityAnswer") as string;

  if (!name || !email || !password || !confirmPassword || !role || !securityQuestion || !securityAnswer) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, // "donor", "ngo", "admin"
        securityQuestion,
        securityAnswer: securityAnswer.trim().toLowerCase(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to register user" };
  }
}

export async function getSecurityQuestion(email: string) {
  if (!email) return { error: "Email is required" };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { securityQuestion: true },
    });

    if (!user) {
      return { error: "No account found with this email" };
    }

    if (!user.securityQuestion) {
      return { error: "No security question set for this account" };
    }

    return { question: user.securityQuestion };
  } catch (error) {
    console.error("Error fetching security question:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const answer = formData.get("securityAnswer") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!email || !answer || !newPassword) {
    return { error: "All fields are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const normalizedProvidedAnswer = answer.trim().toLowerCase();
    
    // The DB stores the answer as trimmed lowercase during registration
    if (user.securityAnswer !== normalizedProvidedAnswer) {
      return { error: "Invalid answer to the security question" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { error: "An unexpected error occurred while resetting password" };
  }
}
