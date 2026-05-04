import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { importJobsFromCsv } from "@/lib/jobs/importers";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const formData = await request.formData();
    const sourceName = String(formData.get("sourceName") ?? "CSV Import");
    const file = formData.get("file");
    const csvText = formData.get("csvText");

    let payload = "";

    if (file instanceof File) {
      payload = await file.text();
    } else if (typeof csvText === "string") {
      payload = csvText;
    }

    if (!payload.trim()) {
      return NextResponse.redirect(new URL("/jobs/import?error=csv-empty", request.url));
    }

    await importJobsFromCsv(user.id, payload, sourceName);
    return NextResponse.redirect(new URL("/jobs/import?status=csv-success", request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/jobs/import?error=csv-failed", request.url));
  }
}

