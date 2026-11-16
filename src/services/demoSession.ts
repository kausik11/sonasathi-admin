import { getJewellers } from "./dashboardDataService";

export type DemoRole = "admin" | "jeweller";
export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  dashboard: string;
};

const SESSION_KEY = "sonasathi:demo-session";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: "admin-001", name: "Super Admin", email: "admin@sonasathi.demo", password: "Admin@12345", role: "admin", dashboard: "/admin/dashboard" },
  { id: "jeweller-001", name: "Jeweller 1", email: "jeweller1@sonasathi.demo", password: "Jeweller@12345", role: "jeweller", dashboard: "/jeweller/dashboard" },
  { id: "jeweller-002", name: "Jeweller 2", email: "jeweller2@sonasathi.demo", password: "Jeweller@12345", role: "jeweller", dashboard: "/jeweller/dashboard" },
];

export type DemoSession = Pick<DemoAccount, "id" | "name" | "email" | "role" | "dashboard">;

export function signInToDemo(email: string, password: string): DemoSession | null {
  if (typeof window === "undefined") return null;
  const fixedAdmin = DEMO_ACCOUNTS.find((item) => item.role === "admin" && item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
  let jeweller: ReturnType<typeof getJewellers>[number] | undefined;
  try { jeweller = getJewellers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password && item.status === "active"); }
  catch { return null; }
  if (!fixedAdmin && !jeweller) return null;
  const session: DemoSession = fixedAdmin
    ? { id: fixedAdmin.id, name: fixedAdmin.name, email: fixedAdmin.email, role: fixedAdmin.role, dashboard: fixedAdmin.dashboard }
    : { id: jeweller!.id, name: jeweller!.name, email: jeweller!.email, role: "jeweller", dashboard: "/jeweller/dashboard" };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signInDemoAccount(accountId: string): DemoSession | null {
  if (typeof window === "undefined") return null;
  const admin = DEMO_ACCOUNTS.find((item) => item.id === accountId && item.role === "admin");
  if (admin) {
    const session: DemoSession = { id: admin.id, name: admin.name, email: admin.email, role: admin.role, dashboard: admin.dashboard };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  let jeweller: ReturnType<typeof getJewellers>[number] | undefined;
  try { jeweller = getJewellers().find((item) => item.id === accountId && item.status === "active"); }
  catch { return null; }
  if (!jeweller) return null;
  const session: DemoSession = { id: jeweller.id, name: jeweller.name, email: jeweller.email, role: "jeweller", dashboard: "/jeweller/dashboard" };
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as DemoSession;
    const fixedAdmin = DEMO_ACCOUNTS.find((account) => account.id === session.id && account.role === "admin");
    if (fixedAdmin) return session;
    const jeweller = getJewellers().find((item) => item.id === session.id && item.status === "active");
    return jeweller ? { id: jeweller.id, name: jeweller.name, email: jeweller.email, role: "jeweller", dashboard: "/jeweller/dashboard" } : null;
  } catch {
    return null;
  }
}

export function signOutOfDemo() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(SESSION_KEY);
}

