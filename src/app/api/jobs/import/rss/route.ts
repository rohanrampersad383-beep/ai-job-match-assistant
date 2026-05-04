import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { importJobsFromRss } from "@/lib/jobs/importers";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const formData = await request.formData();
    await importJobsFromRss(user.id, Object.fromEntries(formData.entries()));
    return NextResponse.redirect(new URL("/jobs/import?status=rss-success", request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/jobs/import?error=rss-failed", request.url));
  }
}
