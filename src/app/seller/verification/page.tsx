import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleNav } from "@/components/role-nav";
import { VerificationForm } from "./form";

const NAV = [
  { href: "/seller", label: "Overview" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/payouts", label: "Payouts" },
  { href: "/seller/verification", label: "Verification" },
];

export default async function SellerVerification() {
  const session = await auth();
  if (!session?.user.sellerProfileId) redirect("/seller");
  const [profile, request] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { id: session.user.sellerProfileId } }),
    prisma.sellerVerificationRequest.findFirst({
      where: { sellerId: session.user.sellerProfileId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!profile) redirect("/seller");

  return (
    <div className="container py-10 space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Seller verification</h1>
        <RoleNav items={NAV} current="/seller/verification" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Verified sellers get a badge, faster auto-publishing, and lower-risk scoring on new listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={profile.verificationStatus === "APPROVED" ? "success" : "warning"}>
            {profile.verificationStatus.toLowerCase()}
          </Badge>
          {profile.verifiedAt && (
            <div className="text-xs text-muted-foreground mt-2">
              Verified on {new Date(profile.verifiedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit verification request</CardTitle>
          <CardDescription>
            Provide accurate business info and confirm you have the right to sell each product you list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationForm
            initial={
              request
                ? {
                    fullName: request.fullName,
                    country: request.country,
                    contactEmail: request.contactEmail,
                    websiteUrl: request.websiteUrl ?? "",
                    productsDescription: request.productsDescription,
                    authorizationNotes: request.authorizationNotes,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
