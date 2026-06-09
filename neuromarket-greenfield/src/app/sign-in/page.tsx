"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { demoUsers } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useDemoStore();
  const [email, setEmail] = useState("buyer1@neuromarket.dev");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.error ?? "Ошибка входа");
      return;
    }
    router.push("/");
  };

  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <section className="rounded-[32px] border border-white/10 bg-[#11161f] p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Sign in</p>
          <h1 className="mt-3 text-4xl font-black text-white">
            Вход в buyer / seller / admin demo
          </h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/65">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none ring-0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/65">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[22px] border border-white/10 bg-[#0d131c] px-4 py-3 outline-none ring-0"
                type="password"
              />
            </div>
            {error ? (
              <div className="rounded-[22px] bg-[#2a1111] px-4 py-3 text-sm text-[#fca5a5]">
                {error}
              </div>
            ) : null}
            <button className="rounded-full bg-[#f97316] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-black">
              Continue
            </button>
          </form>
        </section>

        <aside className="rounded-[32px] border border-white/10 bg-[#11161f] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">
            Demo accounts
          </p>
          <div className="mt-4 space-y-3">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
                className="w-full rounded-[22px] border border-white/10 bg-[#0d131c] p-4 text-left transition hover:border-[#f97316]/40"
              >
                <div className="text-sm font-black text-white">{user.role}</div>
                <div className="mt-1 text-sm text-white/55">{user.email}</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
