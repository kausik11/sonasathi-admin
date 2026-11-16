import { NextResponse } from "next/server";

type MetalsResponse = { status?: string; error_message?: string; timestamp?: string; rates?: Record<string, number>; metals?: Record<string, number> };

export async function POST() {
  const apiKey = process.env.METALSDEV_API_KEY;
  if (!apiKey) return NextResponse.json({ success: false, message: "METALSDEV_API_KEY is not configured. Enter a manual reference rate or add the key to the server environment." }, { status: 503 });
  const url = new URL("https://api.metals.dev/v1/metal/authority");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("authority", "ibja");
  url.searchParams.set("currency", "INR");
  url.searchParams.set("unit", "g");
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
    const body = await response.json() as MetalsResponse;
    const candidates = [body.rates?.ibja_gold, body.rates?.gold, body.metals?.ibja_gold, body.metals?.gold];
    const rate24k = candidates.find((value) => typeof value === "number" && Number.isFinite(value) && value > 0);
    if (!response.ok || body.status === "failure" || !rate24k) {
      return NextResponse.json({ success: false, message: body.error_message ?? `Metals.Dev returned HTTP ${response.status} or no IBJA gold rate.` }, { status: 502 });
    }
    return NextResponse.json({ success: true, rate24k, source: "Metals.Dev / IBJA", fetchedAt: body.timestamp ?? new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The rate service could not be reached.";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
