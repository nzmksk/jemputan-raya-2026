import { notFound } from "next/navigation";
import { getGuest } from "@/lib/google-sheets";
import InvitePage from "@/components/InvitePage";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function Page({ params }: Props) {
  const { token } = await params;

  const guest = await getGuest(token);
  if (!guest) notFound();

  return (
    <InvitePage
      token={guest.token}
      guestName={guest.name}
      hasRsvp={guest.hasRsvp}
      rsvpAttending={guest.rsvpAttending}
    />
  );
}
