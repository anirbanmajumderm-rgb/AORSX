import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, withRateLimit } from "@/lib/api-utils";
import { notifyAdmins } from "@/lib/audit";
import { sendContactNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "contact/submit");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return errorResponse("Name, email, and message are required", 400);
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
      return errorResponse("Invalid input types", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format", 400);
    }

    const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").trim().slice(0, 1000);

    const fullQuestion = subject ? `[${sanitize(subject)}] ${sanitize(message)}` : sanitize(message);

    const question = await prisma.question.create({
      data: {
        visitorName: sanitize(name),
        visitorEmail: sanitize(email),
        question: fullQuestion,
      },
    });

    await notifyAdmins({
      type: "warning",
      title: "New contact form submission",
      description: `${sanitize(name)} (${sanitize(email)}) sent a message`,
      link: "/admin/contacts",
    });

    await sendContactNotification({
      name: sanitize(name),
      email: sanitize(email),
      message: fullQuestion,
    });

    return successResponse({ id: question.id }, 201);
  } catch {
    return errorResponse("Failed to submit message", 500);
  }
}
