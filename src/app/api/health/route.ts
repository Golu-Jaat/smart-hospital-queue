import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  const startedAt = performance.now();

  if (!isSupabaseConfigured) {
    return Response.json(
      {
        status: "degraded",
        service: "smart-hospital-queue",
        database: "not_configured",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: responseHeaders },
    );
  }

  try {
    const { error } = await supabase
      .from("hospitals")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(1500));

    if (error) throw error;

    return Response.json(
      {
        status: "ok",
        service: "smart-hospital-queue",
        database: "reachable",
        latencyMs: Math.round(performance.now() - startedAt),
        timestamp: new Date().toISOString(),
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error("Health check failed", {
      name: error instanceof Error ? error.name : "DatabaseError",
      message: error instanceof Error ? error.message : "Database unavailable",
    });

    return Response.json(
      {
        status: "degraded",
        service: "smart-hospital-queue",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: responseHeaders },
    );
  }
}
