import { NextResponse } from "next/server";
import { sanitizeError } from "@/lib/validation";

/**
 * GET /api/predict
 *
 * Server-side proxy for Jupiter Prediction API events.
 * Avoids exposing the upstream URL and API keys to the client.
 */
export async function GET() {
  try {
    const res = await fetch("https://api.jup.ag/prediction/v1/events?limit=12", {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
