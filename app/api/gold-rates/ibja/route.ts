import { NextResponse } from "next/server";

type MetalsResponse = { status?: string; error_message?: string; timestamp?: string; rates?: Record<string, unknown>; metals?: Record<string, unknown> };

export async function GET() {
  const apiKey = process.env.METALS_DEV_API_KEY ?? process.env.METALSDEV_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, source: "Metals.Dev / IBJA", message: "METALS_DEV_API_KEY is not configured on the server. Set it in the deployment environment to fetch rates." }, { status: 503 });
  const url = new URL("https://api.metals.dev/v1/metal/authority");
  url.searchParams.set("api_key", apiKey); url.searchParams.set("authority", "ibja"); url.searchParams.set("currency", "INR"); url.searchParams.set("unit", "g");
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
    const body = await response.json() as MetalsResponse;
    const candidates = [body.rates?.ibja_gold, body.rates?.gold, body.metals?.ibja_gold, body.metals?.gold];
    const rate = candidates.map((value) => typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN).find((value) => Number.isFinite(value) && value > 0);
    if (!response.ok || body.status === "failure" || !rate) return NextResponse.json({ success: false, source: "Metals.Dev / IBJA", message: body.error_message ?? `Metals.Dev returned HTTP ${response.status} or no usable IBJA gold reference.` }, { status: 502 });
    const sourceTimestamp = body.timestamp ?? new Date().toISOString();
    return NextResponse.json({ success: true, rate24k: rate, referencePurityKarat: 24, source: "Metals.Dev / IBJA", sourceTimestamp, fetchedAt: new Date().toISOString(), currency: "INR", unit: "g", message: "IBJA reference rate returned by Metals.Dev. Other purities are proportional estimates." });
  } catch (error) {
    return NextResponse.json({ success: false, source: "Metals.Dev / IBJA", message: error instanceof Error ? error.message : "The rate service could not be reached." }, { status: 502 });
  }
}
