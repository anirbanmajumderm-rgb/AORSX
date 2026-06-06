import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { hashSync, compare } from "bcryptjs";
import { auth } from "@/lib/auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const session = await auth();
    const adminEmail = session?.user?.email;
    if (!adminEmail) return errorResponse("Session not found", 401);

    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
      select: { id: true, name: true, email: true, username: true, image: true, role: true, twoFactorEnabled: true },
    });
    if (!admin) return errorResponse("Admin not found", 404);

    return successResponse(admin);
  } catch (err) {
    return serverErrorResponse(err, "admin/profile");
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const session = await auth();
    const adminEmail = session?.user?.email;
    if (!adminEmail) return errorResponse("Session not found", 401);

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const currentAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
    if (!currentAdmin) return errorResponse("Admin not found", 404);

    // Password change flow
    if (currentPassword && newPassword) {
      const isValid = await compare(currentPassword, currentAdmin.password);
      if (!isValid) return errorResponse("Current password is incorrect", 400);
      if (newPassword.length < 8) return errorResponse("New password must be at least 8 characters", 400);
      await prisma.admin.update({
        where: { email: adminEmail },
        data: { password: hashSync(newPassword, 12) },
      });
      return successResponse({ message: "Password updated" });
    }

    // Profile update flow
    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email && email !== adminEmail) {
      const existing = await prisma.admin.findUnique({ where: { email } });
      if (existing) return errorResponse("Email already in use", 400);
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No data to update");
    }

    const admin = await prisma.admin.update({
      where: { email: adminEmail },
      data: updateData,
      select: { id: true, name: true, email: true, username: true, image: true, role: true },
    });

    return successResponse(admin);
  } catch {
    return errorResponse("Failed to update profile");
  }
}
