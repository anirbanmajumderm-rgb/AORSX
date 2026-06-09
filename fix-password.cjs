const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

(async () => {
  try {
    const hash = bcrypt.hashSync("Admin@123", 12);
    await prisma.admin.update({
      where: { id: 1 },
      data: { password: hash },
    });
    console.log("Password updated successfully");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
