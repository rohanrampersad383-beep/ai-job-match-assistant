import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { extractTextFromResumeFile, parseResumeText } from "@/lib/resume/parser";
import { storeParsedResume } from "@/lib/resume/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.redirect(new URL("/resume?error=missing-file", request.url));
    }

    const rawText = await extractTextFromResumeFile(file);
    const parsedResume = parseResumeText(rawText);

    await storeParsedResume({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      rawText,
      parsedResume
    });

    return NextResponse.redirect(new URL("/resume?status=uploaded", request.url));
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/resume?error=upload-failed", request.url));
  }
}

