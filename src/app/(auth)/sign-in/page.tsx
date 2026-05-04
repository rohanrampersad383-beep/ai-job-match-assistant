import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";
import { signInAction } from "@/lib/actions/auth";

export default function SignInPage() {
  return (
    <div className="w-full max-w-xl space-y-6">
      <AuthForm
        action={signInAction}
        description="Sign in to review ranked jobs, update your profile, and keep application prep editable and manual."
        submitLabel="Sign in"
        title="Welcome back"
      />
      <p className="text-center text-sm text-[var(--muted)]">
        Need an account?{" "}
        <Link className="font-semibold text-[var(--primary)]" href="/sign-up">
          Create one here
        </Link>
        .
      </p>
    </div>
  );
}

