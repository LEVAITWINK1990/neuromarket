"use client";

import { Guard } from "@/components/guard";
import { PageShell } from "@/components/page-shell";
import { demoUsers } from "@/lib/demo-data";

export default function AdminUsersPage() {
  return (
    <PageShell>
      <Guard title="Admin users" role="ADMIN">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[#11161f] p-6">
            <h1 className="text-4xl font-black text-white">Users</h1>
          </section>
          <div className="space-y-4">
            {demoUsers.map((user) => (
              <div key={user.id} className="rounded-[28px] border border-white/10 bg-[#11161f] p-5">
                <div className="text-lg font-black text-white">{user.email}</div>
                <div className="mt-1 text-sm text-white/55">{user.role}</div>
              </div>
            ))}
          </div>
        </div>
      </Guard>
    </PageShell>
  );
}
