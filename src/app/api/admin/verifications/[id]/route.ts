import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { computeRiskScore, isHighRisk } from "@/lib/risk";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  sellerId: z.string(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid");

    const approving = parsed.data.action === "APPROVE";

    await prisma.$transaction([
      prisma.sellerVerificationRequest.update({
        where: { id: params.id },
        data: {
          status: approving ? "APPROVED" : "REJECTED",
          reviewedAt: new Date(),
          reviewerId: session.user.id,
        },
      }),
      prisma.sellerProfile.update({
        where: { id: parsed.data.sellerId },
        data: {
          verificationStatus: approving ? "APPROVED" : "REJECTED",
          verifiedAt: approving ? new Date() : null,
        },
      }),
    ]);

    // §6.11 — when a seller is newly verified, recompute risk scores on their
    // PENDING_REVIEW products and auto-publish anything below the threshold.
    let republished = 0;
    if (approving) {
      const candidates = await prisma.product.findMany({
        where: { sellerId: parsed.data.sellerId, status: "PENDING_REVIEW" },
      });
      for (const product of candidates) {
        const score = computeRiskScore({
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          productType: product.productType,
          deliveryType: product.deliveryType,
          isSellerVerified: true,
        });
        if (!isHighRisk(score)) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              status: "PUBLISHED",
              isModerated: true,
              isVerified: true,
              riskScore: score,
            },
          });
          await logAudit({
            actorId: session.user.id,
            action: "PRODUCT_APPROVED",
            subject: `Product:${product.id}`,
            metadata: { reason: "seller_newly_verified" },
          });
          republished += 1;
        }
      }
    }

    await logAudit({
      actorId: session.user.id,
      action: approving ? "SELLER_VERIFIED" : "SELLER_REJECTED",
      subject: `Seller:${parsed.data.sellerId}`,
      metadata: { republished },
    });
    return NextResponse.json({ ok: true, republished });
  } catch (err) {
    return toApiResponse(err);
  }
}
