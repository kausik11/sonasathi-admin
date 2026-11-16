"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JewelleryImageManager from "../jewellery/JewelleryImageManager";
import { getDemoSession, signOutOfDemo, type DemoRole, type DemoSession } from "../../services/demoSession";

export default function DemoDashboard({ role }: { role: DemoRole }) {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const activeSession = getDemoSession();
      if (!activeSession || activeSession.role !== role) {
        router.replace("/");
        return;
      }
      setSession(activeSession);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [role, router]);

  if (!session) {
    return <main className="grid min-h-screen place-items-center bg-[#f7f5f1] text-sm text-gray-600">Loading your demo dashboard…</main>;
  }

  const isAdmin = session.role === "admin";

  return (
    <div className="min-h-screen bg-[#f7f5f1]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-10">
        <div>
          <p className="font-semibold tracking-wide text-gray-950">SONASATHI</p>
          <p className="text-xs text-gray-500">{isAdmin ? "Admin dashboard" : "Jeweller dashboard"} · Local demo</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.name}</span>
          <button
            type="button"
            onClick={() => { signOutOfDemo(); router.replace("/"); }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>
      <JewelleryImageManager
        key={session.id}
        initialJewellerId={isAdmin ? undefined : session.id}
        allowJewellerSelection={isAdmin}
      />
    </div>
  );
}
