import { PrismaClient } from "@prisma/client";
import { compareSync } from "bcryptjs";
const prisma = new PrismaClient();
try {
  const admin = await prisma.admin.findFirst({ where: { OR: [{ email: "anirban" }, { username: "anirban" }] } });
  if (admin) {
    console.log(JSON.stringify({ id: admin.id, username: admin.username, email: admin.email, role: admin.role, email2FA: admin.email2FAEnabled, twoFA: admin.twoFactorEnabled, pwStart: admin.password.substring(0,30) }));
    console.log("Password valid:", compareSync("Admin@123", admin.password));
  } else {
    console.log("Admin NOT found");
  }
} catch(e) { console.error("Error:", e.message); }
finally { await prisma.$disconnect(); }
