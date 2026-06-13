"use client";

import Link from "next/link";

import { useDemoStore } from "@/lib/demo-store";
import type { UserRole } from "@/lib/types";

export function Guard({
  role,
  children,
  title,
}: {
  role?: UserRole;
  title: string;
  children: React.ReactNode;
}) {
  const { currentUser, ready } = useDemoStore();

  if (!ready) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#11161f] p-8 text-white/70">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#11161f] p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">{title}</p>
        <h1 className="mt-3 text-3xl font-black text-white">Нужен вход в аккаунт</h1>
        <p className="mt-3 max-w-2xl text-white/65">
          Для доступа к этому разделу войдите под demo buyer, seller или admin аккаунтом.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 inline-flex rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black"
        >
          Перейти к входу
        </Link>
      </div>
    );
  }

  if (role && currentUser.role !== role) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#11161f] p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">{title}</p>
        <h1 className="mt-3 text-3xl font-black text-white">Недостаточно прав</h1>
        <p className="mt-3 max-w-2xl text-white/65">
          Текущий аккаунт не подходит для этого кабинета. Переключитесь на нужную роль на странице
          входа.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
