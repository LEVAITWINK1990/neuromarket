import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/seller");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") redirect("/");
  return <>{children}</>;
}
