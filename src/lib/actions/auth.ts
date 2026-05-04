"use server";

import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@/lib/auth";
import { createUserSession, destroyUserSession } from "@/lib/auth/session";
import { prisma, isDatabaseConfigured } from "@/lib/db/prisma";
import { errorState, type ActionState } from "@/lib/actions/shared";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

export async function signUpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDatabaseConfigured) {
    return errorState("DATABASE_URL is not configured yet.");
  }

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Unable to create account.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (existingUser) {
    return errorState("An account with that email already exists.");
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.fullName,
      passwordHash: await hashPassword(parsed.data.password),
      preferences: {
        create: {}
      },
      scoringSettings: {
        create: {}
      }
    }
  });

  await createUserSession(user.id);
  redirect("/onboarding");
  return {
    status: "success"
  };
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDatabaseConfigured) {
    return errorState("DATABASE_URL is not configured yet.");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Unable to sign in.");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (!user) {
    return errorState("No account matches that email.");
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isValid) {
    return errorState("The password is incorrect.");
  }

  await createUserSession(user.id);
  redirect(user.onboardingComplete ? "/dashboard" : "/onboarding");
  return {
    status: "success"
  };
}

export async function signOutAction() {
  await destroyUserSession();
  redirect("/sign-in");
}
