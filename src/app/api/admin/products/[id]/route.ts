import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT", "SUSPEND", "REPUBLISH"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid");
    const action = parsed.data.action;

    let status: "PUBLISHED" | "REJECTED" | "SUSPENDED" = "PUBLISHED";
    switch (action) {
      case "APPROVE":
      case "REPUBLISH":
        status = "PUBLISHED";
        break;
      case "REJECT":
        status = "REJECTED";
        break;
      case "SUSPEND":
        status = "SUSPENDED";
        break;
    }

    // §6.10 — `isVerified` badge must require BOTH product approval AND seller verification.
    // We look up the seller's verification state and gate the flag here.
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { seller: { select: { verificationStatus: true } } },
    });
    if (!product) throw new ApiError(404, "Product not found");

    const sellerApproved = product.seller.verificationStatus === "APPROVED";
    const showVerifiedBadge = status === "PUBLISHED" && sellerApproved;

    await prisma.product.update({
      where: { id: params.id },
      data: { status, isModerated: true, isVerified: showVerifiedBadge },
    });
    await logAudit({
      actorId: session.user.id,
      action:
        action === "APPROVE" || action === "REPUBLISH"
          ? "PRODUCT_APPROVED"
          : action === "REJECT"
            ? "PRODUCT_REJECTED"
            : "PRODUCT_SUSPENDED",
      subject: `Product:${params.id}`,
      metadata: { action, sellerApproved },
    });
    return NextResponse.json({ ok: true, status, isVerified: showVerifiedBadge });
  } catch (err) {
    return toApiResponse(err);
  }
}
