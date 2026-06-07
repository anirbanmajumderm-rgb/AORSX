import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { logger } from "./app-logger";
import { createAuditLog, createNotification } from "./audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const login = credentials.email as string;
        const password = credentials.password as string;

        try {
          const admin = await prisma.admin.findFirst({
            where: { OR: [{ email: login }, { username: login }] },
          });
          if (!admin) return null;

          const isValid = await compare(password, admin.password);
          if (!isValid) {
            createNotification({
              adminId: admin.id,
              type: "warning",
              title: "Failed Login Attempt",
              description: `Failed login attempt for ${login}`,
            });
            createAuditLog({
              adminId: admin.id,
              action: "login.failed",
              resource: "admin",
              resourceId: admin.id,
              details: `Failed login attempt for ${login}`,
            });
            return null;
          }

          createAuditLog({
            adminId: admin.id,
            action: "login.success",
            resource: "admin",
            resourceId: admin.id,
            details: `Successful login for ${login}`,
          });

          return {
            id: String(admin.id),
            email: admin.email,
            name: admin.name,
            image: admin.image,
          };
        } catch (err) {
          logger.error("Auth", "authorize error", {
            error: err instanceof Error ? err.message : String(err),
          });
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});
