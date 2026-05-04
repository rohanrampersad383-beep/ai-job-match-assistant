import { PropsWithChildren } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { SetupRequired } from "@/components/layout/setup-required";
import { requireUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";

export default async function ProtectedAppLayout({ children }: PropsWithChildren) {
  if (!isDatabaseConfigured) {
    return <SetupRequired />;
  }

  const user = await requireUser();

  return <AppShell userName={user.fullName}>{children}</AppShell>;
}

