import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "backend"
import bcrypt from "bcrypt"

/**
 * Demo login bypass (admin/donor/ngo).
 *
 * Historically this route accepted a hardcoded `admin@foodbridge.os` / `admin`
 * credential that granted a full admin session with no database lookup. That is
 * fine for a local demo and unacceptable in production, so it is now gated:
 * enabled automatically outside production, and only enabled in production if
 * DEMO_ADMIN_ENABLED is explicitly set to "true".
 *
 * Set DEMO_ADMIN_ENABLED="false" in .env to turn it off entirely.
 */
const demoAdminEnabled =
  process.env.DEMO_ADMIN_ENABLED === "true" ||
  (process.env.DEMO_ADMIN_ENABLED !== "false" &&
    process.env.NODE_ENV !== "production")

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "admin@foodbridge.os",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Stored emails are seeded with mixed case and SQLite string equality is
        // case-sensitive, so the lookup must use the address exactly as typed.
        // Only the fixed demo-admin address is compared case-insensitively.
        const email = credentials.email.trim()

        if (
          demoAdminEnabled &&
          email.toLowerCase() === "admin@foodbridge.os" &&
          credentials.password === "admin"
        ) {
          return {
            id: "admin-1",
            name: "Nitin Kannan",
            email: "admin@foodbridge.os",
            role: "admin",
          } as never
        }

        // Resolves to a real seeded donor (not a synthetic id) so the donor
        // dashboard shows actual data instead of an empty "0 everywhere" view.
        if (
          demoAdminEnabled &&
          email.toLowerCase() === "donor@foodbridge.os" &&
          credentials.password === "donor"
        ) {
          const demoDonor = await prisma.user.findFirst({ where: { role: "donor" } })
          if (demoDonor) {
            return {
              id: demoDonor.id,
              name: demoDonor.name,
              email: "donor@foodbridge.os",
              role: "donor",
            } as never
          }
        }

        // Resolves to a real seeded NGO (not a synthetic id) so the NGO
        // dashboard shows actual data instead of an empty "0 everywhere" view.
        if (
          demoAdminEnabled &&
          email.toLowerCase() === "ngo@foodbridge.os" &&
          credentials.password === "ngo"
        ) {
          const demoNgo = await prisma.user.findFirst({ where: { role: "ngo" } })
          if (demoNgo) {
            return {
              id: demoNgo.id,
              name: demoNgo.name,
              email: "ngo@foodbridge.os",
              role: "ngo",
            } as never
          }
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        // Seeded/demo rows can carry a non-bcrypt placeholder password.
        // bcrypt.compare throws on a malformed hash, which would surface as a
        // 500 instead of a clean "invalid credentials", so guard it.
        let isPasswordValid = false
        try {
          isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
        } catch {
          isPasswordValid = false
        }
        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        } as never
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as Record<string, unknown>).role = token.role
        ;(session.user as Record<string, unknown>).id = token.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role?: string }).role
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
}
