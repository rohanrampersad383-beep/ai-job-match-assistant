"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { type ActionState } from "@/lib/actions/shared";

export function ActionMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isError = state.status === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-[var(--danger)]/30 bg-[var(--danger)]/8 text-[var(--danger)]"
          : "border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]"
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{state.message}</span>
    </div>
  );
}
