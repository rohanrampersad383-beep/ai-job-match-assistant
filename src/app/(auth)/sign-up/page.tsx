import Link from "next/link";

import { AuthForm } from "@/components/forms/auth-form";
import { signUpAction } from "@/lib/actions/auth";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-xl space-y-6">
      <AuthForm
        action={signUpAction}
        description="Create your account, define your job targets, and keep every application submission under your manual control."
        includeName
        submitLabel="Create account"
        title="Create your workspace"
      />
      <p className="text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link className="font-semibold text-[var(--primary)]" href="/sign-in">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}

