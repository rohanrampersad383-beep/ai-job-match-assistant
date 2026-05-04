import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { runAllEnabledSources, runDiscoveryForSource } from "@/lib/discovery/run";

export const dynamic = "force-dynamic";

function getCronSecret(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return request.headers.get("x-cron-secret");
}

async function getRequestedSourceId(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { sourceId?: unknown };
    return typeof body.sourceId === "string" && body.sourceId ? body.sourceId : undefined;
  }

  const formData = await request.formData().catch(() => null);
  const sourceId = formData ? String(formData.get("sourceId") ?? "") : "";
  return sourceId || undefined;
}

export async function POST(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const providedSecret = getCronSecret(request);
  const authorizedBySecret = Boolean(configuredSecret && providedSecret && configuredSecret === providedSecret);
  const user = authorizedBySecret ? null : await getCurrentUser();

  if (!authorizedBySecret && !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sourceId = await getRequestedSourceId(request);
    const result = sourceId
      ? await runDiscoveryForSource(sourceId, user?.id)
      : await runAllEnabledSources(user?.id);

    return NextResponse.json({
      ok: true,
      sourceId: sourceId ?? null,
      result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown discovery failure"
      },
      { status: 500 }
    );
  }
}
