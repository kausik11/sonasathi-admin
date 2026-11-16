"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS, signInDemoAccount, signInToDemo } from "../src/services/demoSession";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login(accountEmail: string, accountPassword: string) {
    const session = signInToDemo(accountEmail, accountPassword);
    if (!session) {
      setError("That email and password do not match a Sonasathi demo account.");
      return;
    }
    router.push(session.dashboard);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    login(email, password);
  }

  return (
    <main className="min-h-screen bg-[#f7f5f1] text-[#231f1a]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#201b16] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
          <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full border border-[#d8b675]/20" />
          <div className="absolute -right-8 top-[30%] h-64 w-64 rounded-full border border-[#d8b675]/25" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#d8b675] text-lg font-semibold text-[#201b16]">S</div>
            <div>
              <p className="text-lg font-semibold tracking-wide">SONASATHI</p>
              <p className="text-xs text-white/60">Jewellery business hub</p>
            </div>
          </div>
          <div className="relative max-w-xl py-16">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[#d8b675]">Welcome back</p>
            <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">Every detail of your jewellery business, in one place.</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">Sign in to manage your shop and keep your product catalogue up to date.</p>
          </div>
          <p className="relative text-xs text-white/45">Local demo · Your jewellery images stay in this browser profile.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-9 lg:hidden">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[#d8b675] font-semibold">S</div>
              <p className="text-sm font-semibold tracking-[0.16em]">SONASATHI</p>
              <p className="mt-1 text-xs text-gray-500">Jewellery business hub</p>
            </div>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a773e]">Account access</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm text-gray-600">Use your demo account to continue to Sonasathi.</p>
            </div>

            <form onSubmit={submit} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(35,31,26,0.45)] sm:p-8">
              <label className="block text-sm font-medium text-gray-800">
                Email address
                <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 block w-full rounded-lg border border-gray-300 px-3.5 py-3 font-normal outline-none transition focus:border-[#9a773e] focus:ring-2 focus:ring-[#d8b675]/30" />
              </label>
              <label className="block text-sm font-medium text-gray-800">
                Password
                <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="mt-2 block w-full rounded-lg border border-gray-300 px-3.5 py-3 font-normal outline-none transition focus:border-[#9a773e] focus:ring-2 focus:ring-[#d8b675]/30" />
              </label>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button className="w-full rounded-lg bg-[#201b16] px-4 py-3 font-medium text-white transition hover:bg-[#393026]">Sign in</button>

              <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />quick demo access<span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button key={account.id} type="button" onClick={() => { const session = signInDemoAccount(account.id); if (session) router.push(session.dashboard); else setError("This jeweller account is inactive."); }} className="flex items-center justify-between rounded-lg border border-gray-200 px-3.5 py-3 text-left text-sm transition hover:border-[#c4a66d] hover:bg-[#fbf8f1]">
                    <span className="font-medium text-gray-800">{account.name}</span>
                    <span className="text-xs text-gray-500">{account.role === "admin" ? "Admin" : "Jeweller"} →</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-[11px] leading-5 text-gray-500">Demo sign-in only. This local browser flow is not production authentication.</p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
