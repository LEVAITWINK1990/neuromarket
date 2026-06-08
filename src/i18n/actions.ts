"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "./config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function setLocale(formData: FormData): Promise<void> {
  const next = formData.get("locale");
  if (!isLocale(next)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, next, {
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
  });
  revalidatePath("/", "layout");
}
