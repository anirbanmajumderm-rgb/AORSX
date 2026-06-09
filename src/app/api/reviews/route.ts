import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const showAll = url.searchParams.get("admin") === "true";
    if (showAll) {
      const authError = await requireAuth();
      if (authError) return authError;
    }
    const reviews = await prisma.review.findMany({
      where: showAll ? undefined : { isApproved: true, isSpam: false },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true, slug: true } } },
      take: 100,
    });
    return successResponse(reviews);
  } catch {
    return errorResponse("Failed to fetch reviews");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const review = await prisma.review.create({
      data: {
        projectId: body.projectId,
        reviewerName: body.reviewerName,
        reviewerEmail: body.reviewerEmail || null,
        rating: body.rating || 5,
        reviewText: body.reviewText || null,
        isApproved: body.isApproved ?? false,
        isSpam: body.isSpam ?? false,
      },
    });
    return successResponse(review, 201);
  } catch {
    return errorResponse("Failed to create review");
  }
}
