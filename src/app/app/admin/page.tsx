import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSuperuserEmail } from "@/lib/superuser";
import AdminPanel from "@/app/app/admin/panel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!isSuperuserEmail(email)) redirect("/app");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Admin</div>
        <h1 className="text-2xl font-semibold tracking-tight">Superuser tools</h1>
        <p className="text-sm text-zinc-600">
          Use this to run safe demos: add members, set demo entitlements, and (optionally) assign a subdomain.
        </p>
      </div>
      <AdminPanel />
    </div>
  );
}
