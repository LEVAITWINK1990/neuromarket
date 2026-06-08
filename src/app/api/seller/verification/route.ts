import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sellerVerificationSchema } from "@/lib/validation";
import { requireApiSellerSession } from "@/lib/guards";
import { ApiError, toApiResponse } from "@/lib/api-error";

export async function POST(req: Request) {
  try {
    const session = await requireApiSellerSession();
    const parsed = sellerVerificationSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid request");
    }
    await prisma.sellerVerificationRequest.create({
      data: {
        sellerId: session.user.sellerProfileId!,
        ...parsed.data,
        acceptedRules: parsed.data.acceptedRules,
        status: "PENDING",
      },
    });
    await prisma.sellerProfile.update({
      where: { id: session.user.sellerProfileId! },
      data: {
        verificationStatus: "PENDING",
        contactEmail: parsed.data.contactEmail,
        country: parsed.data.country,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return toApiResponse(err);
  }
}
