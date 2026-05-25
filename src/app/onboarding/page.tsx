import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserPrimaryOrgId } from "@/lib/org";
import OnboardingForm from "@/app/onboarding/setup-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) redirect("/login");

  const existingOrgId = await getUserPrimaryOrgId(userId);
  if (existingOrgId) redirect("/app");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your organization
          </h1>
          <p className="text-sm text-zinc-600">
            This sets up your workspace. Next, you’ll complete checkout to unlock unlimited links and analytics.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
