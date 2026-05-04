import { PropsWithChildren } from "react";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-12">
      {children}
    </main>
  );
}

