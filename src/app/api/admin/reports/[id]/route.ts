import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiRole } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

const schema = z.object({
  action: z.enum(["DISMISS", "RESOLVE", "SUSPEND_PRODUCT"]),
  productId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiRole("ADMIN");
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, "Invalid");
    await prisma.productReport.update({
      where: { id: params.id },
      data: {
        status:
          parsed.data.action === "DISMISS"
            ? "DISMISSED"
            : parsed.data.action === "RESOLVE"
              ? "RESOLVED"
              : "RESOLVED",
        resolvedAt: new Date(),
      },
    });
    if (parsed.data.action === "SUSPEND_PRODUCT" && parsed.data.productId) {
      await prisma.product.update({
        where: { id: parsed.data.productId },
        data: { status: "SUSPENDED", isModerated: true },
      });
      await logAudit({
        actorId: session.user.id,
        action: "PRODUCT_SUSPENDED",
        subject: `Product:${parsed.data.productId}`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
