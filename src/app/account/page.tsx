import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OrganizationCard from "@/components/auth/account/organization/organization-card";
import UserCard from "@/components/auth/account/user/user-card";
import { auth } from "@/lib/auth";

export default async function AccountPage() {
  const [session, activeSessions, organization] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.listSessions({
      headers: await headers(),
    }),
    auth.api.getFullOrganization({
      headers: await headers(),
    }),
  ]).catch((e) => {
    console.log(e);
    throw redirect("/sign-in");
  });

  return (
    <div className="flex flex-col gap-6">
      <UserCard session={session} activeSessions={activeSessions} />
      <OrganizationCard
        session={JSON.parse(JSON.stringify(session))}
        activeOrganization={JSON.parse(JSON.stringify(organization))}
      />
    </div>
  );
}
