import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { recordUsageEventSafe } from "@/lib/usage-tracking";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        // Keep session shape explicit so client analytics can identify consistently.
        session.user.image = user.image;
        session.user.name = user.name;
        session.user.email = user.email;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (!user?.id) {
        return;
      }

      const now = new Date();

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: now,
            lastSeenAt: now,
          } as unknown as Record<string, unknown>,
        });
      } catch (error) {
        logger.warn("auth.signIn.user_update_failed", {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      await recordUsageEventSafe(prisma, {
        eventName: "auth_sign_in",
        userId: user.id,
        route: "/api/auth/[...nextauth]",
        success: true,
        metadata: {
          provider: account?.provider ?? null,
          isNewUser,
        },
      });
    },
  },
  pages: {
    signIn: "/explore",
  },
});
