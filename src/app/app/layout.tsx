import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserPrimaryOrgId } from "@/lib/org";
import SignOutButton from "@/app/app/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user) redirect("/login");
  const userId = (session.user as { id?: string }).id ?? null;
  if (!userId) redirect("/login");

  const orgId = await getUserPrimaryOrgId(userId);
  if (!orgId) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link className="text-sm font-semibold tracking-tight" href="/">
              SDAC
            </Link>
            <nav className="ml-2 hidden items-center gap-3 text-sm text-zinc-600 sm:flex">
              <Link className="hover:underline" href="/app">
                Links
              </Link>
              <Link className="hover:underline" href="/app/billing">
                Billing
              </Link>
              <Link className="hover:underline" href="/app/leads">
                Leads
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-zinc-600 sm:block">
              {session.user.email}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
