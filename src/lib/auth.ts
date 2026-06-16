import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { logger } from "./app-logger";
import { createAuditLog, createNotification } from "./audit";

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

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

          const now = new Date();

          if (admin.lockoutUntil && admin.lockoutUntil > now) {
            const remainingMs = admin.lockoutUntil.getTime() - now.getTime();
            logger.warn("Auth", `Account locked for ${login}`, { remainingMs });
            createAuditLog({
              adminId: admin.id,
              action: "login.locked",
              resource: "admin",
              resourceId: admin.id,
              details: `Login blocked - account locked until ${admin.lockoutUntil.toISOString()}`,
            });
            return null;
          }

          const isValid = await compare(password, admin.password);
          if (!isValid) {
            const newAttempts = admin.failedLoginAttempts + 1;
            const updateData: Record<string, unknown> = {
              failedLoginAttempts: newAttempts,
            };

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
              updateData.lockoutUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
              logger.warn("Auth", `Account locked due to ${newAttempts} failed attempts`, { login });
              createNotification({
                adminId: admin.id,
                type: "warning",
                title: "Account Locked",
                description: `Account locked for 15 minutes due to ${newAttempts} failed login attempts`,
              });
            } else {
              createNotification({
                adminId: admin.id,
                type: "warning",
                title: "Failed Login Attempt",
                description: `Failed login attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS} for ${login}`,
              });
            }

            await prisma.admin.update({
              where: { id: admin.id },
              data: updateData,
            });

            createAuditLog({
              adminId: admin.id,
              action: "login.failed",
              resource: "admin",
              resourceId: admin.id,
              details: `Failed login attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS} for ${login}`,
            });
            return null;
          }

          if (admin.failedLoginAttempts > 0) {
            await prisma.admin.update({
              where: { id: admin.id },
              data: { failedLoginAttempts: 0, lockoutUntil: null },
            });
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
            tokenVersion: admin.tokenVersion,
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
        (token as any).tokenVersion = (user as any).tokenVersion;
      }
      if (account) {
        token.accessToken = account.access_token;
      }

      if (token.email && (token as any).tokenVersion !== undefined) {
        try {
          const admin = await prisma.admin.findUnique({
            where: { email: token.email as string },
            select: { tokenVersion: true },
          });
          if (admin && admin.tokenVersion !== (token as any).tokenVersion) {
            const invalidated = { ...token };
            invalidated.name = "";
            invalidated.email = "";
            invalidated.id = "";
            (invalidated as any).tokenVersion = undefined;
            return invalidated;
          }
        } catch {
          return token;
        }
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
