
import { LandingPage } from "~/app/_components/landing";
import { Dashboard } from "~/app/_components/dashboard";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      {session?.user ? <Dashboard session={session} /> : <LandingPage />}
    </HydrateClient>
  );
}
