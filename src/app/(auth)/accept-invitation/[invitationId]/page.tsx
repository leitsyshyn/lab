import InvitationPage from "@/components/auth/invitation-page";

interface AcceptInvitationPageProps {
  params: Promise<{
    invitationId: string;
  }>;
}

export default async function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  const { invitationId } = await params;

  return <InvitationPage invitationId={invitationId} />;
}
