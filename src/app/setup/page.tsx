import { prisma } from "@/lib/prisma";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const userCount = await prisma.user.count();
  const isAlreadySetup = userCount > 0;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Initial setup
          </h1>
          <p className="text-sm text-zinc-600">
            Create the first organization and owner account.
          </p>
        </div>

        {isAlreadySetup ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-700">
              Setup is already complete. Go to{" "}
              <a className="underline" href="/login">
                Sign in
              </a>
              .
            </p>
          </div>
        ) : (
          <SetupForm />
        )}

        <p className="text-xs text-zinc-500">
          Tip: after setup, this page locks automatically.
        </p>
      </div>
    </div>
  );
}
